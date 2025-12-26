import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function AdminProducts(){
  const [products,setProducts]=useState([])
  const [cats,setCats]=useState([])
  const [selectedFile,setSelectedFile] = useState(null)
  const [preview,setPreview] = useState(null)
  const [form,setForm]=useState({ name:'', price:0, stock:10, category:'', imageUrl:'', description:'', taxPercent:0 })
  const [editing,setEditing] = useState(null)
  const [editForm,setEditForm] = useState(null)
  const [editSelectedFile,setEditSelectedFile] = useState(null)
  const [editPreview,setEditPreview] = useState(null)
  const user = useSelector(s => s.auth.user)

  useEffect(()=>{ if (!user || user.role !== 'admin') return; fetchAll() },[user])
  async function fetchAll(){ const [p,c] = await Promise.all([api.get('/products'), api.get('/categories')]); setProducts(p.data); setCats(c.data) }

  async function uploadFile(file){
    const fd = new FormData(); fd.append('image', file)
    const res = await api.post('/products/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data.url
  }

  async function submit(e){
    e.preventDefault();
    try{
      const toSend = { ...form }
      if (selectedFile) {
        const url = await uploadFile(selectedFile)
        toSend.imageUrl = url
      }
      const res = await api.post('/products', toSend)
      setProducts(prev=>[res.data,...prev])
      setForm({ name:'', price:0, stock:10, category:'', imageUrl:'', description:'', taxPercent:0 })
      setSelectedFile(null); setPreview(null)
      alert('Created')
    }catch(err){ alert('Create failed: '+(err.response?.data?.message||err.message)) }
  }

  async function remove(id){ if(!confirm('Delete product?')) return; await api.delete('/products/'+id); setProducts(prev=>prev.filter(x=>x._id!==id)) }

  if (!user) return <div style={{padding:20}}>Please login to view this page</div>
  if (user.role !== 'admin') return <div style={{padding:20}}>Forbidden — admin access only</div>

  return (
    <div style={{padding:20}}>
      <h2>Admin - Products</h2>
      <p className="muted">Create and manage products — add new items, set prices, stock, and remove outdated products.</p>
      <form onSubmit={submit} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,maxWidth:820}}>
        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Name</label>
          <input placeholder='Product name' value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        </div>

        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Category <Link to='/admin/categories' style={{fontSize:12,marginLeft:8}}>Manage categories</Link></label>
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} required style={{width:'100%'}}>
            <option value=''>Choose category</option>
            {cats.map(c=>(<option key={c._id} value={c._id}>{c.name}</option>))}
          </select>
        </div>

        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Price (INR)</label>
          <input type='number' min='0' step='0.01' placeholder='0.00' value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})} />
        </div>

        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Stock</label>
          <input type='number' min='0' step='1' placeholder='0' value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})} />
        </div>

        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Tax %</label>
          <input type='number' min='0' step='0.1' placeholder='0' value={form.taxPercent} onChange={e=>setForm({...form,taxPercent:Number(e.target.value)})} />
        </div>

        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Image URL (optional)</label>
          <input placeholder='https://example.com/image.jpg' value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})} />
        </div>

        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Or upload image</label>
          <div>
            <input type='file' accept='image/*' onChange={e=>{ const f = e.target.files[0]; setSelectedFile(f); setPreview(f ? URL.createObjectURL(f) : null) }} />
            {preview && (<div style={{marginTop:8}}><img src={preview} alt='preview' style={{height:64,objectFit:'cover',borderRadius:6}} /></div>)}
          </div>
        </div>

        <div style={{gridColumn:'1 / -1'}}>
          <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Description</label>
          <textarea placeholder='Short description shown on product cards' value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{width:'100%',minHeight:84}} />
        </div>

        <div style={{gridColumn:'1 / -1',display:'flex',justifyContent:'flex-end'}}>
          <button className='btn-primary' type='submit'>Create</button>
        </div>
      </form>

      <h3 style={{marginTop:20}}>Existing Products</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14}}>
        {products.map(p=> (
          <div key={p._id} style={{background:'white',padding:12,borderRadius:10,boxShadow:'0 8px 20px rgba(0,0,0,0.04)'}}>
            <div style={{height:140,overflow:'hidden',borderRadius:8}}>
              <img src={p.imageUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23888" font-family="Arial" font-size="24">No Image</text></svg>'} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
            </div>
            <h4 style={{marginTop:10,marginBottom:6}}>{p.name}</h4>
            <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:8}}>
              <div style={{background:'#eef6f5',color:'#12706b',padding:'6px 8px',borderRadius:6,fontWeight:700}}>₹{(p.price||0).toFixed(2)}</div>
              <div style={{background:'#f3f4f6',color:'#333',padding:'6px 8px',borderRadius:6}}>Stock: {p.stock||0}</div>
              <div style={{marginLeft:'auto',color:'#666'}}>Tax: {p.taxPercent||0}%</div>
            </div>
            <div className='muted' style={{minHeight:36}}>{p.description || 'No description provided. Add a helpful description for customers.'}</div>
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button onClick={()=>remove(p._id)} className='qty-btn'>Delete</button>
              <button onClick={()=>{ setEditing(p); setEditForm({ name: p.name, price: p.price || 0, stock: p.stock || 0, category: p.category || '', imageUrl: p.imageUrl || '', description: p.description || '', taxPercent: p.taxPercent || 0 }); setEditPreview(p.imageUrl || null); setEditSelectedFile(null) }} className='btn-ghost'>Edit</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60}}>
          <div style={{width:760,maxWidth:'95%',background:'white',padding:18,borderRadius:8}}>
            <h3>Edit product</h3>
            <form onSubmit={async (e)=>{
              e.preventDefault()
              try{
                const toSend = { ...editForm }
                if (editSelectedFile){ const url = await uploadFile(editSelectedFile); toSend.imageUrl = url }
                const res = await api.put('/products/'+editing._id, toSend)
                setProducts(prev=>prev.map(x=> x._id===editing._id ? res.data : x))
                setEditing(null); setEditForm(null); setEditSelectedFile(null); setEditPreview(null)
                alert('Updated')
              }catch(err){ alert('Update failed: '+(err.response?.data?.message||err.message)) }
            }} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

              <div>
                <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Name</label>
                <input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} required />
              </div>

              <div>
                <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Category</label>
                <select value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})} style={{width:'100%'}}>
                  <option value=''>Choose category</option>
                  {cats.map(c=>(<option key={c._id} value={c._id}>{c.name}</option>))}
                </select>
              </div>

              <div>
                <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Price (INR)</label>
                <input type='number' min='0' step='0.01' value={editForm.price} onChange={e=>setEditForm({...editForm,price:Number(e.target.value)})} />
              </div>

              <div>
                <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Stock</label>
                <input type='number' min='0' step='1' value={editForm.stock} onChange={e=>setEditForm({...editForm,stock:Number(e.target.value)})} />
              </div>

              <div>
                <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Tax %</label>
                <input type='number' min='0' step='0.1' value={editForm.taxPercent} onChange={e=>setEditForm({...editForm,taxPercent:Number(e.target.value)})} />
              </div>

              <div>
                <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Image URL</label>
                <input value={editForm.imageUrl} onChange={e=>setEditForm({...editForm,imageUrl:e.target.value})} />
              </div>

              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Or upload image</label>
                <div>
                  <input type='file' accept='image/*' onChange={e=>{ const f = e.target.files[0]; setEditSelectedFile(f); setEditPreview(f ? URL.createObjectURL(f) : null) }} />
                  {editPreview && (<div style={{marginTop:8}}><img src={editPreview} alt='preview' style={{height:64,objectFit:'cover',borderRadius:6}} /></div>)}
                </div>
              </div>

              <div style={{gridColumn:'1 / -1'}}>
                <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Description</label>
                <textarea value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})} style={{width:'100%',minHeight:84}} />
              </div>

              <div style={{gridColumn:'1 / -1',display:'flex',justifyContent:'flex-end',gap:8}}>
                <button type='button' className='btn-ghost' onClick={()=>{ setEditing(null); setEditForm(null); setEditPreview(null); setEditSelectedFile(null) }}>Cancel</button>
                <button className='btn-primary' type='submit'>Save</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}