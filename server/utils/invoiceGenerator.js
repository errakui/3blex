const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const pool = require('../db/index')

/**
 * Generate invoice PDF for order
 */
async function generateInvoicePDF(orderId) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get order details
      const orderResult = await pool.query(
        `SELECT 
          o.*,
          u.name as user_name,
          u.email as user_email,
          u.tax_code,
          u.address_line1,
          u.city,
          u.postal_code,
          u.country
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.id = $1`,
        [orderId]
      )

      if (orderResult.rows.length === 0) {
        return reject(new Error('Ordine non trovato'))
      }

      const order = orderResult.rows[0]

      // Get order items
      const itemsResult = await pool.query(
        `SELECT 
          oi.*,
          p.name as product_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [orderId]
      )

      // Generate invoice number if not exists
      let invoiceNumber = order.invoice_number
      if (!invoiceNumber) {
        invoiceNumber = `INV-${order.order_number}-${Date.now()}`
        await pool.query(
          'UPDATE orders SET invoice_number = $1, invoice_issued = true WHERE id = $2',
          [invoiceNumber, orderId]
        )
      }

      // Create PDF
      const doc = new PDFDocument({ margin: 50 })
      const fileName = `invoice_${invoiceNumber}.pdf`
      const filePath = path.join(__dirname, '../../uploads/invoices', fileName)

      // Ensure directory exists
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      // Header
      doc.fontSize(20).text('3Blex Network', { align: 'center' })
      doc.fontSize(14).text('Fattura', { align: 'center' })
      doc.moveDown()

      // Invoice details
      doc.fontSize(12)
      doc.text(`Numero Fattura: ${invoiceNumber}`, { align: 'right' })
      doc.text(`Data: ${new Date(order.created_at).toLocaleDateString('it-IT')}`, { align: 'right' })
      doc.text(`Ordine: ${order.order_number}`, { align: 'right' })
      doc.moveDown()

      // Customer info
      doc.text('Cliente:', { underline: true })
      doc.text(order.customer_name || order.user_name || 'Cliente')
      if (order.customer_email || order.user_email) {
        doc.text(order.customer_email || order.user_email)
      }
      if (order.customer_phone) {
        doc.text(order.customer_phone)
      }
      doc.moveDown()

      // Items table
      doc.text('Prodotti:', { underline: true })
      doc.moveDown(0.5)

      // Table header
      doc.font('Helvetica-Bold')
      doc.text('Prodotto', 50, doc.y)
      doc.text('Quantità', 300, doc.y)
      doc.text('Prezzo', 400, doc.y)
      doc.text('Totale', 480, doc.y)
      doc.moveDown()

      // Items
      doc.font('Helvetica')
      let total = 0
      itemsResult.rows.forEach(item => {
        const itemTotal = parseFloat(item.price) * item.quantity
        total += itemTotal

        doc.text(item.product_name || 'Prodotto', 50, doc.y)
        doc.text(item.quantity.toString(), 300, doc.y)
        doc.text(`€${parseFloat(item.price).toFixed(2)}`, 400, doc.y)
        doc.text(`€${itemTotal.toFixed(2)}`, 480, doc.y)
        doc.moveDown()
      })

      // Total
      doc.moveDown()
      doc.font('Helvetica-Bold')
      doc.text(`Totale: €${order.total.toFixed(2)}`, { align: 'right' })

      // Footer
      doc.moveDown(2)
      doc.fontSize(10).font('Helvetica')
      doc.text('Grazie per il tuo acquisto!', { align: 'center' })

      doc.end()

      stream.on('finish', () => {
        resolve({
          filePath,
          fileName,
          invoiceNumber
        })
      })

      stream.on('error', reject)

    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Get invoice download URL
 */
function getInvoiceUrl(fileName) {
  return `/uploads/invoices/${fileName}`
}

module.exports = {
  generateInvoicePDF,
  getInvoiceUrl
}

