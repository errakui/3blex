const express = require('express')
const router = express.Router()
const pool = require('../db/index')
const { authenticateToken, requireRole } = require('../middleware/auth')

// Create support ticket (user)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { subject, message, priority = 'medium' } = req.body

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Oggetto e messaggio obbligatori' })
    }

    const result = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, message, status, priority)
       VALUES ($1, $2, $3, 'open', $4)
       RETURNING *`,
      [userId, subject, message, priority]
    )

    res.json({
      success: true,
      ticket: result.rows[0]
    })
  } catch (error) {
    console.error('Error creating ticket:', error)
    res.status(500).json({ success: false, message: 'Errore nella creazione del ticket' })
  }
})

// Get user tickets
router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    )

    res.json({
      success: true,
      tickets: result.rows
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dei ticket' })
  }
})

// Get all tickets (admin)
router.get('/all', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        t.*,
        u.name as user_name,
        u.email as user_email
       FROM support_tickets t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    )

    res.json({
      success: true,
      tickets: result.rows
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dei ticket' })
  }
})

// Update ticket status (admin)
router.put('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status non valido' })
    }

    await pool.query(
      'UPDATE support_tickets SET status = $1 WHERE id = $2',
      [status, id]
    )

    res.json({
      success: true,
      message: 'Status aggiornato'
    })
  } catch (error) {
    console.error('Error updating ticket:', error)
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento' })
  }
})

module.exports = router

