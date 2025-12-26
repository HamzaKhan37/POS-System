(async ()=>{
  const axios = require('axios')
  const base = process.env.API_BASE || 'http://localhost:5000/api'
  try{
    const loginRes = await axios.post(`${base}/auth/login`, { email: 'admin@pos.test', password: 'adminpass' })
    console.log('Login response keys:', Object.keys(loginRes.data))
    console.log('User:', loginRes.data.user)
    const token = loginRes.data.token
    console.log('Token length:', token ? token.length : 'no token')
    if(!token) { console.error('No token returned'); process.exit(1) }
    // confirm /auth/me returns the same user
    const me = await axios.get(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
    console.log('/auth/me =>', me.data)
    const res = await axios.get(`${base}/reports/analytics`, { headers: { Authorization: `Bearer ${token}` } })
    console.log('Analytics:', JSON.stringify(res.data, null, 2))
  }catch(err){ console.error('Error:', err.response ? err.response.data : err.message) }
  process.exit(0)
})()
