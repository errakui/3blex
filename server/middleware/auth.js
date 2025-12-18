/**
 * Authentication Middleware
 * Gestisce autenticazione JWT e controllo ruoli
 */

const jwt = require('jsonwebtoken');
const pool = require('../db/index');

/**
 * Middleware per autenticare il token JWT
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token di autenticazione mancante' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ottieni utente dal database
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, status, kyc_status, current_rank, referral_code
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Utente non trovato' 
      });
    }

    const user = result.rows[0];
    
    // Verifica che l'utente non sia sospeso
    if (user.status === 'suspended') {
      return res.status(403).json({ 
        success: false,
        message: 'Account sospeso. Contatta il supporto.' 
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      kycStatus: user.kyc_status,
      currentRank: user.current_rank,
      referralCode: user.referral_code
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token scaduto. Effettua nuovamente il login.' 
      });
    }
    return res.status(403).json({ 
      success: false,
      message: 'Token non valido' 
    });
  }
};

/**
 * Middleware per richiedere ruoli specifici
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Autenticazione richiesta' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Accesso negato. Ruolo non autorizzato.' 
      });
    }

    next();
  };
};

/**
 * Middleware per richiedere account attivo
 */
const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Autenticazione richiesta' 
    });
  }

  if (req.user.status !== 'active') {
    return res.status(403).json({ 
      success: false,
      message: 'Account non attivo. Acquista un pack di attivazione per continuare.' 
    });
  }

  next();
};

/**
 * Middleware per richiedere KYC approvato
 */
const requireKYC = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Autenticazione richiesta' 
    });
  }

  if (req.user.kycStatus !== 'approved') {
    return res.status(403).json({ 
      success: false,
      message: 'KYC richiesto. Completa la verifica dell\'identità per continuare.' 
    });
  }

  next();
};

/**
 * Middleware per admin only
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Autenticazione richiesta' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Accesso negato. Solo amministratori.' 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireActiveAccount,
  requireKYC,
  requireAdmin
};
