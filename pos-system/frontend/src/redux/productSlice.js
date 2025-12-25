import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../services/api'
export const fetchProducts = createAsyncThunk('products/fetch', async () => { const res = await api.get('/products'); return res.data })
const productSlice = createSlice({ name:'products', initialState:{ list:[]}, extraReducers:(b)=>{ b.addCase(fetchProducts.fulfilled,(s,a)=>{ s.list = a.payload }) } })
export default productSlice.reducer