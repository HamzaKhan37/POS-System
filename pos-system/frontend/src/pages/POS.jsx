import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts } from '../redux/productSlice'
import { addToCart, clearCart, removeFromCart } from '../redux/cartSlice'
import api from '../services/api'
import SeedButton from '../components/SeedButton'

export default function POS(){
  const dispatch = useDispatch()
  const products = useSelector(s=>s.products.list)
  const cart = useSelector(s=>s.cart.items)
  const user = useSelector(s=>s.auth.user)
  const [qrDataUrl, setQrDataUrl] = React.useState(null)
  const [lastOrderId, setLastOrderId] = React.useState(null)

  const [query, setQuery] = React.useState('')
  useEffect(()=>{ dispatch(fetchProducts()) }, [])

  function addProductToCart(p){
    dispatch(addToCart({ product: p._id, name: p.name, price: p.price, taxPercent: p.taxPercent }))
  }

  async function checkout(){
    if (cart.length===0) return alert('Cart empty')
    // require auth and cashier/admin role to checkout
    if (!user || (user.role !== 'admin' && user.role !== 'cashier')) return alert('Only authenticated cashier or admin can complete a checkout. Please login as a cashier or admin.')
    try{
      const payload = { items: cart.map(i=>({ product: i.product, quantity: i.quantity })), paymentMode: 'CASH' }
      await api.post('/orders', payload)
      dispatch(clearCart())
      alert('Order completed')
    }catch(err){ console.error(err); alert('Checkout failed: '+(err.response?.data?.message||err.message)) }
  }

  async function payWithUPI(){
    if (cart.length===0) return alert('Cart empty')
    if (!user || (user.role !== 'admin' && user.role !== 'cashier')) return alert('Only authenticated cashier or admin can initiate a payment. Please login.')
    try {
      const payload = { items: cart.map(i=>({ product: i.product, quantity: i.quantity })), paymentMode: 'UPI' }
      const orderRes = await api.post('/orders', payload)
      const order = orderRes.data
      setLastOrderId(order._id)
      // request UPI QR from backend
      const qrRes = await api.post('/payments/phonepe/upi-qr', { amount: order.grandTotal, orderId: order._id, note: 'POS Order' })
      setQrDataUrl(qrRes.data.qrDataUrl)
    } catch (err){ console.error(err); alert('Error initiating UPI payment: '+(err.response?.data?.message||err.message)) }
  }

  function incQty(productId){ dispatch(addToCart({ product: productId, quantity: 1 })) }
  function decQty(productId){ dispatch(addToCart({ product: productId, quantity: -1 })) }
  function remove(productId){ dispatch(removeFromCart(productId)) }

  async function simulatePayment(){
    if(!lastOrderId) return alert('No order to simulate')
    try{
      await api.post('/payments/phonepe/webhook-test', { orderId: lastOrderId, transactionId: 'SIM123' })
      dispatch(clearCart())
      setQrDataUrl(null)
      setLastOrderId(null)
      alert('Payment simulated: order marked PAID')
    }catch(e){ console.error(e); alert('simulate failed') }
  }

  const subtotal = cart.reduce((s,i)=>s + (i.price || 0) * i.quantity + ((i.taxPercent||0)/100)* (i.price||0) * i.quantity, 0)

  return (
    <div>
      <div className="header"><h1>Cafe POS</h1><div>Welcome</div></div>
      <div style={{padding:'12px 24px',display:'flex',alignItems:'center',gap:12}}>
        <input placeholder='Search products...' value={query} onChange={e=>setQuery(e.target.value)} style={{padding:8,borderRadius:8,border:'1px solid #e6eef0',width:320}} />
        <div className="muted">You can checkout as guest (no sign-in required).</div>
      </div>

      <div className="pos-wrap">
        <div className="product-grid">
          {products.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).length === 0 ? (
            <div style={{padding:20}}>
              <h3>No products found</h3>
              <p>Click below to load demo cafe items (requires admin). You can login with <b>admin@pos.test</b> / <b>adminpass</b> or sign up and ask an admin to seed.</p>
              <div style={{marginTop:8}}>
                <SeedButton />
              </div>
            </div>
          ) : products.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).map(p => (
            <div key={p._id} className="product">
              <img src={p.imageUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23888" font-family="Arial" font-size="20">No Image</text></svg>'} alt={p.name} style={{width:'100%',height:160,objectFit:'cover',borderRadius:8}} />
              <h4>{p.name}</h4>
              <div className="muted">{p.description}</div>
              <div style={{marginTop:8}}><b>₹{p.price.toFixed(2)}</b></div>
              <div style={{marginTop:8}}>
                <button onClick={()=>addProductToCart(p)} className="btn-primary">Add</button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart">
          <h3>Cart</h3>
          {cart.map(i=> (
            <div className="cart-item" key={i.product}>
              <div style={{flex:1}}>
                <div><b>{i.name}</b></div>
                <div className="muted">₹{(i.price||0).toFixed(2)} each</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <button className="qty-btn" onClick={()=>decQty(i.product)}>-</button>
                <div>{i.quantity}</div>
                <button className="qty-btn" onClick={()=>incQty(i.product)}>+</button>
              </div>
              <div style={{marginLeft:8}}>
                <button className="qty-btn" onClick={()=>remove(i.product)}>Remove</button>
              </div>
            </div>
          ))}

          <div className="total-row">
            <div>Subtotal</div>
            <div>₹{subtotal.toFixed(2)}</div>
          </div>

          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={checkout} className="pay-btn">Checkout (Cash)</button>
            <button onClick={payWithUPI} className="pay-btn" style={{background:'#1261a0'}}>Pay with UPI</button>
          </div>

          {qrDataUrl && (
            <div style={{marginTop:12}}>
              <h4>Scan this QR with PhonePe</h4>
              <img src={qrDataUrl} alt="UPI QR" style={{width:250,height:250}} />
              <div style={{marginTop:8}}>
                <button onClick={simulatePayment} className="btn-primary">Simulate Payment (dev)</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
