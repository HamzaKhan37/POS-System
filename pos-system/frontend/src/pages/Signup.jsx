import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import api from '../services/api'
import { login } from '../redux/authSlice'

export default function Signup(){
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [isAdmin,setIsAdmin]=useState(false)
  const [adminKey,setAdminKey]=useState('')
  const dispatch = useDispatch()

  async function onSubmit(e){
    e.preventDefault()
    try{
      if (isAdmin) {
        // register admin using privileged endpoint
        const res = await api.post('/auth/register-admin', { name, email, password, adminKey })
        if (res.data && res.data.token) {
          localStorage.setItem('token', res.data.token)
          await dispatch(login({ email, password }))
          window.location.href = '/dashboard'
        }
      } else {
        const res = await api.post('/auth/register-public', { name, email, password })
        if (res.data && res.data.token) {
          localStorage.setItem('token', res.data.token)
          await dispatch(login({ email, password }))
          window.location.href = '/pos'
        } else {
          await dispatch(login({ email, password }))
          window.location.href = '/pos'
        }
      }
    }catch(err){ console.error(err); alert(err.response?.data?.message || 'Signup failed') }
  }

  return (
    <div className="auth-card">
      <h2>Create account</h2>
      <form onSubmit={onSubmit} className="auth-form">
        <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} type="password" required />

        <label style={{display:'flex',alignItems:'center',gap:8}}>
          <input type="checkbox" checked={isAdmin} onChange={e=>setIsAdmin(e.target.checked)} />
          <span>Register as admin</span>
        </label>
        {isAdmin && (
          <>
            <input placeholder="Admin key" value={adminKey} onChange={e=>setAdminKey(e.target.value)} required />
            <div className="muted">You need a valid admin key to register as an admin.</div>
          </>
        )}

        <button type="submit" className="btn-primary">Sign up</button>
      </form>
      <p className="muted">Already have an account? <a href="/">Login</a></p>
    </div>
  )
}