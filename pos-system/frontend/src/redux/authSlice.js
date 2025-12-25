import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../services/api'

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', creds)
    if (res.data && res.data.token) localStorage.setItem('token', res.data.token)
    // If server returned user, use it (avoids extra request)
    if (res.data && res.data.user) return { token: res.data.token, user: res.data.user }
    // otherwise fetch profile
    const profile = await api.get('/auth/me')
    return { token: res.data.token, user: profile.data }
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

export const initializeAuth = createAsyncThunk('auth/initialize', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return { user: null }
    // api will include token via interceptor
    const profile = await api.get('/auth/me')
    return { user: profile.data }
  } catch (err) {
    // invalid token; remove
    localStorage.removeItem('token')
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'idle' },
  reducers: {
    logout: (s)=>{ s.user=null; localStorage.removeItem('token') }
  },
  extraReducers: (b)=>{
    b.addCase(login.fulfilled,(s,a)=>{ s.user = a.payload.user || null; if (a.payload.token) localStorage.setItem('token', a.payload.token) })
    b.addCase(initializeAuth.pending, (s)=>{ s.status = 'loading' })
    b.addCase(initializeAuth.fulfilled, (s,a)=>{ s.status = 'idle'; s.user = a.payload.user || null })
    b.addCase(initializeAuth.rejected, (s,a)=>{ s.status = 'idle'; s.user = null })
  }
})
export const { logout } = authSlice.actions
export default authSlice.reducer