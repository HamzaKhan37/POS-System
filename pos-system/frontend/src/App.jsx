import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Login from './pages/Login'
import Signup from './pages/Signup'
import POS from './pages/POS'
import Dashboard from './pages/Dashboard'
import AdminProducts from './pages/AdminProducts'
import AdminCategories from './pages/AdminCategories'
import AdminUsers from './pages/AdminUsers'
import { logout, initializeAuth } from './redux/authSlice'

export default function App(){
  const user = useSelector(s=>s.auth.user)
  const dispatch = useDispatch()

  // initialize auth on app load (hydrate user from token)
  React.useEffect(()=>{ dispatch(initializeAuth()) }, [])

  return (
    <BrowserRouter>
      <header className="header">
        <div className="header-left">
          <div className="logo">POS <span className="logo-muted">System</span></div>
          <nav className="nav-links">
            <Link to="/">Login</Link>
            <Link to="/signup">Signup</Link>
            <Link to="/pos">POS</Link>
            <Link to="/dashboard">Dashboard</Link>
            {user && user.role === 'admin' && (
              <>
                <Link to="/admin/products">Products</Link>
                <Link to="/admin/categories">Categories</Link>
                <Link to="/admin/users">Users</Link>
              </>
            )}
          </nav>
        </div>
        <div className="header-right">
          {user ? (<span style={{display:'flex',alignItems:'center',gap:8}}>
            <b>{user.name}</b> <button className="btn-ghost" onClick={()=>{ dispatch(logout()); window.location.href='/' }}>Logout</button>
          </span>) : <span className="muted">Not signed in</span>}
        </div>
      </header>

      <Routes>
        <Route path='/' element={<Login/>} />
        <Route path='/signup' element={<Signup/>} />
        <Route path='/pos' element={<POS/>} />
        <Route path='/dashboard' element={<Dashboard/>} />
        <Route path='/admin/products' element={<AdminProducts/>} />
        <Route path='/admin/categories' element={<AdminCategories/>} />
        <Route path='/admin/users' element={<AdminUsers/>} />
      </Routes>
    </BrowserRouter>
  )
}
