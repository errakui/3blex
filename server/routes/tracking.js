const express = require('express')
const router = express.Router()
const pool = require('../db/index')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { updateOrderTracking, getTrackingStatus, getTrackingUrl } = require('../utils/shippingTracker')

// Get tracking status for order
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user.id

    // Check ownership or admin
    const orderResult = await pool.query(
      `SELECT id, user_id FROM orders WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [orderId, userId]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ordine non trovato' })
    }

    const tracking = await getTrackingStatus(parseInt(orderId))

    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Tracking non disponibile' })
    }

    res.json({
      success: true,
      tracking: {
        ...tracking,
        trackingUrl: tracking.trackingNumber ? getTrackingUrl(tracking.trackingNumber, tracking.carrier) : null
      }
    })
  } catch (error) {
    console.error('Error getting tracking:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero del tracking' })
  }
})

// Update tracking (admin only)
router.put('/:orderId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { orderId } = req.params
    const { trackingNumber, carrier } = req.body

    if (!trackingNumber) {
      return res.status(400).json({ success: false, message: 'Tracking number obbligatorio' })
    }

    await updateOrderTracking(parseInt(orderId), trackingNumber, carrier || 'generic')

    res.json({
      success: true,
      message: 'Tracking aggiornato con successo'
    })
  } catch (error) {
    console.error('Error updating tracking:', error)
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del tracking' })
  }
})

module.exports = router

