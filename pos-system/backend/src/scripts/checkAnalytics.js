(async ()=>{
  const connectDB = require('../config/db')
  const Order = require('../models/Order')
  await connectDB()
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [dayAgg] = await Order.aggregate([{ $match: { createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }])
  const [monthAgg] = await Order.aggregate([{ $match: { createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }])
  const [yearAgg] = await Order.aggregate([{ $match: { createdAt: { $gte: startOfYear } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }])

  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const next = new Date(d); next.setDate(d.getDate() + 1)
    days.push({ start: d, end: next })
  }
  const daySeries = await Promise.all(days.map(async (r) => {
    const [a] = await Order.aggregate([{ $match: { createdAt: { $gte: r.start, $lt: r.end } } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }])
    return a ? a.total : 0
  }))

  const months = []
  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const next = new Date(m.getFullYear(), m.getMonth() + 1, 1)
    months.push({ start: m, end: next })
  }
  const monthSeries = await Promise.all(months.map(async (r) => {
    const [a] = await Order.aggregate([{ $match: { createdAt: { $gte: r.start, $lt: r.end } } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }])
    return a ? a.total : 0
  }))

  console.log(JSON.stringify({ totals: { day: dayAgg || { total: 0, orders: 0 }, month: monthAgg || { total: 0, orders: 0 }, year: yearAgg || { total: 0, orders: 0 } }, series: { last7days: daySeries, last12months: monthSeries } }, null, 2))
  process.exit(0)
})().catch(e=>{ console.error(e); process.exit(1) })
