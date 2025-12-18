const jwt = require('jsonwebtoken')
const pool = require('../db/index')

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Token di autenticazione mancante' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, name, email, role, subscription_status, subscription_plan FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Utente non trovato' })
    }

    req.user = result.rows[0]
    next()
  } catch (error) {
    return res.status(403).json({ message: 'Token non valido' })
  }
}

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Autenticazione richiesta' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accesso negato' })
    }

    next()
  }
}

const requireNetworkAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticazione richiesta' })
  }

  const hasAccess = req.user.role === 'network_member' || req.user.role === 'admin'

  if (!hasAccess) {
    return res.status(403).json({ 
      message: 'Accesso Network richiesto. Attiva un abbonamento per continuare.' 
    })
  }

  next()
}

module.exports = {
  authenticateToken,
  requireRole,
  requireNetworkAccess,
}

