import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../services/api'

export default function SeedButton(){
  const [loading,setLoading]=useState(false)
  const user = useSelector(s=>s.auth.user)

  async function run(){
    if (!user || user.role !== 'admin') return alert('Forbidden: only admins can seed demo data. Login as admin (admin@pos.test) or ask an admin to run it.')
    setLoading(true)
    try{
      await api.post('/admin/seed')
      alert('Seeded demo data')
      window.location.reload()
    }catch(err){
      console.error(err)
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Seed failed'
      alert(msg)
    }finally{ setLoading(false) }
  }

  const disabled = loading || !user || user.role !== 'admin'
  const label = loading ? 'Seeding...' : (user && user.role === 'admin' ? 'Load demo products' : 'Load demo products (admin only)')

  return <button onClick={run} disabled={disabled} className="btn-primary">{label}</button>
}