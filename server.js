/**
 * Custom Next.js Server con Express integrato
 * Per produzione su Fly.io - tutto su una singola porta
 */

require('dotenv').config()
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const express = require('express')
const cors = require('cors')
const path = require('path')

// Import Express routes
const authRoutes = require('./server/routes/auth')
const userRoutes = require('./server/routes/user')
const dashboardRoutes = require('./server/routes/dashboard')
const networkRoutes = require('./server/routes/network')
const kycRoutes = require('./server/routes/kyc')
const subscriptionRoutes = require('./server/routes/subscription')
const productRoutes = require('./server/routes/products')
const orderRoutes = require('./server/routes/orders')
const adminRoutes = require('./server/routes/admin')
const notificationRoutes = require('./server/routes/notifications')
const walletRoutes = require('./server/routes/wallet')
const qualificationsRoutes = require('./server/routes/qualifications')
const networkBinaryRoutes = require('./server/routes/networkBinary')
const auth2FARoutes = require('./server/routes/auth2FA')
const passwordResetRoutes = require('./server/routes/passwordReset')
const referralLinksRoutes = require('./server/routes/referralLinks')
const eventsRoutes = require('./server/routes/events')
const supportTicketsRoutes = require('./server/routes/supportTickets')
const invoicesRoutes = require('./server/routes/invoices')
const trackingRoutes = require('./server/routes/tracking')
const broadcastRoutes = require('./server/routes/broadcast')
const commissionsRoutes = require('./server/routes/commissions')
const emailVerificationRoutes = require('./server/routes/emailVerification')
const setupRoutes = require('./server/routes/setup') // ⚠️ TEMPORANEO - rimuovere dopo setup

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '8080', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  // CORS configuration
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://localhost:8080']

  server.use(cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true)
      if (process.env.NODE_ENV === 'production') {
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('.fly.dev')) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      } else {
        callback(null, true)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))

  server.use(express.json())
  server.use(express.urlencoded({ extended: true }))

  // Upload directory for KYC documents
  server.use('/uploads', express.static(path.join(__dirname, 'server/uploads')))

  // API Routes
  server.use('/api/auth', authRoutes)
  server.use('/api/user', userRoutes)
  server.use('/api/dashboard', dashboardRoutes)
  server.use('/api/network', networkRoutes)
  server.use('/api/kyc', kycRoutes)
  server.use('/api/subscription', subscriptionRoutes)
  server.use('/api/products', productRoutes)
  server.use('/api/orders', orderRoutes)
  server.use('/api/admin', adminRoutes)
  server.use('/api/notifications', notificationRoutes)
  server.use('/api/wallet', walletRoutes)
  server.use('/api/qualifications', qualificationsRoutes)
  server.use('/api/network-binary', networkBinaryRoutes)
  server.use('/api/auth/2fa', auth2FARoutes)
  server.use('/api/auth/password-reset', passwordResetRoutes)
  server.use('/api/referral-links', referralLinksRoutes)
  server.use('/api/events', eventsRoutes)
  server.use('/api/support-tickets', supportTicketsRoutes)
  server.use('/api/invoices', invoicesRoutes)
  server.use('/api/tracking', trackingRoutes)
  server.use('/api/broadcast', broadcastRoutes)
  server.use('/api/commissions', commissionsRoutes)
  server.use('/api/auth', emailVerificationRoutes) // Email verification routes
  server.use('/api/email', emailVerificationRoutes) // Email test routes
  server.use('/api', setupRoutes) // ⚠️ TEMPORANEO - rimuovere dopo setup

  // Health check
  server.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '3Blex Network API is running' })
  })

  // Handle all other requests with Next.js
  server.all('*', (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Create HTTP server
  const httpServer = createServer(server)

  httpServer.listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`🚀 3Blex Network ready on http://${hostname}:${port}`)
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
})

