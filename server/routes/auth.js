const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db/index')
const crypto = require('crypto')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Generate referral code
const generateReferralCode = () => {
  return crypto.randomBytes(6).toString('hex').toUpperCase()
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Tutti i campi sono obbligatori' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La password deve essere di almeno 8 caratteri' })
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email già registrata' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Generate unique referral code
    let uniqueReferralCode = generateReferralCode()
    let codeExists = true
    while (codeExists) {
      const checkCode = await pool.query('SELECT id FROM users WHERE referral_code = $1', [uniqueReferralCode])
      if (checkCode.rows.length === 0) {
        codeExists = false
      } else {
        uniqueReferralCode = generateReferralCode()
      }
    }

    // Find referrer if referral code provided
    let referredBy = null
    if (referralCode) {
      const referrerResult = await pool.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referralCode.toUpperCase()]
      )
      if (referrerResult.rows.length > 0) {
        referredBy = referrerResult.rows[0].id
      }
    }

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, referral_code, referred_by, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, referral_code, subscription_status, created_at`,
      [name, email, passwordHash, uniqueReferralCode, referredBy, 'affiliate_basic']
    )

    const user = result.rows[0]

    // Auto-place in binary tree if has referrer (will be done via API call later)
    // Placement happens when user subscribes to network membership

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({
      message: 'Registrazione completata con successo',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referral_code,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Errore durante la registrazione' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password sono obbligatorie' })
    }

    // Find user
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, referral_code, subscription_status, subscription_plan FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenziali non valide' })
    }

    const user = result.rows[0]

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenziali non valide' })
    }

    // Check if 2FA is enabled
    const user2FAResult = await pool.query(
      'SELECT two_factor_enabled FROM users WHERE id = $1',
      [user.id]
    )
    const twoFactorEnabled = user2FAResult.rows[0]?.two_factor_enabled || false

    // If 2FA enabled, require token verification
    if (twoFactorEnabled) {
      const { twoFactorToken } = req.body

      if (!twoFactorToken) {
        return res.status(200).json({
          requires2FA: true,
          message: 'Inserisci il codice 2FA',
          tempToken: jwt.sign(
            { userId: user.id, email: user.email, role: user.role, temp2FA: true },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
          )
        })
      }

      // Verify 2FA token
      const twoFASecretResult = await pool.query(
        'SELECT two_factor_secret FROM users WHERE id = $1',
        [user.id]
      )
      const twoFASecret = twoFASecretResult.rows[0]?.two_factor_secret

      if (!twoFASecret) {
        return res.status(400).json({ message: '2FA non configurato correttamente' })
      }

      const speakeasy = require('speakeasy')
      const verified = speakeasy.totp.verify({
        secret: twoFASecret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2
      })

      if (!verified) {
        return res.status(401).json({ message: 'Codice 2FA non valido' })
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      message: 'Login completato con successo',
      token,
      requires2FA: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referral_code,
        subscriptionStatus: user.subscription_status,
        subscriptionPlan: user.subscription_plan,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Errore durante il login' })
  }
})

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, referral_code, subscription_status, subscription_plan,
              phone, location, notifications, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utente non trovato' })
    }

    const user = result.rows[0]

    // Get KYC status
    const kycResult = await pool.query(
      `SELECT status FROM kyc_documents 
       WHERE user_id = $1 AND status = 'approved'
       ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    )

    const kycStatus = kycResult.rows.length > 0 ? 'verified' : 
                     await pool.query(
                       `SELECT status FROM kyc_documents 
                        WHERE user_id = $1 
                        ORDER BY created_at DESC LIMIT 1`,
                       [user.id]
                     ).then(res => res.rows[0]?.status || 'not_verified') || 'not_verified'

    res.json({
      user: {
        ...user,
        kycStatus,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Errore nel recupero dell\'utente' })
  }
})

module.exports = router

