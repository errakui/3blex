const express = require('express')
const { authenticateToken, requireNetworkAccess } = require('../middleware/auth')
const pool = require('../db/index')

const router = express.Router()

// All routes require network access
router.use(authenticateToken)
router.use(requireNetworkAccess)

// Get network stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id

    // Get referral link
    const userResult = await pool.query(
      'SELECT referral_code, role FROM users WHERE id = $1',
      [userId]
    )
    const referralCode = userResult.rows[0]?.referral_code
    const userRole = userResult.rows[0]?.role
    const referralLink = referralCode 
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${referralCode}`
      : null

    // Get total affiliates with inactivity status
    const affiliatesResult = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.created_at, u.subscription_status, u.referral_code,
        u.current_rank, u.personal_volume, u.group_volume,
        u.subscription_end_date,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('available', 'paid')) as commission_count,
        COALESCE(SUM(c.amount) FILTER (WHERE c.status IN ('available', 'paid')), 0) as commissions_generated,
        -- Check if inactive (no activity in last 30 days)
        CASE 
          WHEN u.subscription_status = 'active' AND (u.updated_at < NOW() - INTERVAL '30 days' OR u.group_volume = 0) THEN true
          ELSE false
        END as is_inactive,
        -- Check if about to lose qualification (low volume)
        CASE 
          WHEN u.subscription_status = 'active' AND u.current_rank != 'Bronze' AND u.group_volume < 100 THEN true
          ELSE false
        END as at_risk_losing_qualification
       FROM users u
       LEFT JOIN commissions c ON c.referred_id = u.id AND c.referrer_id = $1
       WHERE u.referred_by = $1
       GROUP BY u.id, u.name, u.email, u.created_at, u.subscription_status, u.referral_code,
                u.current_rank, u.personal_volume, u.group_volume, u.subscription_end_date, u.updated_at
       ORDER BY u.created_at DESC`,
      [userId]
    )

    // Get KYC status for each affiliate
    const affiliates = await Promise.all(
      affiliatesResult.rows.map(async (affiliate) => {
        const kycResult = await pool.query(
          `SELECT status FROM kyc_documents 
           WHERE user_id = $1 
           ORDER BY created_at DESC LIMIT 1`,
          [affiliate.id]
        )
        return {
          id: affiliate.id,
          name: affiliate.name,
          email: affiliate.email,
          referralCode: affiliate.referral_code,
          registrationDate: affiliate.created_at,
          subscriptionStatus: affiliate.subscription_status,
          kycStatus: kycResult.rows[0]?.status || 'not_verified',
          commissionsGenerated: parseFloat(affiliate.commissions_generated || 0),
          isInactive: affiliate.is_inactive || false,
          atRiskLosingQualification: affiliate.at_risk_losing_qualification || false,
          currentRank: affiliate.current_rank || 'Bronze',
          groupVolume: parseFloat(affiliate.group_volume || 0),
        }
      })
    )

    // Get commission totals
    const commissionsResult = await pool.query(
      `SELECT 
        SUM(CASE WHEN status IN ('available', 'paid') THEN amount ELSE 0 END) as total,
        SUM(CASE WHEN status = 'available' THEN amount ELSE 0 END) as available,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
       FROM commissions WHERE referrer_id = $1`,
      [userId]
    )

    // Get growth data (affiliates over time)
    const growthResult = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as affiliates
       FROM users
       WHERE referred_by = $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    )

    const growthData = growthResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      affiliates: parseInt(row.affiliates),
    }))

    // Build network tree for graph visualization
    const networkTree = affiliates.map((aff, index) => ({
      id: aff.id,
      name: aff.name,
      email: aff.email,
      referralCode: aff.referralCode,
      level: 1,
      subscriptionStatus: aff.subscriptionStatus,
    }))

    // Calculate inactive and at-risk counts
    const inactiveCount = affiliates.filter(a => a.isInactive).length
    const atRiskCount = affiliates.filter(a => a.atRiskLosingQualification).length

    res.json({
      totalAffiliates: affiliates.length,
      totalCommissions: parseFloat(commissionsResult.rows[0].total || 0),
      availableCommissions: parseFloat(commissionsResult.rows[0].available || 0),
      pendingCommissions: parseFloat(commissionsResult.rows[0].pending || 0),
      referralLink,
      affiliates,
      growthData,
      networkTree,
      currentUserId: userId,
      currentUserRole: userRole,
      inactiveCount,
      atRiskCount,
    })
  } catch (error) {
    console.error('Network stats error:', error)
    res.status(500).json({ message: 'Errore nel caricamento delle statistiche network' })
  }
})

module.exports = router
