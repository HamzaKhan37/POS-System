const qrcode = require('qrcode')
const crypto = require('crypto')
const Order = require('../models/Order')

exports.createUpiQr = async (req, res, next) => {
  try {
    const { amount, orderId, note } = req.body
    if (!amount || !orderId) return res.status(400).json({ message: 'Missing amount or orderId' })

    const pa = process.env.PHONEPE_MERCHANT_VPA || 'merchant@upi'
    const pn = process.env.PHONEPE_MERCHANT_NAME || 'MyPOS'
    const am = (Number(amount)).toFixed(2)
    const upiLink = `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&tr=${encodeURIComponent(orderId)}&am=${encodeURIComponent(am)}&cu=INR&tn=${encodeURIComponent(note || 'Order')}`
    const dataUrl = await qrcode.toDataURL(upiLink)
    res.json({ upiLink, qrDataUrl: dataUrl })
  } catch (err) { next(err) }
}

exports.webhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-phonepe-signature'] || req.headers['x-signature']
    const raw = req.rawBody || req.body
    const bodyStr = (raw && raw.toString) ? raw.toString('utf8') : JSON.stringify(req.body)
    const secret = process.env.PHONEPE_SECRET || ''
    const computed = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex')

    // allow bypass in dev with PHONEPE_ALLOW_UNVERIFIED=true
    if (process.env.NODE_ENV !== 'test' && process.env.PHONEPE_ALLOW_UNVERIFIED !== 'true' && signature && signature !== computed) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const payload = JSON.parse(bodyStr)
    const orderId = payload.orderId || payload.tr || (payload.transaction && payload.transaction.orderId)
    if (!orderId) return res.status(400).json({ error: 'missing order id' })

    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ error: 'order not found' })

    const status = payload.status || payload.txnStatus || payload.paymentStatus || 'SUCCESS'
    if (String(status).toUpperCase() === 'SUCCESS') {
      order.paymentStatus = 'PAID'
      order.transactionId = payload.transactionId || payload.txnId || ''
      order.paymentDetails = payload
      await order.save()
      return res.json({ ok: true })
    } else {
      order.paymentStatus = 'FAILED'
      order.paymentDetails = payload
      await order.save()
      return res.json({ ok: true })
    }
  } catch (err) { next(err) }
}

// Simple test endpoint for local development to simulate a PhonePe webhook
exports.webhookTest = async (req, res, next) => {
  try {
    if (process.env.PHONEPE_ALLOW_TEST !== 'true') return res.status(403).json({ error: 'test webhook disabled' })
    const payload = req.body
    const orderId = payload.orderId
    if (!orderId) return res.status(400).json({ error: 'missing orderId' })
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ error: 'order not found' })
    order.paymentStatus = 'PAID'
    order.transactionId = payload.transactionId || 'SIMULATED'
    order.paymentDetails = payload
    await order.save()
    res.json({ ok: true })
  } catch (err) { next(err) }
}
