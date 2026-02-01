const { seedData } = require('../scripts/seeder')
const User = require('../models/User')
const Product = require('../models/Product')
const Category = require('../models/Category')
const Order = require('../models/Order')
const Settings = require('../models/Settings')
const fs = require('fs')
const path = require('path')
const cloudinary = require('cloudinary').v2

exports.seed = async (req, res, next) => {
  try {
    // allow running in non-production only or allow if explicitly enabled
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_REMOTE_SEED !== 'true') {
      return res.status(403).json({ error: 'Not allowed in production' })
    }
    await seedData()
    res.json({ ok: true })
  } catch (err) { next(err) }
}

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (err) { next(err) }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Prevent deleting the only admin account
    if (user.role === 'admin'){
      const admins = await User.countDocuments({ role: 'admin' })
      if (admins <= 1) return res.status(403).json({ error: 'Cannot delete the only admin account' })
    }

    await user.deleteOne()
    res.json({ ok: true })
  } catch (err) { next(err) }
}

exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const { role } = req.body
    if (!['admin','cashier','user'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Prevent having more than one admin
    if (role === 'admin'){
      const existing = await User.findOne({ role: 'admin' })
      if (existing && existing._id.toString() !== id) return res.status(400).json({ error: 'An admin account already exists' })
    }

    user.role = role
    await user.save()
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) { next(err) }
}

exports.uploadPhonePeQr = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    // Upload to Cloudinary if configured
    if (process.env.CLOUDINARY_URL) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pos-phonepe',
          resource_type: 'image',
          public_id: 'phonepe-qr'
        })
        // Delete old QR from Cloudinary if it exists
        const oldSetting = await Settings.findOne({ key: 'phonepe_qr_url' })
        if (oldSetting && oldSetting.cloudinaryPublicId) {
          try { await cloudinary.uploader.destroy(oldSetting.cloudinaryPublicId) } catch (e) { /* ignore */ }
        }
        // Store URL in Settings
        await Settings.findOneAndUpdate(
          { key: 'phonepe_qr_url' },
          { value: result.secure_url, cloudinaryPublicId: result.public_id },
          { upsert: true, new: true }
        )
        // Clean up temp file
        fs.unlinkSync(req.file.path)
        return res.json({ ok: true, url: result.secure_url })
      } catch (err) {
        fs.unlinkSync(req.file.path)
        return next(err)
      }
    }

    // Fallback: save to uploads/phonepe-qr.png
    const uploadsDir = path.join(__dirname, '..', 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
    const dest = path.join(uploadsDir, 'phonepe-qr.png')
    if (fs.existsSync(dest)) fs.unlinkSync(dest)
    fs.renameSync(req.file.path, dest)
    // Store in Settings too
    await Settings.findOneAndUpdate(
      { key: 'phonepe_qr_url' },
      { value: '/uploads/phonepe-qr.png', cloudinaryPublicId: null },
      { upsert: true, new: true }
    )
    return res.json({ ok: true, url: '/uploads/phonepe-qr.png' })
  } catch (err) { next(err) }
}

exports.backupAndWipe = async (req, res, next) => {
  try {
    const { adminKey } = req.body
    const serverKey = String(process.env.ADMIN_SIGNUP_KEY || '').trim()
    if (!serverKey) return res.status(403).json({ error: 'Admin key not configured on server' })
    if (String(adminKey || '').trim() !== serverKey) return res.status(403).json({ error: 'Invalid admin key' })

    const timestamp = new Date().toISOString().replace(/[:.]/g,'-')
    const uploadsDir = path.join(__dirname, '..', 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    // Fetch data
    const products = await Product.find().lean()
    const categories = await Category.find().lean()
    const orders = await Order.find().lean()
    const users = await User.find().select('-password').lean()

    // Helper to stringify CSV
    const toCsv = (arr) => {
      if (!arr || arr.length === 0) return ''
      const keys = Array.from(arr.reduce((s,item)=>{ Object.keys(item).forEach(k=>s.add(k)); return s }, new Set()))
      const header = keys.join(',')
      const rows = arr.map(item => keys.map(k=>{
        let v = item[k]
        if (v === null || v === undefined) return ''
        if (typeof v === 'object') v = JSON.stringify(v)
        return '"'+String(v).replace(/"/g,'""')+'"'
      }).join(','))
      return [header].concat(rows).join('\n')
    }

    const files = []
    const write = (name, data) => {
      const filename = `backup-${timestamp}-${name}.csv`
      const fp = path.join(uploadsDir, filename)
      fs.writeFileSync(fp, data || '')
      files.push({ name, url: `/uploads/${filename}` })
    }

    write('products', toCsv(products))
    write('categories', toCsv(categories))
    write('orders', toCsv(orders))
    write('users', toCsv(users))

    // Perform wipe but keep the calling admin user
    const callerId = req.user && req.user.id
    await Product.deleteMany({})
    await Category.deleteMany({})
    await Order.deleteMany({})
    if (callerId) {
      await User.deleteMany({ _id: { $ne: callerId } })
    } else {
      await User.deleteMany({})
    }

    res.json({ ok: true, backups: files })
  } catch (err) { next(err) }
}

exports.getPhonePeQr = async (req, res, next) => {
  try {
    const setting = await Settings.findOne({ key: 'phonepe_qr_url' })
    if (!setting || !setting.value) return res.status(404).json({ error: 'No PhonePe QR configured' })
    res.json({ url: setting.value })
  } catch (err) { next(err) }
}

// List pending orders for payment verification
exports.getPendingPayments = async (req, res, next) => {
  try {
    const orders = await Order.find({ paymentStatus: 'PENDING' })
      .populate('cashier', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
    res.json(orders)
  } catch (err) { next(err) }
}

// Manually mark an order as paid (for PhonePe personal QR verification)
exports.verifyPayment = async (req, res, next) => {
  try {
    const { orderId, transactionId } = req.body
    if (!orderId) return res.status(400).json({ error: 'missing orderId' })
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ error: 'order not found' })
    order.paymentStatus = 'PAID'
    order.transactionId = transactionId || 'VERIFIED_ADMIN'
    order.paymentDetails = { method: 'PHONEPE_PERSONAL', verifiedBy: req.user && req.user.id, verifiedAt: new Date() }
    await order.save()
    res.json({ ok: true, order })
  } catch (err) { next(err) }
}