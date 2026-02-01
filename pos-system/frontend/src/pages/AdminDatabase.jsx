import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { useSelector } from 'react-redux'

export default function AdminDatabase(){
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const user = useSelector(s => s.auth.user)

  useEffect(()=>{ if (!user || user.role !== 'admin') return; fetchStats() },[user])

  async function fetchStats(){
    try{ const res = await api.get('/admin/db-stats'); setStats(res.data) }
    catch(e){ console.error(e) }
  }

  async function exportExcel(){
    setLoading(true)
    try{
      const res = await api.get('/admin/export-db', { responseType: 'blob' })
      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `pos-backup-${new Date().toISOString().slice(0,10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }catch(e){ console.error(e); alert('Export failed: '+e.message) }finally{ setLoading(false) }
  }

  async function deleteCollection(collection){
    if (!adminKey) return alert('Enter admin key')
    if (!confirm(`Delete all ${collection}? This cannot be undone. A backup will be created.`)) return
    setLoading(true)
    try{
      const res = await api.post('/admin/delete-collection', { collection, adminKey })
      alert(`Deleted ${res.data.deletedCount} records. Backup: ${res.data.backupUrl}`)
      setAdminKey('')
      fetchStats()
    }catch(e){ console.error(e); alert('Delete failed: '+(e.response?.data?.error||e.message)) }finally{ setLoading(false) }
  }

  if (!user) return <div style={{padding:20}}>Please login</div>
  if (user.role !== 'admin') return <div style={{padding:20}}>Admin access only</div>

  return (
    <div style={{padding:20}}>
      <h2>Admin - Database Management</h2>
      <p className="muted">View database statistics, export all data as Excel, or selectively delete collections.</p>

      {/* Database Overview */}
      <div style={{marginTop:16,marginBottom:16,padding:12,background:'white',borderRadius:8}}>
        <h3>Database Overview</h3>
        {stats ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:12}}>
            <div style={{padding:12,background:'#f5f5f5',borderRadius:6}}>
              <div className='muted'>Products</div>
              <div style={{fontSize:24,fontWeight:'bold'}}>{stats.products}</div>
            </div>
            <div style={{padding:12,background:'#f5f5f5',borderRadius:6}}>
              <div className='muted'>Orders</div>
              <div style={{fontSize:24,fontWeight:'bold'}}>{stats.orders}</div>
            </div>
            <div style={{padding:12,background:'#f5f5f5',borderRadius:6}}>
              <div className='muted'>Users</div>
              <div style={{fontSize:24,fontWeight:'bold'}}>{stats.users}</div>
            </div>
            <div style={{padding:12,background:'#f5f5f5',borderRadius:6}}>
              <div className='muted'>Categories</div>
              <div style={{fontSize:24,fontWeight:'bold'}}>{stats.categories}</div>
            </div>
            <div style={{padding:12,background:'#f5f5f5',borderRadius:6}}>
              <div className='muted'>Total Revenue</div>
              <div style={{fontSize:24,fontWeight:'bold'}}>₹{stats.totalRevenue}</div>
            </div>
          </div>
        ) : (
          <div className='muted'>Loading...</div>
        )}
      </div>

      {/* Export */}
      <div style={{marginTop:16,marginBottom:16,padding:12,background:'white',borderRadius:8}}>
        <h3>Export Database</h3>
        <p className='muted'>Download all data (products, orders, users, categories) as a single Excel file with multiple sheets.</p>
        <button className='btn-primary' onClick={exportExcel} disabled={loading}>{loading ? 'Exporting...' : 'Export to Excel'}</button>
      </div>

      {/* Selective Delete */}
      <div style={{marginTop:16,marginBottom:16,padding:12,background:'white',borderRadius:8}}>
        <h3>Delete Collections</h3>
        <p className='muted'>Selectively delete specific collections (with automatic backup). Requires admin key.</p>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
          <input placeholder='Admin key' type='password' value={adminKey} onChange={e=>setAdminKey(e.target.value)} style={{padding:8,flex:1}} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8}}>
          <button className='btn-ghost' onClick={()=>deleteCollection('products')} disabled={loading}>Delete Products</button>
          <button className='btn-ghost' onClick={()=>deleteCollection('orders')} disabled={loading}>Delete Orders</button>
          <button className='btn-ghost' onClick={()=>deleteCollection('categories')} disabled={loading}>Delete Categories</button>
          <button className='btn-ghost' onClick={()=>deleteCollection('users')} disabled={loading}>Delete Other Users</button>
        </div>
        <div className='muted' style={{marginTop:8,fontSize:12}}>⚠️ Deletions are permanent but backed up. Backup files are saved in /uploads.</div>
      </div>
    </div>
  )
}
