const rateLimit = require('express-rate-limit')

exports.loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Too many login attempts, please try again later' }
})

exports.defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200
})