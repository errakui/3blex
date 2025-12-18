const express = require('express')
const router = express.Router()
const pool = require('../db/index')
const { authenticateToken, requireRole } = require('../middleware/auth')

// Get all broadcasts (for all users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM broadcast_messages
       WHERE status = 'active'
       AND (target_audience = 'all' OR target_audience = $1)
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.role]
    )

    res.json({
      success: true,
      broadcasts: result.rows
    })
  } catch (error) {
    console.error('Error fetching broadcasts:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dei messaggi' })
  }
})

// Create broadcast (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { title, message, targetAudience, priority, expiresAt } = req.body

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Titolo e messaggio obbligatori' })
    }

    const result = await pool.query(
      `INSERT INTO broadcast_messages (title, message, target_audience, priority, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, message, targetAudience || 'all', priority || 'normal', expiresAt || null, req.user.id]
    )

    // Create notifications for all target users
    const targetUsers = await pool.query(
      targetAudience === 'all'
        ? `SELECT id FROM users`
        : `SELECT id FROM users WHERE role = $1`,
      targetAudience === 'all' ? [] : [targetAudience]
    )

    for (const user of targetUsers.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, priority)
         VALUES ($1, $2, $3, 'info', $4)`,
        [user.id, title, message, priority || 'normal']
      )
    }

    res.json({
      success: true,
      broadcast: result.rows[0],
      notifiedUsers: targetUsers.rows.length
    })
  } catch (error) {
    console.error('Error creating broadcast:', error)
    res.status(500).json({ success: false, message: 'Errore nella creazione del messaggio' })
  }
})

module.exports = router

