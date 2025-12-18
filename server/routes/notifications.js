const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const pool = require('../db/index')

const router = express.Router()

router.use(authenticateToken)

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT id, title, message, type, read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    const notifications = result.rows.map(notif => ({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: notif.read,
      createdAt: notif.created_at,
    }))

    res.json({ notifications })
  } catch (error) {
    console.error('Notifications error:', error)
    res.status(500).json({ message: 'Errore nel recupero delle notifiche' })
  }
})

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    await pool.query(
      `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
      [id, userId]
    )

    res.json({ message: 'Notifica segnata come letta' })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ message: 'Errore nell\'aggiornamento della notifica' })
  }
})

module.exports = router

