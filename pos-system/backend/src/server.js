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
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
  } catch (err) {
    console.error('Server not started due to DB connection failure.')
    process.exit(1)
  }
})()
