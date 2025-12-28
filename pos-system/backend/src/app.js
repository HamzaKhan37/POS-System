const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const path = require('path')

const errorHandler = require('./middleware/error.middleware')
const { defaultLimiter } = require('./middleware/rateLimiter.middleware')

const app = express()

/**
 * Allowed frontend origins
 * IMPORTANT: add your actual Vercel domain here
 */
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://billingapplication-two.vercel.app/' // 🔁 replace with your real Vercel URL
]

/**
 * Security headers (relaxed for cross-origin frontend)
 */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", ...ALLOWED_ORIGINS],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"]
      }
    }
  })
)

/**
 * CORS – NO wildcard, explicit origins only
 */
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true) // Postman / curl
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
      return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
)

app.use(express.json({ verify: (req, res, buf) => (req.rawBody = buf) }))
app.use(morgan('dev'))
app.use(defaultLimiter)

/**
 * Static uploads
 */
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

/**
 * API routes
 */
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/products', require('./routes/product.routes'))
app.use('/api/categories', require('./routes/category.routes'))
app.use('/api/orders', require('./routes/order.routes'))
app.use('/api/reports', require('./routes/report.routes'))
app.use('/api/payments/phonepe', require('./routes/phonepe.routes'))
app.use('/api/admin', require('./routes/admin.routes'))

/**
 * Root + health
 */
app.get('/', (req, res) => {
  res.send('<h1>POS Backend</h1><p>API base: <code>/api</code></p>')
})

app.get('/health', (req, res) =>
  res.json({ ok: true, uptime: process.uptime() })
)

/**
 * Error handler (last)
 */
app.use(errorHandler)

module.exports = app
