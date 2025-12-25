const jwt = require('jsonwebtoken')

exports.protect = (req,res,next)=>{
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: 'Unauthorized' })
  const token = auth.split(' ')[1]
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme')
    req.user = decoded
    next()
  }catch(err){ res.status(401).json({ message: 'Invalid token' }) }
}

exports.authorize = (...roles)=> (req,res,next)=>{
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' })
  next()
}
