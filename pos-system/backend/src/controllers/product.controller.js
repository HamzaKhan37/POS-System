const Product = require('../models/Product')
const path = require('path')

exports.createProduct = async (req, res, next) => {
  try {
    // if an image file was uploaded via multer, expose a usable URL
    if (req.file) {
      const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      req.body.imageUrl = url
    }
    const p = await Product.create(req.body)
    res.status(201).json(p)
  } catch (err) { next(err) }
}

exports.getProducts = async (req, res, next) => {
  try { const products = await Product.find().populate('category','name'); res.json(products) } catch (err) { next(err) }
}

exports.getByBarcode = async (req, res, next) => {
  try { const p = await Product.findOne({ barcode: req.params.barcode }).populate('category','name'); if(!p) return res.status(404).json({message:'Not found'}); res.json(p) } catch (err) { next(err) }
}

exports.updateProduct = async (req, res, next) => {
  try {
    if (req.file) {
      const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      req.body.imageUrl = url
    }
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(p)
  } catch (err) { next(err) }
}

exports.deleteProduct = async (req, res, next) => { try { await Product.findByIdAndDelete(req.params.id); res.json({ ok: true }) } catch (err) { next(err) } }

// Upload handler for single image field (used by /upload route)
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' })
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    res.json({ url })
  } catch (err) { next(err) }
}
