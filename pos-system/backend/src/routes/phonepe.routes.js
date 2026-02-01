const express = require('express')
const router = express.Router()
const phonepe = require('../controllers/phonepe.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

// generate UPI link/QR for an order
router.post('/upi-qr', express.json(), phonepe.createUpiQr)

// PhonePe will POST JSON; verify signature by using raw body
router.post('/webhook', express.raw({ type: '*/*' }), phonepe.webhook)

// local test endpoint to simulate webhook (enabled via PHONEPE_ALLOW_TEST=true)
router.post('/webhook-test', express.json(), phonepe.webhookTest)

// return configured personal QR (env or uploaded file)
router.get('/qr', phonepe.getQr)

// mark an order as paid when using a personal QR (protected)
router.post('/mark-paid', express.json(), protect, authorize('admin','cashier'), phonepe.markPaid)

module.exports = router
