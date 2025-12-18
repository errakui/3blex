const express = require('express')
const router = express.Router()
const pool = require('../db/index')
const { authenticateToken } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')

// ============================================
// GET ALL EVENTS
// ============================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, status } = req.query

    let query = 'SELECT * FROM events WHERE 1=1'
    const params = []
    let paramCount = 1

    if (type) {
      query += ` AND type = $${paramCount++}`
      params.push(type)
    }

    if (status) {
      query += ` AND status = $${paramCount++}`
      params.push(status)
    }

    query += ' ORDER BY start_date ASC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      events: result.rows.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        startDate: event.start_date,
        endDate: event.end_date,
        location: event.location,
        locationUrl: event.location_url,
        registrationRequired: event.registration_required,
        registrationDeadline: event.registration_deadline,
        maxParticipants: event.max_participants,
        requirements: event.requirements,
        materials: event.materials,
        status: event.status,
        createdAt: event.created_at
      }))
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero degli eventi' })
  }
})

// ============================================
// GET SINGLE EVENT
// ============================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    )

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' })
    }

    const event = eventResult.rows[0]

    // Check if user is registered
    const registrationResult = await pool.query(
      'SELECT * FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    )

    const isRegistered = registrationResult.rows.length > 0
    const registration = isRegistered ? registrationResult.rows[0] : null

    res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        startDate: event.start_date,
        endDate: event.end_date,
        location: event.location,
        locationUrl: event.location_url,
        registrationRequired: event.registration_required,
        registrationDeadline: event.registration_deadline,
        maxParticipants: event.max_participants,
        requirements: event.requirements,
        materials: event.materials,
        status: event.status,
        createdAt: event.created_at,
        isRegistered,
        qrCode: registration?.qr_code || null,
        registrationStatus: registration?.status || null
      }
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dell\'evento' })
  }
})

// ============================================
// REGISTER TO EVENT
// ============================================
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Check event exists and is open
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND status = $2',
      [id, 'upcoming']
    )

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento non trovato o non disponibile' })
    }

    const event = eventResult.rows[0]

    // Check if already registered
    const existingReg = await pool.query(
      'SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    )

    if (existingReg.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Già registrato a questo evento' })
    }

    // Check deadline
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'Termine registrazione scaduto' })
    }

    // Check max participants
    if (event.max_participants) {
      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = $1',
        [id]
      )
      const count = parseInt(countResult.rows[0].count)
      if (count >= event.max_participants) {
        return res.status(400).json({ success: false, message: 'Evento completo' })
      }
    }

    // Generate QR code
    const qrCode = `EVENT_${id}_${userId}_${uuidv4().substring(0, 8)}`

    // Register
    const regResult = await pool.query(
      `INSERT INTO event_registrations (event_id, user_id, qr_code, status)
       VALUES ($1, $2, $3, 'registered')
       RETURNING *`,
      [id, userId, qrCode]
    )

    res.json({
      success: true,
      message: 'Registrato con successo all\'evento',
      registration: {
        qrCode: regResult.rows[0].qr_code,
        status: regResult.rows[0].status
      }
    })
  } catch (error) {
    console.error('Error registering to event:', error)
    res.status(500).json({ success: false, message: 'Errore nella registrazione' })
  }
})

// ============================================
// GET CHALLENGES
// ============================================
router.get('/challenges/list', authenticateToken, async (req, res) => {
  try {
    const { type, status } = req.query

    let query = 'SELECT * FROM challenges WHERE 1=1'
    const params = []
    let paramCount = 1

    if (type) {
      query += ` AND type = $${paramCount++}`
      params.push(type)
    }

    if (status) {
      query += ` AND status = $${paramCount++}`
      params.push(status)
    }

    query += ' ORDER BY start_date DESC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      challenges: result.rows
    })
  } catch (error) {
    console.error('Error fetching challenges:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero delle challenge' })
  }
})

// ============================================
// GET USER CHALLENGE PROGRESS
// ============================================
router.get('/challenges/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const challengeResult = await pool.query(
      'SELECT * FROM challenges WHERE id = $1',
      [id]
    )

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Challenge non trovata' })
    }

    const challenge = challengeResult.rows[0]

    // Get user progress
    const progressResult = await pool.query(
      `SELECT * FROM challenge_participants 
       WHERE challenge_id = $1 AND user_id = $2`,
      [id, userId]
    )

    // Get leaderboard position
    const leaderboardResult = await pool.query(
      `SELECT position FROM leaderboards 
       WHERE challenge_id = $1 AND user_id = $2`,
      [id, userId]
    )

    res.json({
      success: true,
      challenge: {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        type: challenge.type,
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        requirements: challenge.requirements,
        prizes: challenge.prizes
      },
      progress: progressResult.rows[0] ? {
        progressPercentage: progressResult.rows[0].progress_percentage,
        requirementsMet: progressResult.rows[0].requirements_met
      } : null,
      position: leaderboardResult.rows[0]?.position || null
    })
  } catch (error) {
    console.error('Error fetching challenge progress:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero del progresso' })
  }
})

module.exports = router

