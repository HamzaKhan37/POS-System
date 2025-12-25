const express = require('express')
const router = express.Router()
const phonepe = require('../controllers/phonepe.controller')

// generate UPI link/QR for an order
router.post('/upi-qr', express.json(), phonepe.createUpiQr)

// PhonePe will POST JSON; verify signature by using raw body
router.post('/webhook', express.raw({ type: '*/*' }), phonepe.webhook)

// local test endpoint to simulate webhook (enabled via PHONEPE_ALLOW_TEST=true)
router.post('/webhook-test', express.json(), phonepe.webhookTest)

module.exports = router
