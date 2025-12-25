const express = require('express')
const router = express.Router()
const { register, registerPublic, login, me, googleSignIn, registerAdmin } = require('../controllers/auth.controller')
const { protect, authorize } = require('../middleware/auth.middleware')
const { loginLimiter } = require('../middleware/rateLimiter.middleware')

// Register is admin-only (admin can create other admins)
router.post('/register', protect, authorize('admin'), register)
// Public signup for customers
router.post('/register-public', registerPublic)
// Register initial admin via secret key (only when ADMIN_SIGNUP_KEY provided and no admin exists)
router.post('/register-admin', registerAdmin)
// Login with rate-limiter to reduce brute-force
router.post('/login', loginLimiter, login)
// Google Sign-In
router.post('/google', googleSignIn)
router.get('/me', protect, me)

module.exports = router
