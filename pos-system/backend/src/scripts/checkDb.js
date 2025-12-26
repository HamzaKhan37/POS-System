const connectDB = require('../config/db')
const mongoose = require('mongoose')

async function check() {
  try {
    // connectDB will exit the process on failure with helpful errors
    await connectDB()

    const db = mongoose.connection.db
    const collections = await db.listCollections().toArray()

    console.log('\nDatabase connection verified. Collections and counts:')

    for (const c of collections) {
      try {
        const count = await db.collection(c.name).estimatedDocumentCount()
        console.log(` - ${c.name}: ~${count} documents`)
      } catch (e) {
        console.log(` - ${c.name}: (error getting count)`, e.message)
      }
    }

    // disconnect
    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('DB check failed:', err && err.message ? err.message : err)
    process.exit(1)
  }
}

check()
