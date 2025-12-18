const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const pool = require('../db/index')

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Get user data with new schema
    const userResult = await pool.query(
      `SELECT u.*, w.available_balance, w.pending_balance, w.total_earned
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.id = $1`,
      [userId]
    )
    
    const user = userResult.rows[0]
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' })
    }

    // Get network stats from binary tree
    const binaryResult = await pool.query(
      `SELECT left_volume, right_volume, personal_volume
       FROM binary_tree WHERE user_id = $1`,
      [userId]
    )
    const binaryData = binaryResult.rows[0] || { left_volume: 0, right_volume: 0, personal_volume: 0 }

    // Count direct sponsored
    const directsResult = await pool.query(
      `SELECT COUNT(*) as count FROM sponsor_tree WHERE sponsor_id = $1`,
      [userId]
    )
    const directSponsored = parseInt(directsResult.rows[0]?.count) || 0

    // Count total downline
    const downlineResult = await pool.query(
      `SELECT COUNT(*) as count FROM sponsor_tree_closure 
       WHERE ancestor_id = $1 AND descendant_id != $1`,
      [userId]
    )
    const totalDownline = parseInt(downlineResult.rows[0]?.count) || 0

    // Get recent commissions
    const commissionsResult = await pool.query(
      `SELECT type, amount, status, created_at, description
       FROM commissions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    )

    // Calculate this month commissions
    const monthCommResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM commissions 
       WHERE user_id = $1 
       AND created_at >= date_trunc('month', CURRENT_DATE)
       AND status IN ('available', 'paid')`,
      [userId]
    )
    const thisMonthCommissions = parseFloat(monthCommResult.rows[0]?.total) || 0

    // Get last month for comparison
    const lastMonthCommResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM commissions 
       WHERE user_id = $1 
       AND created_at >= date_trunc('month', CURRENT_DATE - interval '1 month')
       AND created_at < date_trunc('month', CURRENT_DATE)
       AND status IN ('available', 'paid')`,
      [userId]
    )
    const lastMonthCommissions = parseFloat(lastMonthCommResult.rows[0]?.total) || 0

    // Calculate trend
    const trend = lastMonthCommissions > 0 
      ? ((thisMonthCommissions - lastMonthCommissions) / lastMonthCommissions * 100).toFixed(1)
      : 0

    // Get notifications count
    const notifResult = await pool.query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = $1 AND read = false`,
      [userId]
    )
    const unreadNotifications = parseInt(notifResult.rows[0]?.count) || 0

    // Build response matching frontend expectations
    res.json({
      success: true,
      data: {
        wallet: {
          available: parseFloat(user.available_balance) || 0,
          pending: parseFloat(user.pending_balance) || 0,
          earned: parseFloat(user.total_earned) || 0,
        },
        network: {
          totalDownline,
          activeDownline: totalDownline, // Simplified
          leftVolume: parseFloat(binaryData.left_volume) || 0,
          rightVolume: parseFloat(binaryData.right_volume) || 0,
          directSponsored,
        },
        rank: {
          current: user.current_rank || 'UNRANKED',
          progress: 50, // TODO: Calculate actual progress
          nextRank: getNextRank(user.current_rank),
        },
        commissions: {
          thisMonth: thisMonthCommissions,
          lastMonth: lastMonthCommissions,
          trend: parseFloat(trend),
        },
        referralCode: user.referral_code,
        notifications: unreadNotifications,
        recentCommissions: commissionsResult.rows,
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ success: false, message: 'Errore nel caricamento della dashboard' })
  }
})

function getNextRank(currentRank) {
  const ranks = ['UNRANKED', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
  const currentIndex = ranks.indexOf(currentRank || 'UNRANKED')
  return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : 'DIAMOND'
}

module.exports = router
