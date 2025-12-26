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

// Analytics: totals, series and breakdowns for charts and lists
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

    // breakdown helpers for modes, categories and cashiers
    const modesForRange = async (start, end) => {
      return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        { $group: { _id: '$paymentMode', total: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
        { $project: { mode: '$_id', total: 1, orders: 1, _id: 0 } },
        { $sort: { total: -1 } }
      ])
    }

    const categoriesForRange = async (start, end) => {
      return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$category.name', revenue: { $sum: '$items.total' }, itemsSold: { $sum: '$items.quantity' } } },
        { $project: { category: '$_id', revenue: 1, itemsSold: 1, _id: 0 } },
        { $sort: { revenue: -1 } }
      ])
    }

    const cashiersForRange = async (start, end) => {
      return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        { $group: { _id: '$cashier', total: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { cashierId: '$_id', name: '$user.name', email: '$user.email', total: 1, orders: 1, _id: 0 } },
        { $sort: { total: -1 } }
      ])
    }

    const breakdowns = {
      day: {
        modes: await modesForRange(startOfDay, new Date(startOfDay.getTime() + 24*60*60*1000)),
        categories: await categoriesForRange(startOfDay, new Date(startOfDay.getTime() + 24*60*60*1000)),
        cashiers: await cashiersForRange(startOfDay, new Date(startOfDay.getTime() + 24*60*60*1000))
      },
      month: {
        modes: await modesForRange(startOfMonth, new Date(startOfMonth.getFullYear(), startOfMonth.getMonth()+1, 1)),
        categories: await categoriesForRange(startOfMonth, new Date(startOfMonth.getFullYear(), startOfMonth.getMonth()+1, 1)),
        cashiers: await cashiersForRange(startOfMonth, new Date(startOfMonth.getFullYear(), startOfMonth.getMonth()+1, 1))
      },
      year: {
        modes: await modesForRange(startOfYear, new Date(startOfYear.getFullYear()+1, 0, 1)),
        categories: await categoriesForRange(startOfYear, new Date(startOfYear.getFullYear()+1, 0, 1)),
        cashiers: await cashiersForRange(startOfYear, new Date(startOfYear.getFullYear()+1, 0, 1))
      }
    }

    // avoid caching clients returning 304 and empty bodies; ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.json({ totals: { day: dayAgg||{ total:0, orders:0 }, month: monthAgg||{ total:0, orders:0 }, year: yearAgg||{ total:0, orders:0 } }, series: { last7days: daySeries, last12months: monthSeries }, breakdowns })
  }catch(err){ next(err) }
}

// Export orders as CSV. Query: ?start=ISODate&end=ISODate
exports.exportCsv = async (req, res, next) => {
  try{
    const { start, end } = req.query
    const match = {}
    if (start && end) match.createdAt = { $gte: new Date(start), $lte: new Date(end) }
    const orders = await Order.find(match).populate('cashier', 'name email').sort({ createdAt: -1 }).lean()

    // CSV headers
    const headers = ['orderId','createdAt','cashierName','cashierEmail','paymentMode','paymentStatus','grandTotal','itemsCount','itemsSummary']
    const lines = [headers.join(',')]

    for (const o of orders){
      const itemsCount = (o.items||[]).reduce((s,i)=>s + (i.quantity||0), 0)
      const itemsSummary = (o.items||[]).map(i=> `${(i.name||'item')} x${i.quantity||0}`).join(' | ')
      const row = [
        `"${o._id}"`,
        `"${o.createdAt.toISOString()}"`,
        `"${(o.cashier?.name||'') }"`,
        `"${(o.cashier?.email||'') }"`,
        `"${o.paymentMode||''}"`,
        `"${o.paymentStatus||''}"`,
        `${(o.grandTotal||0).toFixed(2)}`,
        `${itemsCount}`,
        `"${itemsSummary.replace(/"/g,'""')}"`
      ]
      lines.push(row.join(','))
    }

    const csv = lines.join('\n')
    res.setHeader('Content-Type', 'text/csv')
    const fname = `orders_report_${Date.now()}.csv`
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`)
    res.send(csv)
  }catch(err){ next(err) }
}

