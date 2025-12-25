const { seedData } = require('../scripts/seeder')
const User = require('../models/User')

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

exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const { role } = req.body
    if (!['admin','cashier','user'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    user.role = role
    await user.save()
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) { next(err) }
}