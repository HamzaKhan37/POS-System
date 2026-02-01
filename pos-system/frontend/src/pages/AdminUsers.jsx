import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { useSelector } from 'react-redux'

export default function AdminUsers(){
  const [users,setUsers]=useState([])
  const [loading,setLoading]=useState(false)
  const [qrFile, setQrFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const [pendingOrders, setPendingOrders] = useState([])
  const [showPayments, setShowPayments] = useState(false)
  const user = useSelector(s => s.auth.user)

  useEffect(()=>{ if (!user || user.role !== 'admin') return; fetchUsers(); fetchPendingPayments() },[user])
  async function fetchUsers(){ try{ const res = await api.get('/admin/users'); setUsers(res.data) }catch(e){ console.error(e); alert('Failed to fetch users') } }
  
  async function fetchPendingPayments(){ 
    try{ const res = await api.get('/admin/pending-payments'); setPendingOrders(res.data) }
    catch(e){ console.error(e) } 
  }

  async function setRole(id, role){
    if(!confirm('Change role?')) return
    setLoading(true)
    try{ await api.post('/admin/users/'+id+'/role', { role }); fetchUsers() }catch(e){ console.error(e); alert('Role update failed: '+(e.response?.data?.error||e.response?.data?.message||e.message)) }finally{ setLoading(false) }
  }

  async function deleteUser(id){
    if(!confirm('Delete user?')) return
    setLoading(true)
    try{ await api.delete('/admin/users/'+id); fetchUsers() }catch(e){ console.error(e); alert('Delete failed: '+(e.response?.data?.error||e.response?.data?.message||e.message)) }finally{ setLoading(false) }
  }

  async function uploadQr(){
    if (!qrFile) return alert('Choose a file')
    setUploading(true)
    try{
      const fd = new FormData(); fd.append('qr', qrFile)
      const res = await api.post('/admin/phonepe-qr-upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert('Uploaded: '+(res.data.url || res.data))
      setQrFile(null)
    }catch(e){ console.error(e); alert('Upload failed: '+(e.response?.data?.error||e.message)) }finally{ setUploading(false) }
  }

  async function backupAndWipe(){
    if (!adminKey) return alert('Enter admin key')
    if (!confirm('This will backup current data to CSV and wipe data (keeps the logged-in admin). Are you sure?')) return
    setLoading(true)
    try{
      const res = await api.post('/admin/backup-wipe', { adminKey })
      const files = res.data.backups || []
      let msg = 'Backup created:\n' + files.map(f=>f.url).join('\n')
      alert(msg)
      // Offer to open first backup
      if (files.length>0) window.open((import.meta.env.VITE_API_URL || '') + files[0].url, '_blank')
    }catch(e){ console.error(e); alert('Backup/wipe failed: '+(e.response?.data?.error||e.message)) }finally{ setLoading(false) }
  }

  async function verifyPayment(orderId, txId){
    if (!txId) txId = prompt('Enter transaction ID (optional):') || ''
    setLoading(true)
    try{
      await api.post('/admin/verify-payment', { orderId, transactionId: txId })
      fetchPendingPayments()
      alert('Order marked as PAID')
    }catch(e){ console.error(e); alert('Verify failed: '+(e.response?.data?.error||e.message)) }finally{ setLoading(false) }
  }

  if (!user) return <div style={{padding:20}}>Please login to view this page</div>
  if (user.role !== 'admin') return <div style={{padding:20}}>Forbidden — admin access only</div>

  return (
    <div style={{padding:20}}>
      <h2>Admin - Users</h2>
      <p className="muted">View registered users and change roles (promote to admin or demote to cashier).</p>
      <div style={{marginTop:16,marginBottom:16,padding:12,background:'#fff',borderRadius:8}}>
        <h3>PhonePe QR (admin upload)</h3>
        <input type="file" accept="image/*" onChange={e=>setQrFile(e.target.files[0])} />
        <button className='btn-primary' onClick={uploadQr} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload QR'}</button>
        <div className='muted' style={{marginTop:8}}>Upload a PNG/JPG of your personal PhonePe QR. The POS will use this image for scans.</div>
      </div>

      <div style={{marginTop:8,marginBottom:16,padding:12,background:'#fff',borderRadius:8}}>
        <h3>Backup & Wipe</h3>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input placeholder='Admin key' value={adminKey} onChange={e=>setAdminKey(e.target.value)} style={{padding:8}} />
          <button className='btn-ghost' onClick={backupAndWipe} disabled={loading}>Backup & Wipe</button>
        </div>
        <div className='muted' style={{marginTop:8}}>This will create CSV backups for products, categories, orders and users, then delete data while keeping the currently logged-in admin.</div>
      </div>

      <div style={{marginTop:8,marginBottom:16,padding:12,background:'#fff',borderRadius:8}}>
        <h3>Payment Verification</h3>
        <button className='btn-primary' onClick={()=>{ setShowPayments(!showPayments); if(!showPayments) fetchPendingPayments() }} disabled={loading}>
          {showPayments ? 'Hide' : 'Show'} Pending Orders ({pendingOrders.length})
        </button>
        {showPayments && (
          <table style={{width:'100%',marginTop:12}}>
            <thead><tr><th>Order</th><th>Amount (₹)</th><th>Items</th><th>Cashier</th><th>Created</th><th>Action</th></tr></thead>
            <tbody>
              {pendingOrders.length === 0 ? (
                <tr><td colSpan='6' style={{textAlign:'center',padding:12}}>No pending orders</td></tr>
              ) : pendingOrders.map(o=>(
                <tr key={o._id}>
                  <td>{o._id.slice(-6)}</td>
                  <td>₹{o.grandTotal.toFixed(2)}</td>
                  <td>{o.items.length} items</td>
                  <td>{o.cashier?.name || '—'}</td>
                  <td>{new Date(o.createdAt).toLocaleString().slice(0,16)}</td>
                  <td><button className='btn-primary' onClick={()=>verifyPayment(o._id)} disabled={loading}>Verify Paid</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <table style={{width:'100%',background:'white',borderRadius:8,padding:12}}>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map(u=> (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                {u.role !== 'admin' && <button className='btn-primary' onClick={()=>setRole(u._id,'admin')} disabled={loading}>Promote to Admin</button>}
                {u.role === 'admin' && <button className='qty-btn' onClick={()=>setRole(u._id,'cashier')} disabled={loading}>Demote to Cashier</button>}
                &nbsp; <button className='qty-btn' onClick={()=>deleteUser(u._id)} disabled={loading} title='Delete user'>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}