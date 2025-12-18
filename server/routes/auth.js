/**
 * Auth Routes
 * Gestisce autenticazione, registrazione e login
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserService = require('../services/UserService');
const EmailService = require('../services/EmailService');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

/**
 * POST /api/auth/register
 * Registra un nuovo utente
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, referralCode } = req.body;
    
    // Validazione
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Tutti i campi obbligatori devono essere compilati'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La password deve essere di almeno 8 caratteri'
      });
    }
    
    const user = await UserService.register(
      { email, password, firstName, lastName, phone },
      referralCode
    );
    
    // Genera token di verifica email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore
    
    // Salva il token nel database
    await pool.query(
      `UPDATE users SET 
        email_verification_token = $1, 
        email_verification_expires = $2,
        email_verified = false
       WHERE id = $3`,
      [verificationToken, tokenExpiry, user.id]
    );
    
    // Invia email di verifica
    await EmailService.sendVerificationEmail(
      { email: user.email, firstName: user.firstName },
      verificationToken
    );
    
    // Genera token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'affiliate' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Registrazione completata! Controlla la tua email per verificare l\'account.',
      user,
      token,
      emailSent: true
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login utente
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e password sono obbligatori'
      });
    }
    
    const user = await UserService.verifyLogin(email, password);
    
    // Genera token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login effettuato',
      user,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Ottieni profilo utente corrente
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profile = await UserService.getUserProfile(req.user.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }
    
    res.json({
      success: true,
      user: profile
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del profilo'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Aggiorna profilo utente
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    const updatedUser = await UserService.updateProfile(req.user.id, {
      firstName,
      lastName,
      phone
    });
    
    res.json({
      success: true,
      message: 'Profilo aggiornato',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/auth/change-password
 * Cambia password
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password attuale e nuova password sono obbligatorie'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nuova password deve essere di almeno 8 caratteri'
      });
    }
    
    await UserService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password cambiata con successo'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/auth/referral/:code
 * Verifica un referral code
 */
router.get('/referral/:code', async (req, res) => {
  try {
    const user = await UserService.getUserByReferralCode(req.params.code);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Codice referral non valido'
      });
    }
    
    res.json({
      success: true,
      sponsor: {
        name: `${user.first_name} ${user.last_name}`,
        rank: user.current_rank
      }
    });
    
  } catch (error) {
    console.error('Check referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella verifica del codice referral'
    });
  }
});

module.exports = router;
