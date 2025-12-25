import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { Bar } from 'react-chartjs-2'
import 'chart.js/auto'

import { useSelector } from 'react-redux'

export default function Dashboard(){
  const [analytics,setAnalytics]=useState(null)
  const user = useSelector(s => s.auth.user)

  useEffect(()=>{ if (!user || user.role !== 'admin') return; fetchAnalytics() },[user])
  async function fetchAnalytics(){ try{ const res = await api.get('/reports/analytics'); setAnalytics(res.data) }catch(err){ console.error(err); setAnalytics({ error: err.response?.data?.message || err.message }) } }

  if (!user) return <div style={{padding:20}}>Please login to view this page</div>
  if (user.role !== 'admin') return <div style={{padding:20}}>Forbidden — admin only</div>
  if (!analytics) return <div style={{padding:20}}>Loading...</div>
  if (analytics.error) return <div style={{padding:20}}>Not authorized to view analytics (admin only)</div>

  const last7 = analytics.series.last7days
  const barData = { labels: ['6d','5d','4d','3d','2d','1d','Today'], datasets:[{ label:'Sales', data:last7, backgroundColor:'#6c5ce7' }] }

  const slides = [
    { title: 'Today', value: `$${(analytics.totals.day.total||0).toFixed(2)}`, sub: `${analytics.totals.day.orders||0} orders` },
    { title: 'This Month', value: `$${(analytics.totals.month.total||0).toFixed(2)}`, sub: `${analytics.totals.month.orders||0} orders` },
    { title: 'This Year', value: `$${(analytics.totals.year.total||0).toFixed(2)}`, sub: `${analytics.totals.year.orders||0} orders` },
  ]

  const [idx,setIdx] = useState(0)
  useEffect(()=>{ const t = setInterval(()=>setIdx(i=> (i+1) % slides.length),4000); return ()=>clearInterval(t) },[slides.length])

  return (
    <div style={{padding:20}}>
      <h2>Admin Dashboard</h2>
      <p className="muted">Overview of sales and orders. Use the Admin Products and Admin Users pages to manage the store.</p>

      <div className="slider">
        <button className="slider-btn" onClick={()=>setIdx(i=> (i-1+slides.length)%slides.length)}>&lt;</button>
        {slides.map((s,i)=> (
          <div key={s.title} className={`slide ${i===idx? 'active':''}`}>
            <div className="slide-title">{s.title}</div>
            <div className="slide-value">{s.value}</div>
            <div className="slide-sub muted">{s.sub}</div>
          </div>
        ))}
        <button className="slider-btn" onClick={()=>setIdx(i=> (i+1)%slides.length)}>&gt;</button>
      </div>

      <div style={{marginTop:20,background:'white',padding:12,borderRadius:8}}>
        <h4>Sales (last 7 days)</h4>
        <Bar data={barData} />
      </div>

    </div>
  )
}
