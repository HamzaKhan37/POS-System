const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

function signToken(user){
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'changeme', { expiresIn: process.env.JWT_EXPIRE || '1d' })
}

function validateEmail(email){ return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) }

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' })
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })
    const user = await User.create({ name, email, password, role })
    const token = signToken(user)
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already exists' })
    next(err)
  }
}

// public signup for customers
exports.registerPublic = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' })
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })
    const user = await User.create({ name, email, password, role: 'user' })
    const token = signToken(user)
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already exists' })
    next(err)
  }
}

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (err) { next(err) }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' })
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
    const token = signToken(user)
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (err) { next(err) }
}

// Google Sign-In
exports.googleSignIn = async (req, res, next) => {
  try{
    const { idToken } = req.body
    if (!idToken) return res.status(400).json({ message: 'idToken required' })
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    const { email, name, sub: googleId } = payload
    if (!email) return res.status(400).json({ message: 'Google account missing email' })
    let user = await User.findOne({ email })
    if (!user) user = await User.create({ name: name || 'Google User', email, password: Math.random().toString(36).slice(2,12), role: 'user' })
    const token = signToken(user)
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
  }catch(err){ next(err) }
}

// Register an admin via secret key (requires ADMIN_SIGNUP_KEY to match)
// NOTE: This endpoint now allows creating additional admins as long as the correct adminKey is supplied.
exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, adminKey } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' })

    const serverKey = String(process.env.ADMIN_SIGNUP_KEY || '').trim()
    if (!serverKey) return res.status(403).json({ message: 'Admin signup is not enabled on this server' })

    const provided = String(adminKey || '').trim()
    if (provided !== serverKey) return res.status(403).json({ message: 'Invalid admin signup key' })

    // normalize email to avoid case-sensitivity issues
    const normalizedEmail = String(email).toLowerCase()
    const user = await User.create({ name, email: normalizedEmail, password, role: 'admin' })
    const token = signToken(user)
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already exists' })
    next(err)
  }
}
