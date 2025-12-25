import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { useSelector } from 'react-redux'

export default function AdminUsers(){
  const [users,setUsers]=useState([])
  const [loading,setLoading]=useState(false)
  const user = useSelector(s => s.auth.user)

  useEffect(()=>{ if (!user || user.role !== 'admin') return; fetchUsers() },[user])
  async function fetchUsers(){ try{ const res = await api.get('/admin/users'); setUsers(res.data) }catch(e){ console.error(e); alert('Failed to fetch users') } }

  async function setRole(id, role){
    if(!confirm('Change role?')) return
    setLoading(true)
    try{ await api.post('/admin/users/'+id+'/role', { role }); fetchUsers() }catch(e){ console.error(e); alert('Role update failed') }finally{ setLoading(false) }
  }

  if (!user) return <div style={{padding:20}}>Please login to view this page</div>
  if (user.role !== 'admin') return <div style={{padding:20}}>Forbidden — admin access only</div>

  return (
    <div style={{padding:20}}>
      <h2>Admin - Users</h2>
      <p className="muted">View registered users and change roles (promote to admin or demote to cashier).</p>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}