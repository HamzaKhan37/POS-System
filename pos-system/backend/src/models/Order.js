const mongoose = require('mongoose')

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  taxPercent: Number,
  quantity: Number,
  total: Number
}, { _id: false })

const OrderSchema = new mongoose.Schema({
  items: [OrderItemSchema],
  subTotal: { type: Number, required: true },
  taxTotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMode: { type: String, enum: ['CASH','CARD','UPI'], required: true },
  paymentStatus: { type: String, enum: ['PENDING','PAID','FAILED'], default: 'PENDING' },
  transactionId: { type: String },
  paymentDetails: { type: Object },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

module.exports = mongoose.model('Order', OrderSchema)
