const pool = require('../db/index')
const { processCommissionToWallet } = require('./commissionWallet')

/**
 * Calculate and process commissions for a period
 * @param {Date} periodStart - Start of the period
 * @param {Date} periodEnd - End of the period
 * @param {string} periodType - 'weekly' or 'monthly'
 */
async function calculatePeriodCommissions(periodStart, periodEnd, periodType = 'monthly') {
  try {
    console.log(`📊 Calculating ${periodType} commissions for period: ${periodStart} - ${periodEnd}`)

    // Get all pending commissions for this period
    const commissionsResult = await pool.query(
      `SELECT 
        c.id, c.referrer_id, c.referred_id, c.amount, c.percentage,
        c.subscription_id, c.order_id, c.commission_type,
        u.subscription_status as referrer_status,
        u.kyc_status as referrer_kyc
       FROM commissions c
       JOIN users u ON c.referrer_id = u.id
       WHERE c.status = 'pending'
       AND c.created_at >= $1
       AND c.created_at <= $2`,
      [periodStart, periodEnd]
    )

    const commissions = commissionsResult.rows
    console.log(`Found ${commissions.length} pending commissions`)

    let processed = 0
    let skipped = 0

    for (const commission of commissions) {
      try {
        // Check if referrer has active subscription
        if (commission.referrer_status !== 'active') {
          console.log(`Skipping commission ${commission.id}: referrer not active`)
          skipped++
          continue
        }

        // Process commission to wallet (will check KYC and credit if approved)
        await processCommissionToWallet(
          commission.id,
          commission.referrer_id,
          commission.amount
        )

        processed++
      } catch (error) {
        console.error(`Error processing commission ${commission.id}:`, error)
      }
    }

    console.log(`✅ Processed ${processed} commissions, skipped ${skipped}`)

    return {
      success: true,
      processed,
      skipped,
      total: commissions.length
    }

  } catch (error) {
    console.error('Error calculating period commissions:', error)
    throw error
  }
}

/**
 * Calculate commissions from product sales
 */
async function calculateProductCommissions(orderId) {
  try {
    // Get order details
    const orderResult = await pool.query(
      `SELECT 
        o.id, o.user_id, o.total,
        u.referred_by, u.subscription_status
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    )

    if (orderResult.rows.length === 0) {
      return { success: false, message: 'Ordine non trovato' }
    }

    const order = orderResult.rows[0]

    // Check if customer has a referrer
    if (!order.referred_by) {
      return { success: true, message: 'Nessun referrer' }
    }

    // Check if referrer has active subscription
    const referrerResult = await pool.query(
      `SELECT id, subscription_status, kyc_status FROM users WHERE id = $1`,
      [order.referred_by]
    )

    if (referrerResult.rows.length === 0 || referrerResult.rows[0].subscription_status !== 'active') {
      return { success: true, message: 'Referrer non attivo' }
    }

    // Calculate commission (e.g., 5% of order total for product sales)
    const commissionPercentage = 5.0 // Configurable
    const commissionAmount = (parseFloat(order.total) * commissionPercentage) / 100

    // Create commission
    const commissionResult = await pool.query(
      `INSERT INTO commissions 
       (referrer_id, referred_id, order_id, amount, percentage, status, commission_type)
       VALUES ($1, $2, $3, $4, $5, 'pending', 'product_sale')
       RETURNING id`,
      [order.referred_by, order.user_id, orderId, commissionAmount, commissionPercentage]
    )

    const commissionId = commissionResult.rows[0].id

    // Try to process immediately (will check KYC)
    await processCommissionToWallet(commissionId, order.referred_by, commissionAmount)

    // Notify referrer
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES ($1, 'Nuova Commissione', $2, 'success')`,
      [order.referred_by, `Hai guadagnato €${commissionAmount.toFixed(2)} da una vendita prodotto!`]
    )

    return {
      success: true,
      commissionId,
      amount: commissionAmount
    }

  } catch (error) {
    console.error('Error calculating product commissions:', error)
    throw error
  }
}

/**
 * Cron job function for monthly commission calculation
 */
async function calculateMonthlyCommissions() {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    return await calculatePeriodCommissions(monthStart, monthEnd, 'monthly')
  } catch (error) {
    console.error('Error in monthly commission calculation:', error)
    throw error
  }
}

/**
 * Cron job function for weekly commission calculation
 */
async function calculateWeeklyCommissions() {
  try {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    return await calculatePeriodCommissions(weekStart, weekEnd, 'weekly')
  } catch (error) {
    console.error('Error in weekly commission calculation:', error)
    throw error
  }
}

module.exports = {
  calculatePeriodCommissions,
  calculateProductCommissions,
  calculateMonthlyCommissions,
  calculateWeeklyCommissions
}

