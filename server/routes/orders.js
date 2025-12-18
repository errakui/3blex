const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const pool = require('../db/index')
const crypto = require('crypto')
const { calculateProductCommissions } = require('../utils/commissionCalculator')

const router = express.Router()

// Create order as customer (no auth required - public)
router.post('/customer', async (req, res) => {
  const client = await pool.connect()
  try {
    const { referralCode, customerData, items } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items obbligatori' })
    }

    if (!customerData.name || !customerData.email) {
      return res.status(400).json({ success: false, message: 'Dati cliente obbligatori' })
    }

    // Find referrer if referral code provided
    let referrerId = null
    if (referralCode) {
      const referrerResult = await pool.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referralCode.toUpperCase()]
      )
      if (referrerResult.rows.length > 0) {
        referrerId = referrerResult.rows[0].id
      }
    }

    await client.query('BEGIN')

    // Generate order number
    const orderNumber = `CUST-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    // Calculate total
    let total = 0
    for (const item of items) {
      const productResult = await client.query(
        'SELECT price, stock FROM products WHERE id = $1',
        [item.productId]
      )
      if (productResult.rows.length === 0) {
        throw new Error(`Prodotto ${item.productId} non trovato`)
      }
      const product = productResult.rows[0]
      if (product.stock < item.quantity) {
        throw new Error(`Stock insufficiente per prodotto ${item.productId}`)
      }
      total += parseFloat(product.price) * item.quantity
    }

    // Create order as customer (user_id will be null if no account)
    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, order_number, total, status, 
        customer_name, customer_email, customer_phone,
        shipping_address, ordered_by_affiliate
      )
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        null, // No user account
        orderNumber,
        total,
        customerData.name,
        customerData.email,
        customerData.phone || null,
        `${customerData.address}, ${customerData.city} ${customerData.postalCode}, ${customerData.country}`,
        referrerId // Referrer who gets commission
      ]
    )
    const orderId = orderResult.rows[0].id

    // Create order items and update stock
    for (const item of items) {
      const productResult = await client.query(
        'SELECT price, stock FROM products WHERE id = $1',
        [item.productId]
      )
      const product = productResult.rows[0]

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.productId, item.quantity, product.price]
      )

      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.productId]
      )
    }

    // Generate payment link (in production, Stripe checkout session)
    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${orderId}?token=${crypto.randomBytes(32).toString('hex')}`

    // Update order with payment link
    await client.query(
      'UPDATE orders SET payment_link = $1 WHERE id = $2',
      [paymentLink, orderId]
    )

    await client.query('COMMIT')

    // Calculate product commissions for referrer if exists
    if (referrerId) {
      try {
        await calculateProductCommissions(orderId)
      } catch (error) {
        console.error('Error calculating product commissions:', error)
      }
    }

    res.json({
      success: true,
      message: 'Ordine creato con successo',
      orderId,
      orderNumber,
      paymentLink,
      total
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create customer order error:', error)
    res.status(500).json({ success: false, message: error.message || 'Errore nella creazione dell\'ordine' })
  } finally {
    client.release()
  }
})

// Get user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT id, order_number, total, status, tracking_number, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    res.json({
      orders: result.rows.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        total: parseFloat(order.total),
        status: order.status,
        trackingNumber: order.tracking_number,
        createdAt: order.created_at,
      })),
    })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ message: 'Errore nel recupero degli ordini' })
  }
})

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const orderResult = await pool.query(
      `SELECT id, order_number, total, status, tracking_number, created_at
       FROM orders
       WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
       LIMIT 1`,
      [id, userId]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ordine non trovato' })
    }

    const order = orderResult.rows[0]

    const itemsResult = await pool.query(
      `SELECT oi.id, oi.quantity, oi.price, p.name as product_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    )

    res.json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        total: parseFloat(order.total),
        status: order.status,
        trackingNumber: order.tracking_number,
        createdAt: order.created_at,
        items: itemsResult.rows.map(item => ({
          id: item.id,
          productName: item.product_name,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
      },
    })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ message: 'Errore nel recupero dell\'ordine' })
  }
})

// Create order for customer (affiliate buying for customer)
router.post('/for-customer', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const affiliateId = req.user.id
    const { customerName, customerEmail, customerPhone, items } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items obbligatori' })
    }

    if (!customerName || !customerEmail) {
      return res.status(400).json({ message: 'Nome e email cliente obbligatori' })
    }

    // Check if affiliate has network access
    const affiliateResult = await pool.query(
      'SELECT role, subscription_status FROM users WHERE id = $1',
      [affiliateId]
    )
    if (affiliateResult.rows.length === 0 || 
        (affiliateResult.rows[0].role !== 'network_member' && affiliateResult.rows[0].role !== 'admin')) {
      return res.status(403).json({ message: 'Solo network members possono creare ordini per clienti' })
    }

    await client.query('BEGIN')

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    // Calculate total
    let total = 0
    for (const item of items) {
      const productResult = await client.query(
        'SELECT price, stock FROM products WHERE id = $1',
        [item.productId]
      )
      if (productResult.rows.length === 0) {
        throw new Error(`Prodotto ${item.productId} non trovato`)
      }
      const product = productResult.rows[0]
      if (product.stock < item.quantity) {
        throw new Error(`Stock insufficiente per prodotto ${item.productId}`)
      }
      total += parseFloat(product.price) * item.quantity
    }

    // Create order with customer info
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, order_number, total, status, customer_name, customer_email, customer_phone, ordered_by_affiliate)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
       RETURNING id`,
      [affiliateId, orderNumber, total, customerName, customerEmail, customerPhone || null, affiliateId]
    )
    const orderId = orderResult.rows[0].id

    // Create order items and update stock
    for (const item of items) {
      const productResult = await client.query(
        'SELECT price, stock FROM products WHERE id = $1',
        [item.productId]
      )
      const product = productResult.rows[0]

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.productId, item.quantity, product.price]
      )

      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.productId]
      )
    }

    // Generate payment link (in production, this would be Stripe checkout session)
    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${orderId}?token=${crypto.randomBytes(32).toString('hex')}`

    // Update order with payment link
    await client.query(
      'UPDATE orders SET payment_link = $1 WHERE id = $2',
      [paymentLink, orderId]
    )

    await client.query('COMMIT')

    // Calculate product commissions for affiliate
    try {
      await calculateProductCommissions(orderId)
    } catch (error) {
      console.error('Error calculating product commissions:', error)
    }

    res.status(201).json({
      success: true,
      message: 'Ordine creato con successo',
      orderId,
      orderNumber,
      paymentLink,
      total
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create order for customer error:', error)
    res.status(500).json({ message: error.message || 'Errore nella creazione dell\'ordine' })
  } finally {
    client.release()
  }
})

// Create order
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.user.id
    const { items } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items obbligatori' })
    }

    await client.query('BEGIN')

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    // Calculate total
    let total = 0
    for (const item of items) {
      const productResult = await client.query(
        'SELECT price, stock FROM products WHERE id = $1',
        [item.productId]
      )
      if (productResult.rows.length === 0) {
        throw new Error(`Prodotto ${item.productId} non trovato`)
      }
      const product = productResult.rows[0]
      if (product.stock < item.quantity) {
        throw new Error(`Stock insufficiente per prodotto ${item.productId}`)
      }
      total += parseFloat(product.price) * item.quantity
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, order_number, total, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [userId, orderNumber, total]
    )
    const orderId = orderResult.rows[0].id

    // Create order items and update stock
    const orderItems = []
    for (const item of items) {
      const productResult = await client.query(
        'SELECT price, stock FROM products WHERE id = $1',
        [item.productId]
      )
      const product = productResult.rows[0]

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.productId, item.quantity, product.price]
      )

      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.productId]
      )

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(product.price),
      })
    }

    await client.query('COMMIT')

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Ordine creato', 
              'Il tuo ordine #${orderNumber} è stato creato con successo.', 
              'success')`,
      [userId]
    )

    // Calculate product commissions (if order is paid/completed)
    try {
      await calculateProductCommissions(orderId)
    } catch (error) {
      console.error('Error calculating product commissions:', error)
      // Don't fail order creation if commission calculation fails
    }

    res.status(201).json({
      message: 'Ordine creato con successo',
      order: {
        id: orderId,
        orderNumber,
        total,
        status: 'pending',
        items: orderItems,
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create order error:', error)
    res.status(500).json({ message: error.message || 'Errore nella creazione dell\'ordine' })
  } finally {
    client.release()
  }
})

module.exports = router
