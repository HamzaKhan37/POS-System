(async ()=>{
  const connectDB = require('../config/db')
  const User = require('../models/User')
  await connectDB()
  const u = await User.findOneAndUpdate({ email: 'admin@pos.test' }, { $set: { role: 'admin' } }, { new: true })
  if (!u) console.log('No user with that email')
  else console.log('Promoted user:', { id: u._id.toString(), email: u.email, role: u.role })
  process.exit(0)
})().catch(e=>{ console.error(e); process.exit(1) })