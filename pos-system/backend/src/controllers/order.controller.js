const Order = require('../models/Order')
const Product = require('../models/Product')

exports.createOrder = async (req, res, next) => {
  try {
    const { items, discount=0, paymentMode } = req.body
    if (!items || items.length===0) return res.status(400).json({ message: 'Cart empty' })
    if (!['CASH','CARD','UPI'].includes(paymentMode)) return res.status(400).json({ message: 'Invalid payment mode' })

    let subTotal=0, taxTotal=0
    const orderItems=[]

    // atomic stock check + decrement
    for (const it of items) {
      if (!it.product || !it.quantity || it.quantity <= 0) return res.status(400).json({ message: 'Invalid cart item' })
      const product = await Product.findById(it.product)
      if (!product || !product.isActive) return res.status(404).json({ message: 'Product unavailable' })
      if (product.stock < it.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` })

      const lineTotal = product.price * it.quantity
      const taxAmount = lineTotal * (product.taxPercent||0) / 100
      subTotal += lineTotal
      taxTotal += taxAmount

      orderItems.push({ product: product._id, name: product.name, price: product.price, taxPercent: product.taxPercent, quantity: it.quantity, total: lineTotal+taxAmount })

      product.stock -= it.quantity
      await product.save()
    }

    const grandTotal = subTotal + taxTotal - discount
    const paymentStatus = paymentMode === 'CASH' ? 'PAID' : 'PENDING'
    const cashierId = req.user ? req.user.id : null
    const order = await Order.create({ items: orderItems, subTotal, taxTotal, discount, grandTotal, paymentMode, paymentStatus, cashier: cashierId })
    res.status(201).json(order)
  } catch (err) { next(err) }
}

exports.getOrders = async (req, res, next) => { try { const orders = await Order.find().populate('cashier','name email').sort({ createdAt:-1 }); res.json(orders) } catch (err) { next(err) } }
exports.getOrder = async (req, res, next) => { try { const order = await Order.findById(req.params.id).populate('cashier','name email'); if(!order) return res.status(404).json({ message:'Not found' }); res.json(order) } catch (err) { next(err) } }
