const { calculateMonthlyCommissions, calculateWeeklyCommissions } = require('./commissionCalculator')

/**
 * Cron job scheduler
 * This should be called from a cron service or scheduled task runner
 */

// Monthly commission calculation (runs on 1st of each month)
async function scheduleMonthlyCommissions() {
  try {
    console.log('📅 Running monthly commission calculation...')
    const result = await calculateMonthlyCommissions()
    console.log(`✅ Monthly commissions processed: ${result.processed}/${result.total}`)
    return result
  } catch (error) {
    console.error('❌ Error in monthly commission calculation:', error)
    throw error
  }
}

// Weekly commission calculation (runs every Monday)
async function scheduleWeeklyCommissions() {
  try {
    console.log('📅 Running weekly commission calculation...')
    const result = await calculateWeeklyCommissions()
    console.log(`✅ Weekly commissions processed: ${result.processed}/${result.total}`)
    return result
  } catch (error) {
    console.error('❌ Error in weekly commission calculation:', error)
    throw error
  }
}

// If running in Node.js with node-cron or similar
if (typeof require !== 'undefined' && require.main === module) {
  const cron = require('node-cron')
  
  // Monthly: 1st day of month at 00:00
  cron.schedule('0 0 1 * *', scheduleMonthlyCommissions)
  
  // Weekly: Every Monday at 00:00
  cron.schedule('0 0 * * 1', scheduleWeeklyCommissions)
  
  console.log('⏰ Cron jobs scheduled')
}

module.exports = {
  scheduleMonthlyCommissions,
  scheduleWeeklyCommissions
}

