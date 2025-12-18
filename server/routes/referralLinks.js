const express = require('express')
const router = express.Router()
const pool = require('../db/index')
const { authenticateToken } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')

// ============================================
// CREATE REFERRAL LINK
// ============================================
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { type, name, targetProductId, targetFunnelId, targetEventId, defaultAction } = req.body

    if (!type || !['registration', 'product', 'funnel', 'event', 'generic'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipo link non valido' })
    }

    // Generate unique URL slug
    const urlSlug = `${userId}_${type}_${uuidv4().substring(0, 8)}`

    const result = await pool.query(
      `INSERT INTO referral_links 
       (user_id, type, name, url_slug, target_product_id, target_funnel_id, target_event_id, default_action)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, url_slug, type, name, clicks, conversions, is_active, created_at`,
      [userId, type, name || null, urlSlug, targetProductId || null, targetFunnelId || null, targetEventId || null, defaultAction || null]
    )

    const link = result.rows[0]
    const fullUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ref/${link.url_slug}`

    res.json({
      success: true,
      link: {
        id: link.id,
        url: fullUrl,
        slug: link.url_slug,
        type: link.type,
        name: link.name,
        clicks: link.clicks || 0,
        conversions: link.conversions || 0,
        isActive: link.is_active,
        createdAt: link.created_at
      }
    })
  } catch (error) {
    console.error('Error creating referral link:', error)
    res.status(500).json({ success: false, message: 'Errore nella creazione del link' })
  }
})

// ============================================
// GET USER REFERRAL LINKS
// ============================================
router.get('/my-links', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT 
        id, type, name, url_slug, target_product_id, target_funnel_id, target_event_id,
        default_action, clicks, conversions, is_active, created_at
       FROM referral_links
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

    res.json({
      success: true,
      links: result.rows.map(link => ({
        id: link.id,
        url: `${baseUrl}/ref/${link.url_slug}`,
        slug: link.url_slug,
        type: link.type,
        name: link.name,
        targetProductId: link.target_product_id,
        targetFunnelId: link.target_funnel_id,
        targetEventId: link.target_event_id,
        defaultAction: link.default_action,
        clicks: link.clicks || 0,
        conversions: link.conversions || 0,
        conversionRate: link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(2) : 0,
        isActive: link.is_active,
        createdAt: link.created_at
      }))
    })
  } catch (error) {
    console.error('Error fetching referral links:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dei link' })
  }
})

// ============================================
// GET REFERRAL LINK INFO (Public)
// ============================================
router.get('/info/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const result = await pool.query(
      `SELECT 
        rl.id, rl.type, rl.name, rl.url_slug, rl.target_product_id,
        u.name as referrer_name
       FROM referral_links rl
       JOIN users u ON rl.user_id = u.id
       WHERE rl.url_slug = $1 AND rl.is_active = true`,
      [slug]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Link non trovato' })
    }

    res.json({
      success: true,
      link: result.rows[0]
    })
  } catch (error) {
    console.error('Error fetching referral link info:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero del link' })
  }
})

// ============================================
// TRACK CLICK ON REFERRAL LINK (Public)
// ============================================
router.get('/track/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const result = await pool.query(
      `UPDATE referral_links 
       SET clicks = clicks + 1 
       WHERE url_slug = $1
       RETURNING id, user_id, type, target_product_id, target_funnel_id, target_event_id, default_action`,
      [slug]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Link non trovato' })
    }

    // Just track, don't redirect (handled by frontend)
    res.json({ success: true })
  } catch (error) {
    console.error('Error tracking referral link:', error)
    res.status(500).json({ success: false, message: 'Errore nel tracking del link' })
  }
})

// ============================================
// TRACK CONVERSION (called after successful action)
// ============================================
router.post('/track-conversion/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    await pool.query(
      `UPDATE referral_links 
       SET conversions = conversions + 1 
       WHERE url_slug = $1`,
      [slug]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Error tracking conversion:', error)
    res.status(500).json({ success: false, message: 'Errore nel tracking conversione' })
  }
})

// ============================================
// UPDATE REFERRAL LINK
// ============================================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { name, isActive } = req.body

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM referral_links WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Link non trovato' })
    }

    const updates = []
    const values = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(name)
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`)
      values.push(isActive)
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nessun campo da aggiornare' })
    }

    values.push(id)

    await pool.query(
      `UPDATE referral_links SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    )

    res.json({
      success: true,
      message: 'Link aggiornato con successo'
    })
  } catch (error) {
    console.error('Error updating referral link:', error)
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del link' })
  }
})

// ============================================
// DELETE REFERRAL LINK
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM referral_links WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Link non trovato' })
    }

    await pool.query('DELETE FROM referral_links WHERE id = $1', [id])

    res.json({
      success: true,
      message: 'Link eliminato con successo'
    })
  } catch (error) {
    console.error('Error deleting referral link:', error)
    res.status(500).json({ success: false, message: 'Errore nell\'eliminazione del link' })
  }
})

module.exports = router

