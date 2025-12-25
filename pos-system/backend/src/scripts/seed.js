const mongoose = require('mongoose')
require('dotenv').config()
const connectDB = require('../config/db')
const { seedData } = require('./seeder')

const seed = async () => {
  await connectDB()
  await seedData()
  console.log('Seed complete')
  process.exit(0)
}

seed().catch(e=>{ console.error(e); process.exit(1) })
