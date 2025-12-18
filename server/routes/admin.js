const express = require('express')
const { authenticateToken, requireRole } = require('../middleware/auth')
const pool = require('../db/index')
const path = require('path')

const router = express.Router()

// All admin routes require admin role
router.use(authenticateToken)
router.use(requireRole('admin'))

// Support tickets endpoint for admin
router.get('/support-tickets', async (req, res) => {
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

    res.json({ success: true, tickets: result.rows })
  } catch (error) {
    console.error('Admin support tickets error:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dei ticket' })
  }
})

router.put('/support-tickets/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    await pool.query(
      'UPDATE support_tickets SET status = $1 WHERE id = $2',
      [status, id]
    )

    res.json({ success: true, message: 'Status aggiornato' })
  } catch (error) {
    console.error('Admin update ticket error:', error)
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento' })
  }
})

// Get customers list (for affiliate to buy for customer)
router.get('/customers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        DISTINCT 
        o.customer_email as email,
        o.customer_name as name,
        o.customer_phone as phone,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total) as total_spent,
        MAX(o.created_at) as last_order_date
       FROM orders o
       WHERE o.customer_email IS NOT NULL
       GROUP BY o.customer_email, o.customer_name, o.customer_phone
       ORDER BY last_order_date DESC`
    )

    res.json({
      success: true,
      customers: result.rows.map(c => ({
        id: c.email, // Use email as ID for now
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalOrders: parseInt(c.total_orders) || 0,
        totalSpent: parseFloat(c.total_spent) || 0,
        lastOrderDate: c.last_order_date
      }))
    })
  } catch (error) {
    console.error('Admin customers error:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dei clienti' })
  }
})

// Search affiliates by name or ID
router.get('/affiliates/search', async (req, res) => {
  try {
    const { q } = req.query

    if (!q || q.length < 2) {
      return res.json({ success: true, affiliates: [] })
    }

    const result = await pool.query(
      `SELECT id, name, email, referral_code, role, subscription_status, created_at
       FROM users
       WHERE (LOWER(name) LIKE $1 OR LOWER(email) LIKE $1 OR referral_code = $2)
       AND role != 'admin'
       ORDER BY name
       LIMIT 20`,
      [`%${q.toLowerCase()}%`, q.toUpperCase()]
    )

    res.json({
      success: true,
      affiliates: result.rows
    })
  } catch (error) {
    console.error('Search affiliates error:', error)
    res.status(500).json({ success: false, message: 'Errore nella ricerca' })
  }
})

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, subscription_status, subscription_plan, 
              referral_code, created_at
       FROM users
       ORDER BY created_at DESC`
    )

    res.json({ users: result.rows })
  } catch (error) {
    console.error('Admin users error:', error)
    res.status(500).json({ message: 'Errore nel recupero degli utenti' })
  }
})

// Get all commissions
router.get('/commissions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.amount, c.percentage, c.status, c.created_at, c.paid_at,
              referrer.name as referrer_name, referrer.email as referrer_email,
              referred.name as referred_name, referred.email as referred_email
       FROM commissions c
       JOIN users referrer ON c.referrer_id = referrer.id
       JOIN users referred ON c.referred_id = referred.id
       ORDER BY c.created_at DESC`
    )

    res.json({ commissions: result.rows })
  } catch (error) {
    console.error('Admin commissions error:', error)
    res.status(500).json({ message: 'Errore nel recupero delle commissioni' })
  }
})

// Update commission status
router.put('/commissions/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'available', 'paid'].includes(status)) {
      return res.status(400).json({ message: 'Stato non valido' })
    }

    const paidAt = status === 'paid' ? new Date() : null

    await pool.query(
      `UPDATE commissions SET status = $1, paid_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, paidAt, id]
    )

    res.json({ message: 'Stato commissione aggiornato' })
  } catch (error) {
    console.error('Update commission error:', error)
    res.status(500).json({ message: 'Errore nell\'aggiornamento della commissione' })
  }
})

// Approve/Reject KYC document
router.put('/kyc/:id/review', async (req, res) => {
  try {
    const { id } = req.params
    const { status, rejectionReason } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Stato non valido' })
    }

    await pool.query(
      `UPDATE kyc_documents 
       SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, 
           rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, req.user.id, rejectionReason || null, id]
    )

    // Get user_id from document
    const docResult = await pool.query('SELECT user_id FROM kyc_documents WHERE id = $1', [id])
    const userId = docResult.rows[0]?.user_id

    if (userId) {
      // Create notification
      const message = status === 'approved'
        ? 'La tua verifica KYC è stata approvata! Puoi ora prelevare le commissioni.'
        : 'La tua verifica KYC è stata rifiutata. Controlla i dettagli e ricarica i documenti.'

      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'KYC ${status === 'approved' ? 'Approvato' : 'Rifiutato'}', $2, $3)`,
        [userId, message, status === 'approved' ? 'success' : 'error']
      )

      // If approved, update commissions from pending to available if KYC was required
      if (status === 'approved') {
        await pool.query(
          `UPDATE commissions 
           SET status = 'available', updated_at = CURRENT_TIMESTAMP
           WHERE referred_id = $1 AND status = 'pending' AND kyc_required = true`,
          [userId]
        )
      }
    }

    res.json({ message: `KYC ${status === 'approved' ? 'approvato' : 'rifiutato'}` })
  } catch (error) {
    console.error('KYC review error:', error)
    res.status(500).json({ message: 'Errore nella revisione del KYC' })
  }
})

// Get all products
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price, category, image_url, stock, created_at
       FROM products
       ORDER BY created_at DESC`
    )

    res.json({ products: result.rows })
  } catch (error) {
    console.error('Admin products error:', error)
    res.status(500).json({ message: 'Errore nel recupero dei prodotti' })
  }
})

// Create product
router.post('/products', async (req, res) => {
  try {
    const { name, description, price, category, image_url, stock } = req.body

    if (!name || !price) {
      return res.status(400).json({ message: 'Nome e prezzo sono obbligatori' })
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price, category, image_url, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, price, category, image_url, stock`,
      [name, description, price, category || null, image_url || null, stock || 0]
    )

    res.status(201).json({ product: result.rows[0] })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ message: 'Errore nella creazione del prodotto' })
  }
})

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, category, image_url, stock } = req.body

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, category = $4, image_url = $5, stock = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, name, description, price, category, image_url, stock`,
      [name, description, price, category || null, image_url || null, stock || 0, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prodotto non trovato' })
    }

    res.json({ product: result.rows[0] })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ message: 'Errore nell\'aggiornamento del prodotto' })
  }
})

// Update order status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, trackingNumber } = req.body

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Stato non valido' })
    }

    await pool.query(
      `UPDATE orders SET status = $1, tracking_number = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, trackingNumber || null, id]
    )

    res.json({ message: 'Stato ordine aggiornato' })
  } catch (error) {
    console.error('Update order error:', error)
    res.status(500).json({ message: 'Errore nell\'aggiornamento dell\'ordine' })
  }
})

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.order_number, o.total, o.status, o.tracking_number, o.created_at,
              u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    )

    res.json({ orders: result.rows })
  } catch (error) {
    console.error('Admin orders error:', error)
    res.status(500).json({ message: 'Errore nel recupero degli ordini' })
  }
})

// Activity Logs
router.get('/activity-logs', async (req, res) => {
  try {
    const { userId, limit = 100 } = req.query
    const { getAllActivityLogs, getUserActivityLogs } = require('../utils/activityLogger')

    let logs
    if (userId) {
      logs = await getUserActivityLogs(parseInt(userId), parseInt(limit))
    } else {
      logs = await getAllActivityLogs(parseInt(limit))
    }

    res.json({
      success: true,
      logs
    })
  } catch (error) {
    console.error('Admin activity logs error:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero dei log' })
  }
})

// Analytics
router.get('/analytics', async (req, res) => {
  try {
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users')
    const totalUsers = parseInt(totalUsersResult.rows[0].count)

    const activeSubsResult = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active'`
    )
    const activeSubscriptions = parseInt(activeSubsResult.rows[0].count)

    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM subscriptions WHERE status = 'active'`
    )
    const totalRevenue = parseFloat(revenueResult.rows[0].total) || 0

    const commissionsResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM commissions`
    )
    const totalCommissions = parseFloat(commissionsResult.rows[0].total) || 0

    const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders')
    const totalOrders = parseInt(ordersResult.rows[0].count)

    const kycPendingResult = await pool.query(
      `SELECT COUNT(*) as count FROM kyc_documents WHERE status = 'pending'`
    )
    const kycPending = parseInt(kycPendingResult.rows[0].count)

    res.json({
      success: true,
      analytics: {
        totalUsers,
        activeSubscriptions,
        totalRevenue,
        totalCommissions,
        totalOrders,
        kycPending
      }
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero delle analytics' })
  }
})

module.exports = router
