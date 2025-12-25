import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../services/api'

export default function AdminProducts(){
  const [products,setProducts]=useState([])
  const [cats,setCats]=useState([])
  const [form,setForm]=useState({ name:'', price:0, stock:10, category:'', imageUrl:'', description:'', taxPercent:0 })
  const user = useSelector(s => s.auth.user)

  useEffect(()=>{ if (!user || user.role !== 'admin') return; fetchAll() },[user])
  async function fetchAll(){ const [p,c] = await Promise.all([api.get('/products'), api.get('/categories')]); setProducts(p.data); setCats(c.data) }

  async function submit(e){ e.preventDefault(); try{ const res = await api.post('/products', form); setProducts(prev=>[res.data,...prev]); setForm({ name:'', price:0, stock:10, category:'', imageUrl:'', description:'', taxPercent:0 }); alert('Created') }catch(err){ alert('Create failed: '+(err.response?.data?.message||err.message)) } }

  async function remove(id){ if(!confirm('Delete product?')) return; await api.delete('/products/'+id); setProducts(prev=>prev.filter(x=>x._id!==id)) }

  if (!user) return <div style={{padding:20}}>Please login to view this page</div>
  if (user.role !== 'admin') return <div style={{padding:20}}>Forbidden — admin access only</div>

  return (
    <div style={{padding:20}}>
      <h2>Admin - Products</h2>
      <p className="muted">Create and manage products — add new items, set prices, stock, and remove outdated products.</p>
      <form onSubmit={submit} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,maxWidth:800}}>
        <input placeholder='Name' value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} required>
          <option value=''>Choose category</option>
          {cats.map(c=>(<option key={c._id} value={c._id}>{c.name}</option>))}
        </select>
        <input placeholder='Price' value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})} />
        <input placeholder='Stock' value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})} />
        <input placeholder='Tax %' value={form.taxPercent} onChange={e=>setForm({...form,taxPercent:Number(e.target.value)})} />
        <input placeholder='Image URL' value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})} />
        <textarea placeholder='Description' value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <div>
          <button className='btn-primary' type='submit'>Create</button>
        </div>
      </form>

      <h3 style={{marginTop:20}}>Existing Products</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
        {products.map(p=>(
          <div key={p._id} style={{background:'white',padding:12,borderRadius:8}}>
            <img src={p.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'} alt={p.name} style={{width:'100%',height:120,objectFit:'cover',borderRadius:6}} />
            <h4>{p.name}</h4>
            <div className='muted'>{p.description}</div>
            <div style={{marginTop:8,fontWeight:700}}>${p.price.toFixed(2)}</div>
            <div style={{marginTop:8}}><button onClick={()=>remove(p._id)} className='qty-btn'>Delete</button></div>
          </div>
        ))}
      </div>
    </div>
  )
}