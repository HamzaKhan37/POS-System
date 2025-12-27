const Product = require('../models/Product')
const path = require('path')
const fs = require('fs')

const DEFAULT_IMAGE_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23888' font-family='Arial' font-size='24'>No Image</text></svg>"

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
  try {
    let products = await Product.find().populate('category','name')
    // If an image was supposed to be a local upload but the file is missing, return a friendly placeholder
    products = products.map(p => {
      if (p.imageUrl && p.imageUrl.includes('/uploads/')) {
        const parts = p.imageUrl.split('/uploads/')
        const filename = parts[1]
        const filePath = path.join(__dirname, '..', '..', 'uploads', filename)
        if (!fs.existsSync(filePath)) {
          p.imageUrl = DEFAULT_IMAGE_SVG
        }
      }
      return p
    })
    res.json(products)
  } catch (err) { next(err) }
}

exports.getByBarcode = async (req, res, next) => {
  try {
    const p = await Product.findOne({ barcode: req.params.barcode }).populate('category','name')
    if(!p) return res.status(404).json({message:'Not found'})

    if (p.imageUrl && p.imageUrl.includes('/uploads/')) {
      const parts = p.imageUrl.split('/uploads/')
      const filename = parts[1]
      const filePath = path.join(__dirname, '..', '..', 'uploads', filename)
      if (!fs.existsSync(filePath)) p.imageUrl = DEFAULT_IMAGE_SVG
    }

    res.json(p)
  } catch (err) { next(err) }
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
    console.info(`Uploaded file: ${req.file.originalname} -> ${req.file.path}, url: ${url}`)
    res.json({ url })
  } catch (err) { next(err) }
}
