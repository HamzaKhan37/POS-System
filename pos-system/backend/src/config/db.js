const mongoose = require('mongoose')

// Helper: if the URI contains a raw password with special characters, attempt to
// URL-encode only the password portion and return a sanitized URI. This helps
// developers who accidentally put an unencoded password (e.g. containing "@")
// into their `.env` while avoiding printing secrets to logs.
function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return uri

  // Attempt to parse the simple user:pass@host pattern.
  // Note: If the password itself contains a raw '@' (unencoded), parsing is ambiguous
  // because '@' is the separator. In that case, we cannot reliably auto-correct.
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/)
  if (!match) {
    // detect some common unrecoverable problems and provide actionable errors
    if (uri.includes('<') || uri.includes('>') || (uri.split('@').length - 1) > 1) {
      throw new Error('MONGO_URI appears to contain angle brackets or multiple "@" characters (often from including the password raw like "<pass@word>"). This cannot be safely auto-corrected. Rotate your DB user password to one without angle brackets or special unencoded @, then URL-encode the password (encodeURIComponent) when setting MONGO_URI.')
    }
    return uri
  }

  const [, scheme, user, pass, rest] = match

  // detect characters that should be encoded (space, <, >, or other reserved chars)
  if (/[\s<>]/.test(pass) || /[:\/\?#\[\]]/.test(pass)) {
    const encoded = encodeURIComponent(pass)
    return `${scheme}${user}:${encoded}@${rest}`
  }

  // If pass contains an unencoded '@' we would not reach here because match uses [^@]+.
  return uri
}

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/pos_db'

    if (!process.env.MONGO_URI) {
      console.warn('Warning: MONGO_URI not set — falling back to local MongoDB at mongodb://localhost:27017/pos_db. For production set MONGO_URI in your environment.')
    } else {
      if (process.env.MONGO_URI.trim().toUpperCase() === 'MONGO_URI' || !process.env.MONGO_URI.includes('://')) {
        console.error('FATAL: MONGO_URI appears invalid or is a placeholder. Please set a proper connection string in your local `backend/.env` or in the host environment.')
        process.exit(1)
      }

      // Attempt to sanitize if necessary (auto-encode password if it contains raw special chars)
      const sanitized = sanitizeMongoUri(uri)
      if (sanitized !== uri) {
        console.info('Info: Detected special characters in MongoDB password — applying URL-encoding to the password for this connection attempt.')
        uri = sanitized
      }

      // Basic sanity checks for common misconfigurations
      if (uri.includes('<') || uri.includes('>') || /\s/.test(uri)) {
        console.error('FATAL: MONGO_URI contains placeholder characters or whitespace (e.g. "<" or ">"). Please set a proper connection string with the password URL-encoded and no angle brackets.')
        process.exit(1)
      }
    }

    // add a short connect timeout to fail fast for network issues
    await mongoose.connect(uri, { connectTimeoutMS: 10000 })

    // try to extract host for a helpful log message (don't print credentials)
    let host = 'local'
    try {
      if (uri.includes('@')) host = uri.split('@')[1].split('/')[0]
      else host = uri.split('/')[2] || host
    } catch (e) { /* ignore parsing errors */ }

    console.log(`MongoDB connected to ${host}`)
  } catch (err) {
    console.error('MongoDB connection error:', err && err.message ? err.message : err)

    if (err && err.name === 'MongoNetworkError') {
      console.error('Possible causes: Atlas IP whitelist does not include your IP, network/firewall block, or wrong host in the URI. For Atlas, add your IP in Network Access or use 0.0.0.0/0 temporarily for dev.')
    }

    if (err && err.message && err.message.toLowerCase().includes('authentication')) {
      console.error('Authentication failed: check username/password and ensure special characters in the password are URL-encoded (e.g. "@" → "%40").')
    }

    process.exit(1)
  }
}

module.exports = connectDB
