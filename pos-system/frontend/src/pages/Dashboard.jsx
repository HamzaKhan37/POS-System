import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { Bar, Pie } from 'react-chartjs-2'
import 'chart.js/auto'

import { useSelector, useDispatch } from 'react-redux'
import { initializeAuth } from '../redux/authSlice'

export default function Dashboard(){
  const [analytics,setAnalytics]=useState(null)
  const user = useSelector(s => s.auth.user)
  const dispatch = useDispatch()

  const [lastUpdated,setLastUpdated] = useState(null)
  const [debugRaw,setDebugRaw] = useState(null)
  const [idx,setIdx] = useState(0)

  useEffect(()=>{
    if (!analytics) { setIdx(0); return }
    const t = setInterval(()=> setIdx(i => (i+1) % 3), 4000)
    return ()=> clearInterval(t)
  },[analytics])

  useEffect(()=>{ if (!user || user.role !== 'admin') return; fetchAnalytics() },[user])

  async function fetchAnalytics(retry=true){ 
    try{
      const res = await api.get('/reports/analytics', { params: { _t: Date.now() } })
      // if server unexpectedly returned no body (e.g., 304), surface an error
      if (!res.data || Object.keys(res.data).length === 0) {
        setAnalytics({ error: 'No analytics data returned. Try "Retry" or re-login.' })
        setDebugRaw({ note: 'empty response', status: res.status, body: res.data })
        return
      }
      console.log('analytics:', res.data)
      setAnalytics(res.data)
      setLastUpdated(new Date())
      setDebugRaw(null)
    }catch(err){ 
      console.error('analytics error', err)
      const info = { message: err.message, status: err.response?.status, body: err.response?.data }
      setAnalytics({ error: info })
      setDebugRaw(info)
      // try to recover once: if unauthorized, re-init auth then retry; otherwise retry after short delay
      if (retry){
        if (err.response?.status === 401){
          await dispatch(initializeAuth())
          setTimeout(()=>fetchAnalytics(false), 300)
        } else {
          setTimeout(()=>fetchAnalytics(false), 600)
        }
      }
    }
  }

  async function debugFetch(){
    try{
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: 'Bearer '+token } : {}
      const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/reports/analytics?_t=' + Date.now()
      const r = await fetch(url, { headers })
      const text = await r.text()
      let parsed
      try{ parsed = JSON.parse(text) }catch(e){ parsed = text }
      setDebugRaw({ status: r.status, body: parsed })
      if (r.ok && typeof parsed === 'object') { setAnalytics(parsed); setLastUpdated(new Date()) }
    }catch(e){ console.error(e); setDebugRaw({ error: String(e) }) }
  }

  async function downloadReport(){
    try{
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: 'Bearer '+token } : {}
      const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/reports/export'
      const r = await fetch(url, { headers })
      if (!r.ok){ const text = await r.text(); setDebugRaw({ status: r.status, body: text }); return }
      const blob = await r.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = `orders_report_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objUrl)
    }catch(e){ console.error(e); setDebugRaw({ error: String(e) }) }
  }

  if (!user) return <div style={{padding:20}}>Please login to view this page</div>
  if (user.role !== 'admin') return <div style={{padding:20}}>Forbidden — admin only</div>
  if (!analytics) return <div style={{padding:20}}>Loading...</div>
  if (analytics.error) return (
    <div style={{padding:20}}>
      <div style={{marginBottom:8}}>Error loading analytics: {analytics.error.message || analytics.error}</div>
      {analytics.error.status && <div style={{marginBottom:8}}>Status: {analytics.error.status}</div>}
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <button className='btn-primary' onClick={fetchAnalytics}>Retry</button>
        <button className='btn-ghost' onClick={() => { dispatch(initializeAuth()) ; setTimeout(fetchAnalytics, 400) }}>Re-init Auth</button>
        <button className='btn-ghost' onClick={debugFetch}>Debug Fetch</button>
      </div>
      {debugRaw && (<pre style={{whiteSpace:'pre-wrap',background:'#f7f7f7',padding:12,borderRadius:8}}>{JSON.stringify(debugRaw,null,2)}</pre>)}
    </div>
  )

  const last7 = (analytics.series && analytics.series.last7days) ? analytics.series.last7days : [0,0,0,0,0,0,0]
  const safeLast7 = last7.map(n => Number(n) || 0)
  const barData = { labels: ['6d','5d','4d','3d','2d','1d','Today'], datasets:[{ label:'Sales', data:safeLast7, backgroundColor:'#6c5ce7' }] }

  const slides = [
    { title: 'Today', value: `₹${(analytics.totals?.day?.total||0).toFixed(2)}`, sub: `${analytics.totals?.day?.orders||0} orders` },
    { title: 'This Month', value: `₹${(analytics.totals?.month?.total||0).toFixed(2)}`, sub: `${analytics.totals?.month?.orders||0} orders` },
    { title: 'This Year', value: `₹${(analytics.totals?.year?.total||0).toFixed(2)}`, sub: `${analytics.totals?.year?.orders||0} orders` },
  ]

  // slide state and interval moved up to keep hooks order consistent

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

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:12,marginTop:20}}>
        <div style={{background:'white',padding:12,borderRadius:8,minHeight:160}}>
          <h4 style={{marginTop:0}}>Sales (last 7 days)</h4>
          <div style={{height:150}}><Bar data={barData} options={{ maintainAspectRatio:false }} /></div>
        </div>

        <div style={{display:'grid',gap:12}}>
          <div style={{background:'white',padding:12,borderRadius:8}}>
            <h4 style={{marginTop:0}}>Categories (This Month)</h4>
            { (analytics.breakdowns?.month?.categories || []).length === 0 ? <div className='muted'>No data</div> : (
              <div style={{height:140}}>
                <Pie data={{ labels: analytics.breakdowns.month.categories.map(c=>c.category||'Uncategorized'), datasets:[{ data: analytics.breakdowns.month.categories.map(c=>Number(c.revenue||0)), backgroundColor: ['#1abc9c','#3498db','#9b59b6','#f1c40f','#e67e22','#e74c3c'] }] }} options={{ maintainAspectRatio:false }} />
              </div>
            )}
          </div>

          <div style={{background:'white',padding:12,borderRadius:8}}>
            <h4 style={{marginTop:0}}>Payment Modes (Today)</h4>
            {(analytics.breakdowns?.day?.modes || []).length === 0 ? <div className='muted'>No data</div> : (
              <ul>
                {analytics.breakdowns.day.modes.map(m=> (
                  <li key={m.mode}><b>{m.mode}</b> — ₹{Number(m.total||0).toFixed(2)} ({m.orders} orders)</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:12,alignItems:'center',marginTop:12}}>
        <div style={{color:'#555',fontSize:13}}>Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '—'}</div>
        <button className='btn-primary' onClick={fetchAnalytics}>Refresh</button>
        <button className='btn-ghost' onClick={debugFetch}>Debug Fetch</button>
        <button className='btn-outline' onClick={downloadReport}>Download report (CSV)</button>
      </div>

      {debugRaw && (<pre style={{marginTop:12,whiteSpace:'pre-wrap',background:'#f7f7f7',padding:12,borderRadius:8}}>{JSON.stringify(debugRaw,null,2)}</pre>)}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginTop:18}}>
        <div style={{background:'white',padding:12,borderRadius:8}}>
          <h4 style={{marginTop:0}}>Payment Modes (Today)</h4>
          {(analytics.breakdowns?.day?.modes || []).length === 0 ? <div className='muted'>No data</div> : (
            <ul>
              {analytics.breakdowns.day.modes.map(m=> (
                <li key={m.mode}><b>{m.mode}</b> — ₹{Number(m.total||0).toFixed(2)} ({m.orders} orders)</li>
              ))}
            </ul>
          )}
        </div>

        <div style={{background:'white',padding:12,borderRadius:8}}>
          <h4 style={{marginTop:0}}>Top Categories (This Month)</h4>
          {(analytics.breakdowns?.month?.categories || []).length === 0 ? <div className='muted'>No data</div> : (
            <ol>
              {analytics.breakdowns.month.categories.slice(0,6).map(c=> (
                <li key={c.category}>{c.category || 'Uncategorized'} — ₹{Number(c.revenue||0).toFixed(2)} ({c.itemsSold} items)</li>
              ))}
            </ol>
          )}
        </div>

        <div style={{background:'white',padding:12,borderRadius:8}}>
          <h4 style={{marginTop:0}}>Top Cashiers (This Year)</h4>
          {(analytics.breakdowns?.year?.cashiers || []).length === 0 ? <div className='muted'>No data</div> : (
            <ol>
              {analytics.breakdowns.year.cashiers.slice(0,6).map(c=> (
                <li key={c.cashierId || c.email}><b>{c.name || c.email || 'Guest'}</b> — ₹{Number(c.total||0).toFixed(2)} ({c.orders} orders)</li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div style={{marginTop:12,color:'#555',fontSize:13}}>If the chart is empty, ensure the server has orders seeded and that you're logged in as an admin.</div>

    </div>
  )
}
