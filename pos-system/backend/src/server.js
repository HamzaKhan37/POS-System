require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')

// ensure uploads folder exists for multer
const fs = require('fs')
const path = require('path')
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET not set in production. Set process.env.JWT_SECRET and restart.');
    process.exit(1)
  } else {
    console.warn('Warning: JWT_SECRET not set — using insecure default for development. Set JWT_SECRET in .env to disable this warning.')
  }
}

const PORT = process.env.PORT || 5000
if (process.env.ADMIN_SIGNUP_KEY) console.info('Admin signup: ENABLED (set via ADMIN_SIGNUP_KEY)')

// Helpful masked URI info for debugging (doesn't print secrets)
const rawUri = process.env.MONGO_URI || ''
let maskedHost = '(not set)'
try {
  if (rawUri.includes('@')) maskedHost = rawUri.split('@')[1].split('/')[0]
  else maskedHost = rawUri.split('/')[2] || maskedHost
} catch (e) { /* ignore */ }
console.info(`MONGO_URI host: ${maskedHost} (MONGO_URI set: ${!!process.env.MONGO_URI})`)

// Start server only after DB connection succeeds — fails fast and provides clearer errors
;(async () => {
  try {
    await connectDB()

    // Start the HTTP server and handle common errors (e.g., port already in use)
    const server = app.listen(PORT, () => console.log(`Server listening on ${PORT}`))

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`FATAL: Port ${PORT} is already in use. Stop the other process or set a different PORT (e.g., PORT=5001).`)
      } else {
        console.error('Server error:', err)
      }
      process.exit(1)
    })

    // Graceful shutdown
    const graceful = async () => {
      console.info('Shutting down server...')
      server.close(() => {
        console.info('HTTP server closed.')
        // ensure mongoose disconnects
        try { require('./config/db').disconnect && require('mongoose').disconnect() } catch (e) {}
        process.exit(0)
      })
      // force exit if close does not complete
      setTimeout(() => { console.error('Forcefully exiting'); process.exit(1) }, 5000)
    }
    process.on('SIGINT', graceful)
    process.on('SIGTERM', graceful)

  } catch (err) {
    console.error('Server not started due to DB connection failure.')
    process.exit(1)
  }
})()
