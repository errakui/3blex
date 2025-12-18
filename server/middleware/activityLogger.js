const { logActivity } = require('../utils/activityLogger')

/**
 * Middleware to automatically log authenticated actions
 */
function activityLoggerMiddleware(req, res, next) {
  // Skip logging for certain endpoints
  const skipPaths = ['/api/health', '/api/auth/login', '/api/auth/me']
  
  if (skipPaths.includes(req.path)) {
    return next()
  }

  // Log after response is sent
  const originalSend = res.send
  res.send = function(data) {
    // Only log successful requests (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const action = `${req.method} ${req.path}`
      const entityType = req.params.id ? req.path.split('/')[2] : null
      const entityId = req.params.id ? parseInt(req.params.id) : null
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress

      logActivity(
        req.user.id,
        action,
        entityType,
        entityId,
        {
          method: req.method,
          path: req.path,
          body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
        },
        ipAddress
      ).catch(err => {
        console.error('Activity logging error:', err)
      })
    }

    return originalSend.call(this, data)
  }

  next()
}

module.exports = activityLoggerMiddleware

