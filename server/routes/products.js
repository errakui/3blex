const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const pool = require('../db/index')

const router = express.Router()

// Public products endpoint (for customer mode - no auth)
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price, category, image_url, stock, created_at
       FROM products
       WHERE stock > 0
       ORDER BY created_at DESC`
    )

    res.json({
      products: result.rows.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        originalPrice: parseFloat(product.price),
        category: product.category,
        image: product.image_url,
        stock: product.stock,
      })),
    })
  } catch (error) {
    console.error('Public products error:', error)
    res.status(500).json({ message: 'Errore nel recupero dei prodotti' })
  }
})

// Get single public product (for customer mode)
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT id, name, description, price, category, image_url, stock
       FROM products
       WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Prodotto non trovato' })
    }

    const product = result.rows[0]

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        originalPrice: parseFloat(product.price),
        category: product.category,
        image: product.image_url,
        stock: product.stock,
      }
    })
  } catch (error) {
    console.error('Public product error:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero del prodotto' })
  }
})

// Get all products with differentiated pricing
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Get user role and status
    const userResult = await pool.query(
      `SELECT role, subscription_status FROM users WHERE id = $1`,
      [userId]
    )
    const user = userResult.rows[0] || {}

    const isAffiliate = user.role === 'network_member' || user.role === 'admin'
    const isVip = false // TODO: implement VIP logic

    const result = await pool.query(
      `SELECT 
        id, name, description, price, price_vip, price_affiliate,
        category, image_url, stock, is_package, package_type,
        is_digital, digital_content, created_at
       FROM products
       WHERE stock > 0
       ORDER BY created_at DESC`
    )

    res.json({
      products: result.rows.map(product => {
        // Determine price based on user type
        let finalPrice = parseFloat(product.price) || 0
        
        if (isVip && product.price_vip) {
          finalPrice = parseFloat(product.price_vip)
        } else if (isAffiliate && product.price_affiliate) {
          finalPrice = parseFloat(product.price_affiliate)
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: finalPrice,
          originalPrice: parseFloat(product.price),
          priceVip: product.price_vip ? parseFloat(product.price_vip) : null,
          priceAffiliate: product.price_affiliate ? parseFloat(product.price_affiliate) : null,
          category: product.category,
          image: product.image_url,
          stock: product.stock,
          isPackage: product.is_package || false,
          packageType: product.package_type,
          isDigital: product.is_digital || false,
          digitalContent: product.digital_content
        }
      }),
    })
  } catch (error) {
    console.error('Products error:', error)
    res.status(500).json({ message: 'Errore nel recupero dei prodotti' })
  }
})

// Get single product with differentiated pricing
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Get user role and status
    const userResult = await pool.query(
      `SELECT role, subscription_status FROM users WHERE id = $1`,
      [userId]
    )
    const user = userResult.rows[0] || {}

    const isAffiliate = user.role === 'network_member' || user.role === 'admin'
    const isVip = false // TODO: implement VIP logic

    const result = await pool.query(
      `SELECT 
        id, name, description, price, price_vip, price_affiliate,
        category, image_url, stock, is_package, package_type,
        is_digital, digital_content, created_at
       FROM products
       WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prodotto non trovato' })
    }

    const product = result.rows[0]

    // Determine price based on user type
    let finalPrice = parseFloat(product.price) || 0
    
    if (isVip && product.price_vip) {
      finalPrice = parseFloat(product.price_vip)
    } else if (isAffiliate && product.price_affiliate) {
      finalPrice = parseFloat(product.price_affiliate)
    }

    res.json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: finalPrice,
      originalPrice: parseFloat(product.price),
      priceVip: product.price_vip ? parseFloat(product.price_vip) : null,
      priceAffiliate: product.price_affiliate ? parseFloat(product.price_affiliate) : null,
      category: product.category,
      image: product.image_url,
      stock: product.stock,
      isPackage: product.is_package || false,
      packageType: product.package_type,
      isDigital: product.is_digital || false,
      digitalContent: product.digital_content
    })
  } catch (error) {
    console.error('Product error:', error)
    res.status(500).json({ message: 'Errore nel recupero del prodotto' })
  }
})

module.exports = router
