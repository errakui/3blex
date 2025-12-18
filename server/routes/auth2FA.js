const express = require('express')
const router = express.Router()
const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const pool = require('../db/index')
const { authenticateToken } = require('../middleware/auth')

// ============================================
// SETUP 2FA - Generate Secret & QR Code
// ============================================
router.post('/setup-2fa', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `3Blex (${req.user.email})`,
      issuer: '3Blex Network'
    })

    // Save secret temporarily (not enabled yet)
    await pool.query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    )

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    })
  } catch (error) {
    console.error('Error setting up 2FA:', error)
    res.status(500).json({ success: false, message: 'Errore nella configurazione 2FA' })
  }
})

// ============================================
// VERIFY & ENABLE 2FA
// ============================================
router.post('/verify-2fa', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body
    const userId = req.user.id

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token richiesto' })
    }

    // Get user secret
    const userResult = await pool.query(
      'SELECT two_factor_secret FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0 || !userResult.rows[0].two_factor_secret) {
      return res.status(400).json({ success: false, message: '2FA non configurato. Esegui prima setup-2fa' })
    }

    const secret = userResult.rows[0].two_factor_secret

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    })

    if (verified) {
      // Enable 2FA
      await pool.query(
        'UPDATE users SET two_factor_enabled = true WHERE id = $1',
        [userId]
      )

      res.json({
        success: true,
        message: '2FA abilitato con successo'
      })
    } else {
      res.status(400).json({
        success: false,
        message: 'Token non valido. Riprova.'
      })
    }
  } catch (error) {
    console.error('Error verifying 2FA:', error)
    res.status(500).json({ success: false, message: 'Errore nella verifica 2FA' })
  }
})

// ============================================
// DISABLE 2FA
// ============================================
router.post('/disable-2fa', authenticateToken, async (req, res) => {
  try {
    const { password, token } = req.body
    const userId = req.user.id

    // TODO: Verify password first

    await pool.query(
      'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
      [userId]
    )

    res.json({
      success: true,
      message: '2FA disabilitato con successo'
    })
  } catch (error) {
    console.error('Error disabling 2FA:', error)
    res.status(500).json({ success: false, message: 'Errore nella disabilitazione 2FA' })
  }
})

// ============================================
// VERIFY 2FA TOKEN (for login)
// ============================================
router.post('/verify-token', async (req, res) => {
  try {
    const { email, token } = req.body

    if (!email || !token) {
      return res.status(400).json({ success: false, message: 'Email e token richiesti' })
    }

    // Get user
    const userResult = await pool.query(
      'SELECT id, two_factor_secret, two_factor_enabled FROM users WHERE email = $1',
      [email]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' })
    }

    const user = userResult.rows[0]

    if (!user.two_factor_enabled || !user.two_factor_secret) {
      return res.status(400).json({ success: false, message: '2FA non abilitato per questo utente' })
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2
    })

    if (verified) {
      res.json({
        success: true,
        message: 'Token valido'
      })
    } else {
      res.status(400).json({
        success: false,
        message: 'Token non valido'
      })
    }
  } catch (error) {
    console.error('Error verifying 2FA token:', error)
    res.status(500).json({ success: false, message: 'Errore nella verifica token' })
  }
})

module.exports = router

