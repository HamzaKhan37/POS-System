require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')

connectDB()

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
app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
