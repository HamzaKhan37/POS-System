const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const errorHandler = require('./middleware/error.middleware')
const { defaultLimiter } = require('./middleware/rateLimiter.middleware')

const path = require('path')
const app = express()
app.use(helmet({
  // allow images to be fetched cross-origin (frontend often runs on a different port during dev)
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // allow img-src from self, data, and the configured allowed origin (helps when frontend is served from another origin)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:', process.env.ALLOWED_ORIGIN || '*'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      upgradeInsecureRequests: []
    }
  }
}))
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }))
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf } }))
app.use(morgan('dev'))
app.use(defaultLimiter)

// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/products', require('./routes/product.routes'))
app.use('/api/categories', require('./routes/category.routes'))
app.use('/api/orders', require('./routes/order.routes'))
app.use('/api/reports', require('./routes/report.routes'))
app.use('/api/payments/phonepe', require('./routes/phonepe.routes'))
app.use('/api/admin', require('./routes/admin.routes'))

// Basic root page and health check for quick verification in dev
app.get('/', (req, res) => {
  res.send('<h1>POS Backend</h1><p>API base: <code>/api</code> — try <a href="/api/products">/api/products</a> or <a href="/api/orders">/api/orders</a></p>')
})
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime(), env: process.env.NODE_ENV || 'development' }))

app.use(errorHandler)

module.exports = app
