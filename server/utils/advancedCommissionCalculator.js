const pool = require('../db/index')
const { processCommissionToWallet } = require('./commissionWallet')

/**
 * ============================================
 * BINARY COMMISSION SYSTEM
 * ============================================
 */

/**
 * Calculate binary commissions based on weaker leg volume
 * @param {number} userId - User ID to calculate commissions for
 * @param {Date} periodStart - Period start date
 * @param {Date} periodEnd - Period end date
 * @param {Object} config - Configuration object
 */
async function calculateBinaryCommissions(userId, periodStart, periodEnd, config = {}) {
  try {
    const {
      percentage = 10, // 10% on weaker leg volume
      maxCommission = 50000, // Max commission per period (€50,000)
      minVolume = 100, // Minimum volume required
      maxLevel = 10, // Maximum depth levels
      qualification = null // Rank/qualification required
    } = config

    // Get user data
    const userResult = await pool.query(
      `SELECT 
        id, left_volume, right_volume, group_volume as gv,
        personal_volume as pv, current_rank, subscription_status,
        kyc_status
      FROM users 
      WHERE id = $1`,
      [userId]
    )

    if (userResult.rows.length === 0) {
      return { success: false, message: 'Utente non trovato' }
    }

    const user = userResult.rows[0]

    // Check qualifications
    if (qualification && user.current_rank !== qualification) {
      return { success: false, message: 'Qualifica non sufficiente' }
    }

    // Check active subscription
    if (user.subscription_status !== 'active') {
      return { success: false, message: 'Abbonamento non attivo' }
    }

    const leftVolume = parseFloat(user.left_volume) || 0
    const rightVolume = parseFloat(user.right_volume) || 0
    const weakerLegVolume = Math.min(leftVolume, rightVolume)
    const strongerLegVolume = Math.max(leftVolume, rightVolume)

    // Check minimum volume
    if (weakerLegVolume < minVolume) {
      return { 
        success: false, 
        message: `Volume minimo non raggiunto (min: ${minVolume}, attuale: ${weakerLegVolume})` 
      }
    }

    // Calculate commission on weaker leg
    let commissionAmount = (weakerLegVolume * percentage) / 100

    // Apply max commission cap
    if (commissionAmount > maxCommission) {
      commissionAmount = maxCommission
    }

    // Check for existing commission in this period
    const existingCommission = await pool.query(
      `SELECT id FROM commissions 
       WHERE referrer_id = $1 
       AND commission_type = 'binary'
       AND created_at >= $2 
       AND created_at <= $3
       AND status != 'cancelled'`,
      [userId, periodStart, periodEnd]
    )

    if (existingCommission.rows.length > 0) {
      return { 
        success: false, 
        message: 'Commissione binaria già calcolata per questo periodo' 
      }
    }

    // Create commission record
    const commissionResult = await pool.query(
      `INSERT INTO commissions 
       (referrer_id, amount, percentage, status, commission_type, period_start, period_end)
       VALUES ($1, $2, $3, 'pending', 'binary', $4, $5)
       RETURNING id`,
      [userId, commissionAmount, percentage, periodStart, periodEnd]
    )

    const commissionId = commissionResult.rows[0].id

    // Try to process to wallet
    await processCommissionToWallet(commissionId, userId, commissionAmount)

    return {
      success: true,
      commissionId,
      amount: commissionAmount,
      weakerLegVolume,
      strongerLegVolume,
      balancePercentage: leftVolume > 0 && rightVolume > 0
        ? Math.round((weakerLegVolume / strongerLegVolume) * 100)
        : 0
    }

  } catch (error) {
    console.error('Error calculating binary commissions:', error)
    throw error
  }
}

/**
 * ============================================
 * MULTILEVEL COMMISSION SYSTEM
 * ============================================
 */

/**
 * Calculate multilevel commissions (up to N levels deep)
 * @param {number} orderId - Order ID that triggered the commission
 * @param {Object} config - Configuration object
 */
async function calculateMultilevelCommissions(orderId, config = {}) {
  try {
    const {
      levels = 7, // Number of levels
      percentages = [5, 3, 2, 1, 1, 0.5, 0.5], // Percentages per level (default 7 levels)
      minQualification = null, // Minimum rank for each level
      maxCommissionPerLevel = null // Max commission per level
    } = config

    // Get order details
    const orderResult = await pool.query(
      `SELECT 
        o.id, o.user_id, o.total, o.created_at,
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
    const orderTotal = parseFloat(order.total)

    if (!order.referred_by) {
      return { success: true, message: 'Nessun referrer, nessuna commissione' }
    }

    // Traverse upline
    const commissionsCreated = []
    let currentUserId = order.referred_by
    let level = 0

    while (currentUserId && level < levels) {
      // Get user data
      const userResult = await pool.query(
        `SELECT 
          id, referred_by, subscription_status, kyc_status, current_rank
        FROM users 
        WHERE id = $1`,
        [currentUserId]
      )

      if (userResult.rows.length === 0) {
        break // User doesn't exist, stop traversing
      }

      const user = userResult.rows[0]

      // Check if user has active subscription
      if (user.subscription_status !== 'active') {
        currentUserId = user.referred_by
        level++
        continue // Skip this level, continue up
      }

      // Check qualification if required
      if (minQualification && user.current_rank && 
          getRankLevel(user.current_rank) < getRankLevel(minQualification)) {
        currentUserId = user.referred_by
        level++
        continue
      }

      // Get percentage for this level
      const percentage = percentages[level] || 0

      if (percentage > 0) {
        // Calculate commission amount
        let commissionAmount = (orderTotal * percentage) / 100

        // Apply max commission per level if set
        if (maxCommissionPerLevel && commissionAmount > maxCommissionPerLevel) {
          commissionAmount = maxCommissionPerLevel
        }

        // Create commission record
        const commissionResult = await pool.query(
          `INSERT INTO commissions 
           (referrer_id, referred_id, order_id, amount, percentage, status, commission_type, level)
           VALUES ($1, $2, $3, $4, $5, 'pending', 'multilevel', $6)
           RETURNING id`,
          [currentUserId, order.user_id, orderId, commissionAmount, percentage, level + 1]
        )

        const commissionId = commissionResult.rows[0].id

        // Try to process to wallet
        try {
          await processCommissionToWallet(commissionId, currentUserId, commissionAmount)
        } catch (error) {
          console.error(`Error processing commission for level ${level + 1}:`, error)
        }

        commissionsCreated.push({
          level: level + 1,
          userId: currentUserId,
          amount: commissionAmount,
          percentage,
          commissionId
        })
      }

      // Move to next level
      currentUserId = user.referred_by
      level++
    }

    return {
      success: true,
      commissionsCreated,
      totalAmount: commissionsCreated.reduce((sum, c) => sum + c.amount, 0),
      levelsProcessed: level
    }

  } catch (error) {
    console.error('Error calculating multilevel commissions:', error)
    throw error
  }
}

/**
 * Helper function to get rank level (for qualification checks)
 */
function getRankLevel(rank) {
  const rankLevels = {
    'bronze': 1,
    'silver': 2,
    'gold': 3,
    'platinum': 4,
    'diamond': 5,
    'executive': 6,
    'crown': 7
  }
  return rankLevels[rank?.toLowerCase()] || 0
}

/**
 * ============================================
 * HYBRID COMMISSION SYSTEM (Binary + Multilevel)
 * ============================================
 */

/**
 * Calculate hybrid commissions (both binary and multilevel)
 * @param {number} userId - User ID for binary commission
 * @param {number} orderId - Order ID for multilevel commission
 * @param {Date} periodStart - Period start for binary
 * @param {Date} periodEnd - Period end for binary
 * @param {Object} binaryConfig - Binary config
 * @param {Object} multilevelConfig - Multilevel config
 */
async function calculateHybridCommissions(
  userId, 
  orderId, 
  periodStart, 
  periodEnd,
  binaryConfig = {},
  multilevelConfig = {}
) {
  try {
    const results = {
      binary: null,
      multilevel: null,
      totalAmount: 0
    }

    // Calculate binary commission
    try {
      results.binary = await calculateBinaryCommissions(userId, periodStart, periodEnd, binaryConfig)
      if (results.binary.success) {
        results.totalAmount += results.binary.amount
      }
    } catch (error) {
      console.error('Error in binary commission:', error)
      results.binary = { success: false, error: error.message }
    }

    // Calculate multilevel commission
    try {
      results.multilevel = await calculateMultilevelCommissions(orderId, multilevelConfig)
      if (results.multilevel.success) {
        results.totalAmount += results.multilevel.totalAmount
      }
    } catch (error) {
      console.error('Error in multilevel commission:', error)
      results.multilevel = { success: false, error: error.message }
    }

    return results

  } catch (error) {
    console.error('Error calculating hybrid commissions:', error)
    throw error
  }
}

/**
 * ============================================
 * QUALIFICATION BONUS SYSTEM
 * ============================================
 */

/**
 * Calculate qualification/rank bonus
 * @param {number} userId - User ID
 * @param {string} qualification - Qualification/rank achieved
 * @param {Object} config - Bonus configuration
 */
async function calculateQualificationBonus(userId, qualification, config = {}) {
  try {
    const {
      bonuses = {
        'bronze': 50,
        'silver': 100,
        'gold': 250,
        'platinum': 500,
        'diamond': 1000,
        'executive': 2500,
        'crown': 5000
      }
    } = config

    const bonusAmount = bonuses[qualification?.toLowerCase()] || 0

    if (bonusAmount === 0) {
      return { success: false, message: 'Qualifica non valida o senza bonus' }
    }

    // Check if bonus already awarded for this qualification
    const existingBonus = await pool.query(
      `SELECT id FROM commissions 
       WHERE referrer_id = $1 
       AND commission_type = 'qualification_bonus'
       AND description LIKE $2
       AND status != 'cancelled'`,
      [userId, `%${qualification}%`]
    )

    if (existingBonus.rows.length > 0) {
      return { success: false, message: 'Bonus qualifica già assegnato' }
    }

    // Create commission record
    const commissionResult = await pool.query(
      `INSERT INTO commissions 
       (referrer_id, amount, percentage, status, commission_type, description)
       VALUES ($1, $2, 0, 'pending', 'qualification_bonus', $3)
       RETURNING id`,
      [userId, bonusAmount, `Bonus qualifica ${qualification}`]
    )

    const commissionId = commissionResult.rows[0].id

    // Process to wallet
    await processCommissionToWallet(commissionId, userId, bonusAmount)

    return {
      success: true,
      commissionId,
      amount: bonusAmount,
      qualification
    }

  } catch (error) {
    console.error('Error calculating qualification bonus:', error)
    throw error
  }
}

/**
 * ============================================
 * PERIODIC BINARY COMMISSION CALCULATION (Cron Job)
 * ============================================
 */

/**
 * Calculate binary commissions for all qualified users in a period
 * @param {Date} periodStart - Period start
 * @param {Date} periodEnd - Period end
 * @param {Object} config - Configuration
 */
async function calculatePeriodBinaryCommissions(periodStart, periodEnd, config = {}) {
  try {
    console.log(`📊 Calculating binary commissions for period: ${periodStart} - ${periodEnd}`)

    // Get all active network members
    const usersResult = await pool.query(
      `SELECT id, current_rank, subscription_status 
       FROM users 
       WHERE subscription_status = 'active' 
       AND role = 'network_member'
       ORDER BY id`
    )

    const users = usersResult.rows
    console.log(`Found ${users.length} active network members`)

    let processed = 0
    let skipped = 0
    let totalAmount = 0

    for (const user of users) {
      try {
        const result = await calculateBinaryCommissions(
          user.id, 
          periodStart, 
          periodEnd, 
          config
        )

        if (result.success) {
          processed++
          totalAmount += result.amount
        } else {
          skipped++
          console.log(`Skipped user ${user.id}: ${result.message}`)
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        skipped++
      }
    }

    console.log(`✅ Processed ${processed} binary commissions, skipped ${skipped}, total: €${totalAmount.toFixed(2)}`)

    return {
      success: true,
      processed,
      skipped,
      totalAmount,
      total: users.length
    }

  } catch (error) {
    console.error('Error calculating period binary commissions:', error)
    throw error
  }
}

module.exports = {
  calculateBinaryCommissions,
  calculateMultilevelCommissions,
  calculateHybridCommissions,
  calculateQualificationBonus,
  calculatePeriodBinaryCommissions
}

