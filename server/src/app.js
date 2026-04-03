require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')
const { traceId } = require('./utils/helper')

const app = express()

// ========== Security Middleware ==========

// Helmet: set security headers (CSP, XSS, Frame, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image/upload access
  contentSecurityPolicy: false, // frontend handles CSP
}))

// CORS: restrict allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:3200', 'http://localhost:3200']
app.use(cors({
  origin(origin, callback) {
    // allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(null, false)
  },
  credentials: true,
  maxAge: 3600,
}))

// Trust proxy (for Nginx reverse proxy – correct IP and rate limiting)
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false)

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, msg: 'Too many requests, please try again later', data: null },
})
app.use(globalLimiter)

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, msg: 'Too many attempts, please try again later', data: null },
})

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Body parsing with size limits
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ========== Routes ==========

// Apply auth rate limiter to login/register endpoints
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/admin/auth/login', authLimiter)
app.use('/api/subscribe', rateLimit({ windowMs: 60 * 1000, max: 5, message: { code: 429, msg: 'Too many requests', data: null } }))

// Admin routes
app.use('/api/admin/auth', require('./routes/adminAuth'))
app.use('/api/admin/products', require('./routes/adminProducts'))
app.use('/api/admin/collections', require('./routes/adminCollections'))
app.use('/api/admin/orders', require('./routes/adminOrders'))
app.use('/api/admin/users', require('./routes/adminUsers'))
app.use('/api/admin/dashboard', require('./routes/adminDashboard'))
app.use('/api/admin/scraper', require('./routes/adminScraper'))
app.use('/api/admin/whatsapp', require('./routes/adminWhatsapp'))
app.use('/api/admin/line', require('./routes/adminLine'))
app.use('/api/admin/agents', require('./routes/adminAgents'))
app.use('/api/admin/traffic', require('./routes/adminTraffic'))
app.use('/api/admin/oauth', require('./routes/adminOAuth'))
app.use('/api/admin/page-config', require('./routes/adminPageConfig'))
app.use('/api/admin/site-config', require('./routes/adminSiteConfig'))
app.use('/api/admin/upload', require('./routes/adminUpload'))
app.use('/api/admin/subscribers', require('./routes/adminSubscribers'))

// Frontend API
app.use('/api/products', require('./routes/products'))
app.use('/api/collections', require('./routes/collections'))
app.use('/api/whatsapp', require('./routes/whatsapp'))
app.use('/api/line', require('./routes/line'))
app.use('/api/auth', require('./routes/auth'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/traffic', require('./routes/traffic'))
app.use('/api/page-config', require('./routes/pageConfig'))
app.use('/api/subscribe', require('./routes/subscribe'))

// Public: get contact method (per-agent or global fallback)
app.get('/api/contact-method', async (req, res) => {
  try {
    const { agent_code } = req.query
    const User = require('./models/User')
    const SiteConfig = require('./models/SiteConfig')

    // Try agent-specific setting first
    if (agent_code) {
      const agent = await User.findOne({ agent_code: agent_code.toLowerCase(), role: 'agent', status: 'active' })
      if (agent?.contact_method) {
        return res.json({ code: 200, msg: 'ok', data: { method: agent.contact_method } })
      }
    }

    // Fallback: highest-weight agent's setting
    const topAgent = await User.findOne({ role: 'agent', status: 'active' }).sort({ agent_weight: -1 })
    if (topAgent?.contact_method) {
      return res.json({ code: 200, msg: 'ok', data: { method: topAgent.contact_method } })
    }

    // Global fallback
    const cfg = await SiteConfig.findOne({ key: 'contact_method' })
    res.json({ code: 200, msg: 'ok', data: { method: cfg?.value || 'whatsapp' } })
  } catch {
    res.json({ code: 200, msg: 'ok', data: { method: 'whatsapp' } })
  }
})

// Health check (with DB status)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState // 0=disconnected, 1=connected, 2=connecting
  res.json({ code: 200, msg: 'ok', data: { status: 'running', db: dbState === 1 ? 'connected' : 'disconnected' }, trace_id: traceId() })
})

// Serve admin static files (production)
const adminDist = path.join(__dirname, '../../admin/dist')
const fs = require('fs')
if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist))
  app.get('/admin/*path', (req, res) => {
    res.sendFile(path.join(adminDist, 'index.html'))
  })
}

// 404 for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ code: 404, msg: 'Not Found', data: null, trace_id: traceId() })
})

// ========== Error Handler ==========
app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.stack)
  const isProd = process.env.NODE_ENV === 'production'
  res.status(500).json({
    code: 500,
    msg: isProd ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    data: null,
    trace_id: traceId(),
  })
})

// ========== Unhandled Rejection / Exception ==========
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
  // give time to flush logs, then exit
  setTimeout(() => process.exit(1), 1000)
})

// ========== Connect DB & Start ==========
const PORT = process.env.PORT || 3100

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sellforme', {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('MongoDB connected')
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`)
      server.close(async () => {
        await mongoose.connection.close()
        console.log('MongoDB connection closed. Process terminated.')
        process.exit(0)
      })
      // Force close after 10s
      setTimeout(() => {
        console.error('Forced shutdown after timeout')
        process.exit(1)
      }, 10000)
    }
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })
