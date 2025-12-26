import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../services/api'

export default function AdminCategories(){
  const [cats,setCats] = useState([])
  const [name,setName] = useState('')
  const [editing,setEditing] = useState(null)
  const [editName,setEditName] = useState('')
  const user = useSelector(s => s.auth.user)

  useEffect(()=>{ if (!user || user.role !== 'admin') return; fetchCats() },[user])
  async function fetchCats(){ try{ const res = await api.get('/categories'); setCats(res.data) }catch(e){ console.error(e) } }

  async function createCat(e){ e.preventDefault(); try{ const res = await api.post('/categories', { name }); setCats(prev=>[res.data,...prev]); setName(''); }catch(err){ alert('Create failed: '+(err.response?.data?.message||err.message)) } }

  async function deleteCat(id){ if(!confirm('Delete category?')) return; try{ await api.delete('/categories/'+id); setCats(prev=>prev.filter(c=>c._id!==id)) }catch(e){ alert('Delete failed: '+(e.response?.data?.message||e.message)) } }

  async function startEdit(c){ setEditing(c); setEditName(c.name) }
  async function saveEdit(e){ e.preventDefault(); try{ const res = await api.put('/categories/'+editing._id, { name: editName }); setCats(prev=>prev.map(c=> c._id===res.data._id ? res.data : c)); setEditing(null); setEditName('') }catch(err){ alert('Update failed: '+(err.response?.data?.message||err.message)) } }

  if (!user) return <div style={{padding:20}}>Please login to view this page</div>
  if (user.role !== 'admin') return <div style={{padding:20}}>Forbidden — admin access only</div>

  return (
    <div style={{padding:20}}>
      <h2>Admin - Categories</h2>
      <p className="muted">Create, edit, and remove categories used to classify products.</p>

      <form onSubmit={createCat} style={{display:'flex',gap:8,maxWidth:600}}>
        <input placeholder='Category name' value={name} onChange={e=>setName(e.target.value)} required />
        <button className='btn-primary' type='submit'>Create</button>
      </form>

      <div style={{marginTop:20}}>
        <h3>Existing Categories</h3>
        <div style={{display:'grid',gap:10,maxWidth:600}}>
          {cats.map(c=> (
            <div key={c._id} style={{display:'flex',alignItems:'center',gap:8,background:'white',padding:10,borderRadius:8}}>
              <div style={{flex:1}}><b>{c.name}</b></div>
              <button className='btn-ghost' onClick={()=>startEdit(c)}>Edit</button>
              <button className='qty-btn' onClick={()=>deleteCat(c._id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60}}>
          <div style={{width:440,background:'white',padding:18,borderRadius:8}}>
            <h3>Edit Category</h3>
            <form onSubmit={saveEdit} style={{display:'grid',gap:8}}>
              <input value={editName} onChange={e=>setEditName(e.target.value)} required />
              <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                <button type='button' className='btn-ghost' onClick={()=>{ setEditing(null); setEditName('') }}>Cancel</button>
                <button className='btn-primary' type='submit'>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
