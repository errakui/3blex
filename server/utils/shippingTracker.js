const pool = require('../db/index')

/**
 * Update order tracking information
 */
async function updateOrderTracking(orderId, trackingNumber, carrier = 'generic') {
  try {
    await pool.query(
      `UPDATE orders 
       SET tracking_number = $1, 
           tracking_carrier = $2,
           tracking_updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [trackingNumber, carrier, orderId]
    )

    // Create notification for user
    const orderResult = await pool.query(
      'SELECT user_id FROM orders WHERE id = $1',
      [orderId]
    )

    if (orderResult.rows.length > 0 && orderResult.rows[0].user_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Tracking Aggiornato', 
                'Il tuo ordine ha un nuovo aggiornamento di tracking: ${trackingNumber}', 
                'info')`,
        [orderResult.rows[0].user_id]
      )
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating tracking:', error)
    throw error
  }
}

/**
 * Get tracking status for order
 */
async function getTrackingStatus(orderId) {
  try {
    const result = await pool.query(
      `SELECT tracking_number, tracking_carrier, status, tracking_updated_at
       FROM orders
       WHERE id = $1`,
      [orderId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const order = result.rows[0]

    // In production, this would integrate with carrier APIs
    // For now, return basic tracking info
    return {
      trackingNumber: order.tracking_number,
      carrier: order.tracking_carrier || 'generic',
      status: order.status,
      lastUpdate: order.tracking_updated_at,
      // Mock tracking events (in production, fetch from carrier API)
      events: order.tracking_number ? [
        {
          date: new Date(),
          status: order.status,
          location: 'Magazzino',
          description: 'Pacco in elaborazione'
        }
      ] : []
    }
  } catch (error) {
    console.error('Error getting tracking status:', error)
    throw error
  }
}

/**
 * Generate tracking URL based on carrier
 */
function getTrackingUrl(trackingNumber, carrier = 'generic') {
  const urls = {
    'dhl': `https://www.dhl.com/it-it/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`,
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'fedex': `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`,
    'poste': `https://www.poste.it/cerca/index.html?requestType=ucs&q=${trackingNumber}`,
    'generic': `https://www.google.com/search?q=${trackingNumber}`
  }

  return urls[carrier] || urls['generic']
}

module.exports = {
  updateOrderTracking,
  getTrackingStatus,
  getTrackingUrl
}

