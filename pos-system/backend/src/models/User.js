const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  // roles: admin, cashier (POS staff), user (customer)
  role: { type: String, enum: ['admin','cashier','user'], default: 'user' }
}, { timestamps: true })

UserSchema.pre('save', async function(next){
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS)
  next()
})

UserSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('User', UserSchema)
