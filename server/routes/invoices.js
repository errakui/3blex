const express = require('express')
const router = express.Router()
const pool = require('../db/index')
const { authenticateToken } = require('../middleware/auth')
const { generateInvoicePDF, getInvoiceUrl } = require('../utils/invoiceGenerator')
const path = require('path')
const fs = require('fs')

// Generate invoice for order
router.post('/:orderId/generate', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user.id

    // Check if user owns order or is admin
    const orderResult = await pool.query(
      `SELECT id, user_id, invoice_number, invoice_issued
       FROM orders
       WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [orderId, userId]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ordine non trovato' })
    }

    // Generate PDF
    try {
      const result = await generateInvoicePDF(parseInt(orderId))
      
      // Store invoice data in order
      await pool.query(
        `UPDATE orders 
         SET invoice_number = $1, invoice_issued = true,
             invoice_data = jsonb_build_object('file_path', $2, 'generated_at', CURRENT_TIMESTAMP)
         WHERE id = $3`,
        [result.invoiceNumber, result.filePath, orderId]
      )

      res.json({
        success: true,
        invoiceNumber: result.invoiceNumber,
        downloadUrl: getInvoiceUrl(result.fileName)
      })
    } catch (error) {
      console.error('Error generating invoice:', error)
      res.status(500).json({ success: false, message: 'Errore nella generazione della fattura' })
    }
  } catch (error) {
    console.error('Error generating invoice:', error)
    res.status(500).json({ success: false, message: 'Errore nella generazione della fattura' })
  }
})

// Download invoice
router.get('/:orderId/download', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user.id

    // Check if user owns order or is admin
    const orderResult = await pool.query(
      `SELECT invoice_number, invoice_data
       FROM orders
       WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [orderId, userId]
    )

    if (orderResult.rows.length === 0 || !orderResult.rows[0].invoice_number) {
      return res.status(404).json({ success: false, message: 'Fattura non trovata' })
    }

    const order = orderResult.rows[0]
    const invoiceData = order.invoice_data || {}
    const filePath = invoiceData.file_path

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File fattura non trovato' })
    }

    res.download(filePath, `fattura_${order.invoice_number}.pdf`)
  } catch (error) {
    console.error('Error downloading invoice:', error)
    res.status(500).json({ success: false, message: 'Errore nel download della fattura' })
  }
})

// Get invoice info
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user.id

    const orderResult = await pool.query(
      `SELECT invoice_number, invoice_issued, invoice_data
       FROM orders
       WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [orderId, userId]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ordine non trovato' })
    }

    const order = orderResult.rows[0]

    res.json({
      success: true,
      invoice: {
        invoiceNumber: order.invoice_number,
        issued: order.invoice_issued,
        downloadUrl: order.invoice_issued ? `/api/invoices/${orderId}/download` : null
      }
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    res.status(500).json({ success: false, message: 'Errore nel recupero della fattura' })
  }
})

module.exports = router

