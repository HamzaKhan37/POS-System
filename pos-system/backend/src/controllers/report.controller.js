const Order = require('../models/Order')
const Product = require('../models/Product')

exports.salesSummary = async (req,res,next) => {
  try{
    const { start, end } = req.query
    const match = {}
    if (start && end) match.createdAt = { $gte: new Date(start), $lte: new Date(end) }
    const summary = await Order.aggregate([{ $match: match }, { $group: { _id: null, totalSales: { $sum: '$grandTotal' }, totalTax: { $sum: '$taxTotal' }, totalDiscount: { $sum: '$discount' }, orders: { $sum: 1 } } }])
    res.json(summary[0] || {})
  }catch(err){ next(err) }
}

exports.topProducts = async (req,res,next) => {
  try{
    const result = await Order.aggregate([{ $unwind: '$items' },{ $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },{ $sort: { quantity: -1 } },{ $limit: 10 }])
    res.json(result)
  }catch(err){ next(err) }
}

exports.lowStock = async (req,res,next) => { try{ const products = await Product.find({ stock: { $lt: 10 } }).select('name stock'); res.json(products) }catch(err){ next(err) } }

// Analytics: totals and series for charts
exports.analytics = async (req,res,next) => {
  try{
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // totals
    const [dayAgg] = await Order.aggregate([{ $match: { createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }])
    const [monthAgg] = await Order.aggregate([{ $match: { createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }])
    const [yearAgg] = await Order.aggregate([{ $match: { createdAt: { $gte: startOfYear } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }])

    // last 7 days series
    const days = []
    for (let i=6;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i)
      const next = new Date(d); next.setDate(d.getDate()+1)
      days.push({ start: d, end: next })
    }
    const daySeries = await Promise.all(days.map(async (r)=>{ const [a] = await Order.aggregate([{ $match: { createdAt: { $gte: r.start, $lt: r.end } } },{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]); return a ? a.total : 0 }))

    // last 12 months series
    const months = []
    for (let i=11;i>=0;i--){
      const m = new Date(now.getFullYear(), now.getMonth()-i, 1)
      const next = new Date(m.getFullYear(), m.getMonth()+1, 1)
      months.push({ start: m, end: next })
    }
    const monthSeries = await Promise.all(months.map(async (r)=>{ const [a] = await Order.aggregate([{ $match: { createdAt: { $gte: r.start, $lt: r.end } } },{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]); return a ? a.total : 0 }))

    res.json({ totals: { day: dayAgg||{ total:0, orders:0 }, month: monthAgg||{ total:0, orders:0 }, year: yearAgg||{ total:0, orders:0 } }, series: { last7days: daySeries, last12months: monthSeries } })
  }catch(err){ next(err) }
}
