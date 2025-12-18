/**
 * Email Verification Routes
 * 3Blex Network
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db');
const EmailService = require('../services/EmailService');

/**
 * POST /api/auth/resend-verification
 * Reinvia email di verifica
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email richiesta',
      });
    }

    // Trova l'utente
    const userResult = await pool.query(
      'SELECT id, email, first_name, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Non rivelare se l'email esiste o meno
      return res.json({
        success: true,
        message: 'Se l\'email esiste, riceverai un link di verifica.',
      });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email già verificata',
      });
    }

    // Genera nuovo token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    // Salva il token
    await pool.query(
      `UPDATE users 
       SET email_verification_token = $1, email_verification_expires = $2 
       WHERE id = $3`,
      [verificationToken, tokenExpiry, user.id]
    );

    // Invia email
    await EmailService.sendVerificationEmail(
      { email: user.email, firstName: user.first_name },
      verificationToken
    );

    res.json({
      success: true,
      message: 'Email di verifica inviata',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'invio dell\'email',
    });
  }
});

/**
 * GET /api/auth/verify-email/:token
 * Verifica l'email con il token
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token non valido',
      });
    }

    // Trova l'utente con questo token
    const userResult = await pool.query(
      `SELECT id, email, first_name, last_name, referral_code, email_verification_expires 
       FROM users 
       WHERE email_verification_token = $1`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token non valido o scaduto',
      });
    }

    const user = userResult.rows[0];

    // Controlla se il token è scaduto
    if (user.email_verification_expires && new Date() > new Date(user.email_verification_expires)) {
      return res.status(400).json({
        success: false,
        message: 'Token scaduto. Richiedi un nuovo link di verifica.',
      });
    }

    // Verifica l'email
    await pool.query(
      `UPDATE users 
       SET email_verified = true, 
           email_verification_token = NULL, 
           email_verification_expires = NULL,
           status = CASE WHEN status = 'pending' THEN 'active' ELSE status END
       WHERE id = $1`,
      [user.id]
    );

    // Invia email di benvenuto
    await EmailService.sendWelcomeEmail({
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      referralCode: user.referral_code,
    });

    res.json({
      success: true,
      message: 'Email verificata con successo! Benvenuto in 3Blex.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la verifica',
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Richiede reset password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email richiesta',
      });
    }

    // Trova l'utente
    const userResult = await pool.query(
      'SELECT id, email, first_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Non rivelare se l'email esiste
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Se l\'email esiste, riceverai un link per reimpostare la password.',
      });
    }

    const user = userResult.rows[0];

    // Genera token reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

    // Salva il token
    await pool.query(
      `UPDATE users 
       SET password_reset_token = $1, password_reset_expires = $2 
       WHERE id = $3`,
      [resetToken, tokenExpiry, user.id]
    );

    // Invia email
    await EmailService.sendPasswordResetEmail(
      { email: user.email, firstName: user.first_name },
      resetToken
    );

    res.json({
      success: true,
      message: 'Se l\'email esiste, riceverai un link per reimpostare la password.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la richiesta',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reimposta la password con token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token e password richiesti',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La password deve essere di almeno 8 caratteri',
      });
    }

    // Trova l'utente con questo token
    const userResult = await pool.query(
      `SELECT id, email, password_reset_expires 
       FROM users 
       WHERE password_reset_token = $1`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token non valido o scaduto',
      });
    }

    const user = userResult.rows[0];

    // Controlla se il token è scaduto
    if (user.password_reset_expires && new Date() > new Date(user.password_reset_expires)) {
      return res.status(400).json({
        success: false,
        message: 'Token scaduto. Richiedi un nuovo link.',
      });
    }

    // Hash della nuova password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Aggiorna password
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, 
           password_reset_token = NULL, 
           password_reset_expires = NULL 
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    res.json({
      success: true,
      message: 'Password reimpostata con successo',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il reset della password',
    });
  }
});

/**
 * GET /api/email/test
 * Testa la connessione SMTP (solo admin)
 */
router.get('/test', async (req, res) => {
  try {
    const result = await EmailService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
