const express = require('express')
const router = express.Router()
const pool = require('../db/index')
const { authenticateToken } = require('../middleware/auth')

// ============================================
// GET ALL AVAILABLE RANKS
// ============================================
router.get('/ranks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ranks ORDER BY level ASC`
    )

    res.json({
      success: true,
      ranks: result.rows.map(rank => ({
        id: rank.id,
        name: rank.name,
        displayName: rank.display_name,
        level: rank.level,
        requiredPv: parseFloat(rank.required_pv) || 0,
        requiredGv: parseFloat(rank.required_gv) || 0,
        requiredLeftVolume: parseFloat(rank.required_left_volume) || 0,
        requiredRightVolume: parseFloat(rank.required_right_volume) || 0,
        requiredQualifiedLegs: rank.required_qualified_legs || 0,
        bonusAmount: parseFloat(rank.bonus_amount) || 0,
        rewards: rank.rewards
      }))
    })
  } catch (error) {
    console.error('Error fetching ranks:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dei rank' })
  }
})

// ============================================
// GET USER CURRENT QUALIFICATION STATUS
// ============================================
router.get('/my-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Get user current volumes and rank
    const userResult = await pool.query(
      `SELECT 
        current_rank, 
        personal_volume as pv,
        group_volume as gv,
        left_volume,
        right_volume
      FROM users WHERE id = $1`,
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' })
    }

    const user = userResult.rows[0]

    // Get all ranks
    const ranksResult = await pool.query(
      `SELECT * FROM ranks ORDER BY level ASC`
    )

    // Get current rank info
    const currentRankResult = await pool.query(
      `SELECT * FROM ranks WHERE name = $1`,
      [user.current_rank || 'bronze']
    )
    const currentRank = currentRankResult.rows[0]

    // Find next rank
    const nextRank = ranksResult.rows.find(r => r.level > (currentRank?.level || 0))

    // Calculate progress to next rank
    let progressPercentage = 0
    let missingPv = 0
    let missingGv = 0
    let missingLeftVolume = 0
    let missingRightVolume = 0
    let missingQualifiedLegs = 0

    if (nextRank) {
      const currentPv = parseFloat(user.pv) || 0
      const currentGv = parseFloat(user.gv) || 0
      const currentLeftVolume = parseFloat(user.left_volume) || 0
      const currentRightVolume = parseFloat(user.right_volume) || 0

      missingPv = Math.max(0, (parseFloat(nextRank.required_pv) || 0) - currentPv)
      missingGv = Math.max(0, (parseFloat(nextRank.required_gv) || 0) - currentGv)
      missingLeftVolume = Math.max(0, (parseFloat(nextRank.required_left_volume) || 0) - currentLeftVolume)
      missingRightVolume = Math.max(0, (parseFloat(nextRank.required_right_volume) || 0) - currentRightVolume)
      missingQualifiedLegs = Math.max(0, (nextRank.required_qualified_legs || 0) - 0) // TODO: calcola leg qualificate

      // Calculate overall progress (media pesata)
      const totalRequired = 
        (parseFloat(nextRank.required_pv) || 0) +
        (parseFloat(nextRank.required_gv) || 0) +
        (parseFloat(nextRank.required_left_volume) || 0) +
        (parseFloat(nextRank.required_right_volume) || 0)
      
      const totalCurrent = currentPv + currentGv + currentLeftVolume + currentRightVolume
      
      if (totalRequired > 0) {
        progressPercentage = Math.min(100, (totalCurrent / totalRequired) * 100)
      }
    }

    // Get current month qualification
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const monthQualificationResult = await pool.query(
      `SELECT * FROM user_ranks 
       WHERE user_id = $1 
       AND period_start >= $2 
       AND period_end <= $3
       ORDER BY achieved_at DESC LIMIT 1`,
      [userId, monthStart, monthEnd]
    )

    // Get qualification history
    const historyResult = await pool.query(
      `SELECT * FROM user_ranks 
       WHERE user_id = $1 
       ORDER BY period_start DESC 
       LIMIT 12`,
      [userId]
    )

    // Calculate month objective (days remaining)
    const daysRemaining = Math.ceil((monthEnd - now) / (1000 * 60 * 60 * 24))

    res.json({
      success: true,
      currentRank: {
        name: currentRank?.name || 'bronze',
        displayName: currentRank?.display_name || 'Bronze',
        level: currentRank?.level || 1
      },
      currentVolumes: {
        pv: parseFloat(user.pv) || 0,
        gv: parseFloat(user.gv) || 0,
        leftVolume: parseFloat(user.left_volume) || 0,
        rightVolume: parseFloat(user.right_volume) || 0
      },
      nextRank: nextRank ? {
        name: nextRank.name,
        displayName: nextRank.display_name,
        level: nextRank.level,
        requiredPv: parseFloat(nextRank.required_pv) || 0,
        requiredGv: parseFloat(nextRank.required_gv) || 0,
        requiredLeftVolume: parseFloat(nextRank.required_left_volume) || 0,
        requiredRightVolume: parseFloat(nextRank.required_right_volume) || 0,
        requiredQualifiedLegs: nextRank.required_qualified_legs || 0,
        bonusAmount: parseFloat(nextRank.bonus_amount) || 0,
        rewards: nextRank.rewards
      } : null,
      progress: {
        percentage: Math.round(progressPercentage),
        missingPv,
        missingGv,
        missingLeftVolume,
        missingRightVolume,
        missingQualifiedLegs
      },
      monthQualification: monthQualificationResult.rows[0] ? {
        rankName: monthQualificationResult.rows[0].rank_name,
        achievedAt: monthQualificationResult.rows[0].achieved_at,
        periodStart: monthQualificationResult.rows[0].period_start,
        periodEnd: monthQualificationResult.rows[0].period_end,
        pv: parseFloat(monthQualificationResult.rows[0].pv) || 0,
        gv: parseFloat(monthQualificationResult.rows[0].gv) || 0
      } : null,
      monthObjective: {
        daysRemaining,
        monthEnd: monthEnd.toISOString().split('T')[0]
      },
      history: historyResult.rows.map(r => ({
        rankName: r.rank_name,
        achievedAt: r.achieved_at,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        pv: parseFloat(r.pv) || 0,
        gv: parseFloat(r.gv) || 0
      }))
    })

  } catch (error) {
    console.error('Error fetching qualification status:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dello stato qualifiche' })
  }
})

// ============================================
// CALCULATE AND UPDATE USER QUALIFICATIONS
// ============================================
router.post('/calculate', authenticateToken, async (req, res) => {
  try {
    // Solo admin può forzare il calcolo
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accesso negato' })
    }

    const { userId } = req.body || { userId: null }
    const targetUserId = userId || req.user.id

    // Recalculate user volumes and rank
    // TODO: Implementare calcolo volumi da ordini e abbonamenti

    // Get all ranks
    const ranksResult = await pool.query(
      `SELECT * FROM ranks ORDER BY level DESC`
    )

    // Get user current volumes
    const userResult = await pool.query(
      `SELECT personal_volume, group_volume, left_volume, right_volume, current_rank 
       FROM users WHERE id = $1`,
      [targetUserId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' })
    }

    const user = userResult.rows[0]
    const currentPv = parseFloat(user.personal_volume) || 0
    const currentGv = parseFloat(user.group_volume) || 0
    const currentLeftVolume = parseFloat(user.left_volume) || 0
    const currentRightVolume = parseFloat(user.right_volume) || 0

    // Find highest rank achieved
    let highestRank = null
    for (const rank of ranksResult.rows) {
      const requiredPv = parseFloat(rank.required_pv) || 0
      const requiredGv = parseFloat(rank.required_gv) || 0
      const requiredLeftVolume = parseFloat(rank.required_left_volume) || 0
      const requiredRightVolume = parseFloat(rank.required_right_volume) || 0

      if (currentPv >= requiredPv &&
          currentGv >= requiredGv &&
          currentLeftVolume >= requiredLeftVolume &&
          currentRightVolume >= requiredRightVolume) {
        highestRank = rank
        break
      }
    }

    if (highestRank && highestRank.name !== user.current_rank) {
      // Update user rank
      await pool.query(
        `UPDATE users SET current_rank = $1 WHERE id = $2`,
        [highestRank.name, targetUserId]
      )

      // Check if already has this rank for current month
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const existingRankResult = await pool.query(
        `SELECT id FROM user_ranks 
         WHERE user_id = $1 
         AND rank_id = $2
         AND period_start = $3
         AND period_end = $4`,
        [targetUserId, highestRank.id, monthStart, monthEnd]
      )

      if (existingRankResult.rows.length === 0) {
        // Create new qualification record
        await pool.query(
          `INSERT INTO user_ranks 
           (user_id, rank_id, rank_name, achieved_at, period_start, period_end, pv, gv, left_volume, right_volume)
           VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9)`,
          [
            targetUserId,
            highestRank.id,
            highestRank.name,
            monthStart,
            monthEnd,
            currentPv,
            currentGv,
            currentLeftVolume,
            currentRightVolume
          ]
        )

        // Notify user
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type) 
          VALUES ($1, 'Nuova Qualifica!', $2, 'success')`,
          [
            targetUserId,
            `Congratulazioni! Hai raggiunto la qualifica ${highestRank.display_name}!`
          ]
        )
      }
    }

    res.json({
      success: true,
      message: 'Qualifiche ricalcolate con successo',
      newRank: highestRank?.name || user.current_rank
    })

  } catch (error) {
    console.error('Error calculating qualifications:', error)
    res.status(500).json({ success: false, message: 'Errore nel calcolo delle qualifiche' })
  }
})

module.exports = router

