const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const pool = require('../db/index')
const nodemailer = require('nodemailer')

// Email transporter (configure with your SMTP settings)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
})

// ============================================
// REQUEST PASSWORD RESET
// ============================================
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email richiesta' })
    }

    // Find user
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    )

    // Always return success (security best practice)
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Se l\'email esiste, riceverai un link per il reset della password'
      })
    }

    const user = userResult.rows[0]

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 3600000) // 1 hour

    // Save token
    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    )

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@3blex.com',
        to: user.email,
        subject: 'Reset Password - 3Blex Network',
        html: `
          <h2>Reset Password</h2>
          <p>Ciao ${user.name},</p>
          <p>Hai richiesto il reset della password. Clicca sul link qui sotto per procedere:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Il link scadrà tra 1 ora.</p>
          <p>Se non hai richiesto questo reset, ignora questa email.</p>
        `
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail if email fails, but log it
    }

    res.json({
      success: true,
      message: 'Se l\'email esiste, riceverai un link per il reset della password'
    })

  } catch (error) {
    console.error('Error requesting password reset:', error)
    res.status(500).json({ success: false, message: 'Errore nella richiesta reset password' })
  }
})

// ============================================
// VERIFY RESET TOKEN
// ============================================
router.get('/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params

    const result = await pool.query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token non valido o scaduto'
      })
    }

    res.json({
      success: true,
      message: 'Token valido'
    })

  } catch (error) {
    console.error('Error verifying reset token:', error)
    res.status(500).json({ success: false, message: 'Errore nella verifica token' })
  }
})

// ============================================
// RESET PASSWORD
// ============================================
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token e nuova password richiesti' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'La password deve essere di almeno 8 caratteri' })
    }

    // Find user by token
    const userResult = await pool.query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    )

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token non valido o scaduto'
      })
    }

    const userId = userResult.rows[0].id

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, userId]
    )

    res.json({
      success: true,
      message: 'Password resettata con successo'
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    res.status(500).json({ success: false, message: 'Errore nel reset password' })
  }
})

module.exports = router

