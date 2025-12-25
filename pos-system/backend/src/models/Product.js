const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  barcode: { type: String, unique: true, sparse: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  taxPercent: { type: Number, default: 0 },
  stock: { type: Number, required: true, min: 0 },
  imageUrl: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = mongoose.model('Product', ProductSchema)
