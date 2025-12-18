const express = require('express')
const router = express.Router()
const pool = require('../db/index')
const { authenticateToken, requireRole } = require('../middleware/auth')
const {
  calculateBinaryCommissions,
  calculateMultilevelCommissions,
  calculateHybridCommissions,
  calculateQualificationBonus,
  calculatePeriodBinaryCommissions
} = require('../utils/advancedCommissionCalculator')

/**
 * ============================================
 * CALCULATE BINARY COMMISSIONS (User)
 * ============================================
 */
router.post('/binary/calculate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { periodStart, periodEnd, config } = req.body

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ 
        success: false, 
        message: 'periodStart e periodEnd sono richiesti' 
      })
    }

    const result = await calculateBinaryCommissions(
      userId,
      new Date(periodStart),
      new Date(periodEnd),
      config || {}
    )

    res.json(result)
  } catch (error) {
    console.error('Error calculating binary commissions:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel calcolo commissioni binarie' 
    })
  }
})

/**
 * ============================================
 * CALCULATE MULTILEVEL COMMISSIONS (Order)
 * ============================================
 */
router.post('/multilevel/calculate', authenticateToken, async (req, res) => {
  try {
    const { orderId, config } = req.body

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'orderId è richiesto' 
      })
    }

    const result = await calculateMultilevelCommissions(orderId, config || {})

    res.json(result)
  } catch (error) {
    console.error('Error calculating multilevel commissions:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel calcolo commissioni multilevel' 
    })
  }
})

/**
 * ============================================
 * CALCULATE QUALIFICATION BONUS
 * ============================================
 */
router.post('/qualification-bonus', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { qualification, config } = req.body

    if (!qualification) {
      return res.status(400).json({ 
        success: false, 
        message: 'qualification è richiesta' 
      })
    }

    const result = await calculateQualificationBonus(userId, qualification, config || {})

    res.json(result)
  } catch (error) {
    console.error('Error calculating qualification bonus:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel calcolo bonus qualifica' 
    })
  }
})

/**
 * ============================================
 * GET USER COMMISSIONS
 * ============================================
 */
router.get('/my-commissions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { type, status, startDate, endDate, limit = 50, offset = 0 } = req.query

    let query = `
      SELECT 
        c.id, c.amount, c.percentage, c.status, c.commission_type,
        c.created_at, c.processed_at, c.description,
        c.order_id, c.level,
        u.name as referred_name, u.email as referred_email
      FROM commissions c
      LEFT JOIN users u ON c.referred_id = u.id
      WHERE c.referrer_id = $1
    `
    const params = [userId]
    let paramIndex = 2

    if (type) {
      query += ` AND c.commission_type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }

    if (status) {
      query += ` AND c.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (startDate) {
      query += ` AND c.created_at >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      query += ` AND c.created_at <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    // Get total count
    const countQuery = query.replace(
      /SELECT.*FROM/,
      'SELECT COUNT(*) FROM'
    ).replace(/ORDER BY.*$/, '')
    const countResult = await pool.query(countQuery, params.slice(0, -2))

    res.json({
      success: true,
      commissions: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
  } catch (error) {
    console.error('Error fetching commissions:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero commissioni' 
    })
  }
})

/**
 * ============================================
 * CALCULATE PERIOD BINARY COMMISSIONS (Admin)
 * ============================================
 */
router.post('/admin/binary/calculate-period', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { periodStart, periodEnd, config } = req.body

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ 
        success: false, 
        message: 'periodStart e periodEnd sono richiesti' 
      })
    }

    const result = await calculatePeriodBinaryCommissions(
      new Date(periodStart),
      new Date(periodEnd),
      config || {}
    )

    res.json(result)
  } catch (error) {
    console.error('Error calculating period binary commissions:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel calcolo periodico commissioni binarie' 
    })
  }
})

/**
 * ============================================
 * GET COMMISSION STATISTICS (User)
 * ============================================
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_commissions,
        SUM(CASE WHEN status = 'available' THEN amount ELSE 0 END) as available_total,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_total,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_total,
        SUM(CASE WHEN commission_type = 'binary' THEN amount ELSE 0 END) as binary_total,
        SUM(CASE WHEN commission_type = 'multilevel' THEN amount ELSE 0 END) as multilevel_total,
        SUM(CASE WHEN commission_type = 'product_sale' THEN amount ELSE 0 END) as product_total,
        SUM(CASE WHEN commission_type = 'qualification_bonus' THEN amount ELSE 0 END) as bonus_total
      FROM commissions
      WHERE referrer_id = $1`,
      [userId]
    )

    res.json({
      success: true,
      statistics: stats.rows[0]
    })
  } catch (error) {
    console.error('Error fetching commission statistics:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero statistiche commissioni' 
    })
  }
})

module.exports = router

