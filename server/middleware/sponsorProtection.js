const pool = require('../db/index')
const { logSponsorChange } = require('../utils/activityLogger')

/**
 * Middleware to protect sponsor/placement changes
 * Only admins can change sponsors, and it must be logged
 */
async function protectSponsorChange(req, res, next) {
  // Only apply to routes that change sponsor or placement
  if (!req.body.sponsorId && !req.body.placementSide && !req.body.referredBy) {
    return next()
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Solo gli amministratori possono modificare sponsor o placement'
    })
  }

  // Get current sponsor/placement
  const userId = req.params.userId || req.body.userId
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID richiesto'
    })
  }

  try {
    const userResult = await pool.query(
      'SELECT referred_by, placement_side FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      })
    }

    const currentUser = userResult.rows[0]
    const newSponsorId = req.body.sponsorId || req.body.referredBy
    const newPlacementSide = req.body.placementSide

    // Check if there's an actual change
    if (newSponsorId && newSponsorId !== currentUser.referred_by) {
      // Log the change
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      await logSponsorChange(
        parseInt(userId),
        currentUser.referred_by,
        parseInt(newSponsorId),
        req.body.reason || 'Modifica amministratore',
        req.user.id,
        ipAddress
      )
    }

    if (newPlacementSide && newPlacementSide !== currentUser.placement_side) {
      // Log placement change too
      await pool.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          parseInt(userId),
          'placement_change',
          'user',
          parseInt(userId),
          JSON.stringify({
            oldPlacement: currentUser.placement_side,
            newPlacement: newPlacementSide,
            changedBy: req.user.id,
            reason: req.body.reason || 'Modifica amministratore',
            timestamp: new Date().toISOString()
          }),
          req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
        ]
      )
    }

    next()
  } catch (error) {
    console.error('Error in sponsor protection middleware:', error)
    return res.status(500).json({
      success: false,
      message: 'Errore nella verifica dei permessi'
    })
  }
}

module.exports = protectSponsorChange

