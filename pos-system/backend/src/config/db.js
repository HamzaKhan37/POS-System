const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/pos_db'
    if (!process.env.MONGO_URI) {
      console.warn('Warning: MONGO_URI not set — falling back to local MongoDB at mongodb://localhost:27017/pos_db. For production set MONGO_URI in your .env')
    }
    await mongoose.connect(uri)
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
