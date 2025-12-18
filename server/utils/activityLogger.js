const pool = require('../db/index')

/**
 * Log user activity
 */
async function logActivity(userId, action, entityType, entityId, details = {}, ipAddress = null) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [userId, action, entityType, entityId, JSON.stringify(details), ipAddress]
    )
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw - logging should not break the main flow
  }
}

/**
 * Log sponsor/placement change (protected action)
 */
async function logSponsorChange(userId, oldSponsorId, newSponsorId, reason, adminId, ipAddress = null) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        userId,
        'sponsor_change',
        'user',
        userId,
        JSON.stringify({
          oldSponsorId,
          newSponsorId,
          reason,
          changedBy: adminId,
          timestamp: new Date().toISOString()
        }),
        ipAddress
      ]
    )
  } catch (error) {
    console.error('Error logging sponsor change:', error)
  }
}

/**
 * Get activity logs for user (admin)
 */
async function getUserActivityLogs(userId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT * FROM activity_logs
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [userId, limit]
    )

    return result.rows
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    throw error
  }
}

/**
 * Get all activity logs (admin)
 */
async function getAllActivityLogs(limit = 100) {
  try {
    const result = await pool.query(
      `SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
       FROM activity_logs al
       JOIN users u ON al.user_id = u.id
       ORDER BY al.timestamp DESC
       LIMIT $1`,
      [limit]
    )

    return result.rows
  } catch (error) {
    console.error('Error fetching all activity logs:', error)
    throw error
  }
}

module.exports = {
  logActivity,
  logSponsorChange,
  getUserActivityLogs,
  getAllActivityLogs
}

