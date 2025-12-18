require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const dashboardRoutes = require('./routes/dashboard')
const networkRoutes = require('./routes/network')
const kycRoutes = require('./routes/kyc')
const subscriptionRoutes = require('./routes/subscription')
const productRoutes = require('./routes/products')
const orderRoutes = require('./routes/orders')
const adminRoutes = require('./routes/admin')
const notificationRoutes = require('./routes/notifications')
const walletRoutes = require('./routes/wallet')
const qualificationsRoutes = require('./routes/qualifications')
const networkBinaryRoutes = require('./routes/networkBinary')
const auth2FARoutes = require('./routes/auth2FA')
const passwordResetRoutes = require('./routes/passwordReset')
const referralLinksRoutes = require('./routes/referralLinks')
const eventsRoutes = require('./routes/events')
const supportTicketsRoutes = require('./routes/supportTickets')
const invoicesRoutes = require('./routes/invoices')
const trackingRoutes = require('./routes/tracking')
const broadcastRoutes = require('./routes/broadcast')
const commissionsRoutes = require('./routes/commissions')
const setupRoutes = require('./routes/setup') // ⚠️ TEMPORANEO - rimuovere dopo setup
const activityLoggerMiddleware = require('./middleware/activityLogger')

const app = express()
// Fly.io usa una porta dinamica, altrimenti usa 3001 per sviluppo
const PORT = process.env.PORT || process.env.API_PORT || 3001

// Middleware
// CORS configuration per produzione e sviluppo
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://localhost:8080']

app.use(cors({
  origin: function (origin, callback) {
    // Permetti richieste senza origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    // In produzione, verifica l'origin
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('.fly.dev')) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    } else {
      // In sviluppo, permetti tutto
      callback(null, true)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Activity logger (after auth middleware in routes)

// Upload directory for KYC documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/network', networkRoutes)
app.use('/api/kyc', kycRoutes)
app.use('/api/subscription', subscriptionRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/qualifications', qualificationsRoutes)
app.use('/api/network-binary', networkBinaryRoutes)
app.use('/api/auth/2fa', auth2FARoutes)
app.use('/api/auth/password-reset', passwordResetRoutes)
app.use('/api/referral-links', referralLinksRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/support-tickets', supportTicketsRoutes)
app.use('/api/invoices', invoicesRoutes)
app.use('/api/tracking', trackingRoutes)
app.use('/api/broadcast', broadcastRoutes)
app.use('/api/commissions', commissionsRoutes)
app.use('/api', setupRoutes) // ⚠️ TEMPORANEO - rimuovere dopo setup

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '3Blex Network API is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

