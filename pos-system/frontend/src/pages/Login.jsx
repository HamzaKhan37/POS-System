import React, { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { login, initializeAuth } from '../redux/authSlice'
import api from '../services/api'

export default function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const dispatch = useDispatch()
  const googleButtonRef = useRef()

  async function onSubmit(e){
    e.preventDefault();
    const action = await dispatch(login({ email, password }));
    // login may be rejected; check result
    if (action.error) {
      const payload = action.payload || action.error
      alert(payload.message || action.error.message || 'Login failed')
      return
    }
    const user = action.payload?.user
    if (user && user.role === 'admin') window.location.href = '/dashboard'
    else window.location.href = '/pos'
  }

  useEffect(()=>{
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    // load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && window.google.accounts && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (res) => {
            try{
              const idToken = res.credential
              const r = await api.post('/auth/google', { idToken })
              if (r.data && r.data.token) localStorage.setItem('token', r.data.token)
              // refresh auth
              await dispatch(initializeAuth())
              // fetch profile to check role and redirect
              const profile = await api.get('/auth/me')
              const user = profile.data
              if (user && user.role === 'admin') window.location.href = '/dashboard'
              else window.location.href = '/pos'
            }catch(err){ console.error('Google sign-in failed', err); alert('Google sign-in failed') }
          }
        })
        window.google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large' })
      }
    }
    document.body.appendChild(script)
    return ()=>{ document.body.removeChild(script) }
  },[])

  return (
    <div className="auth-card">
      <h2>Welcome back</h2>
      <form onSubmit={onSubmit} className="auth-form">
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button type="submit" className="btn-primary">Login</button>
          {import.meta.env.VITE_ENABLE_DEMO === 'true' && (
            <button type="button" className="btn-ghost" onClick={()=>{ setEmail('admin@pos.test'); setPassword('adminpass'); }} title="Fill demo admin credentials">Use demo admin</button>
          )}
        </div>
        <div className="muted" style={{marginTop:8}}>Admin users are redirected to the Dashboard after login.</div> 
      </form>
      <div style={{marginTop:12}}>
        <div ref={googleButtonRef}></div>
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && <div className="muted">Google Sign-In not configured</div>}
      </div>
      <p className="muted">New here? <a href="/signup">Create account</a></p>
    </div>
  )
}
