const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const pool = require('../db/index')

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Get subscription status
    const userResult = await pool.query(
      'SELECT subscription_status, subscription_plan FROM users WHERE id = $1',
      [userId]
    )
    const subscriptionStatus = userResult.rows[0]?.subscription_status || 'inactive'

    // Get KYC status
    const kycResult = await pool.query(
      `SELECT status FROM kyc_documents 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    )
    const kycStatus = kycResult.rows[0]?.status === 'approved' ? 'verified' : 
                     kycResult.rows[0]?.status || 'not_verified'

    // Get recent orders
    const ordersResult = await pool.query(
      `SELECT o.id, o.order_number, o.total, o.status, o.created_at,
              json_agg(json_build_object(
                'id', oi.id,
                'name', p.name,
                'quantity', oi.quantity,
                'price', oi.price
              )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1
       GROUP BY o.id, o.order_number, o.total, o.status, o.created_at
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [userId]
    )

    const recentOrders = ordersResult.rows.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      total: parseFloat(order.total),
      status: order.status,
      date: order.created_at,
      items: order.items.filter(item => item.id !== null),
    }))

    // Get network stats if user has network access
    let networkStats = null
    const hasNetworkAccess = req.user.role === 'network_member' || req.user.role === 'admin'

    if (hasNetworkAccess) {
      // Get referral link
      const referralCode = userResult.rows[0]?.referral_code
      const referralLink = referralCode 
        ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${referralCode}`
        : null

      // Get total affiliates
      const affiliatesResult = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE referred_by = $1',
        [userId]
      )
      const totalAffiliates = parseInt(affiliatesResult.rows[0].count) || 0

      // Get commissions
      const commissionsResult = await pool.query(
        `SELECT 
          SUM(CASE WHEN status = 'available' OR status = 'paid' THEN amount ELSE 0 END) as total,
          SUM(CASE WHEN status = 'available' THEN amount ELSE 0 END) as available,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
         FROM commissions WHERE referrer_id = $1`,
        [userId]
      )

      networkStats = {
        totalAffiliates,
        totalCommissions: parseFloat(commissionsResult.rows[0].total || 0),
        availableCommissions: parseFloat(commissionsResult.rows[0].available || 0),
        pendingCommissions: parseFloat(commissionsResult.rows[0].pending || 0),
        referralLink,
      }
    }

    // Get broadcast messages
    const broadcastsResult = await pool.query(
      `SELECT * FROM broadcast_messages
       WHERE status = 'active'
       AND (target_audience = 'all' OR target_audience = $1)
       AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY 
         CASE priority
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'normal' THEN 3
           WHEN 'low' THEN 4
         END,
         created_at DESC
       LIMIT 5`,
      [req.user.role || 'affiliate_basic']
    )

    res.json({
      subscriptionStatus,
      kycStatus,
      recentOrders,
      broadcasts: broadcastsResult.rows,
      ...networkStats,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ message: 'Errore nel caricamento della dashboard' })
  }
})

module.exports = router

