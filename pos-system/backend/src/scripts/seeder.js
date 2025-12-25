const Category = require('../models/Category')
const Product = require('../models/Product')
const User = require('../models/User')

async function seedData(){
  const cats = [ 'Snacks', 'Pizzas', 'Burgers', 'Mocktails', 'Coffee' ]
  const created = {}
  for (const c of cats) {
    let cat = await Category.findOne({ name: c })
    if (!cat) cat = await Category.create({ name: c })
    created[c] = cat
  }

  const products = [
    { name: 'Margherita Pizza', category: created['Pizzas']._id, price: 9.99, taxPercent:5, stock: 20, imageUrl: 'https://images.unsplash.com/photo-1601924582971-3b7b9e25f0c9?w=800&q=80', description: 'Classic Margherita with fresh basil.' },
    { name: 'Pepperoni Pizza', category: created['Pizzas']._id, price: 11.99, taxPercent:5, stock: 20, imageUrl: 'https://images.unsplash.com/photo-1601924928341-0b1ec41f8f46?w=800&q=80', description: 'Loaded with pepperoni slices.' },
    { name: 'Veggie Burger', category: created['Burgers']._id, price: 7.49, taxPercent:5, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80', description: 'Fresh veggie patty with sauce.' },
    { name: 'Classic Burger', category: created['Burgers']._id, price: 8.49, taxPercent:5, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1550547328-5f0b9d3f0c1d?w=800&q=80', description: 'Juicy beef burger.' },
    { name: 'French Fries', category: created['Snacks']._id, price: 3.49, taxPercent:0, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1542404104-4e30273d585c?w=800&q=80', description: 'Crispy golden fries.' },
    { name: 'Veg Sandwich', category: created['Snacks']._id, price: 4.99, taxPercent:0, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80', description: 'Fresh vegetables in whole wheat.' },
    { name: 'Mango Mocktail', category: created['Mocktails']._id, price: 4.99, taxPercent:0, stock: 40, imageUrl: 'https://images.unsplash.com/photo-1598515213696-9b9c3d2a2b67?w=800&q=80', description: 'Refreshing mango cooler.' },
    { name: 'Lemon Mint Mocktail', category: created['Mocktails']._id, price: 4.49, taxPercent:0, stock: 40, imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&q=80', description: 'Zesty lemon with mint.' },
    { name: 'Cappuccino', category: created['Coffee']._id, price: 3.99, taxPercent:0, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', description: 'Rich espresso with foam.' },
    { name: 'Latte', category: created['Coffee']._id, price: 3.49, taxPercent:0, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80', description: 'Smooth milk latte.' }
  ]

  for (const p of products) {
    let existing = await Product.findOne({ name: p.name })
    if (!existing) await Product.create(p)
  }

  // admin users
  const admins = [
    { name: 'Admin', email: 'admin@pos.test', password: 'adminpass' },
    { name: 'Mohammed Mayana', email: 'Mohammed.Mayana@gmail.com', password: 'HK@588' }
  ]
  for (const a of admins) {
    const existing = await User.findOne({ email: a.email.toLowerCase() })
    if (!existing) await User.create({ name: a.name, email: a.email, password: a.password, role: 'admin' })
  }

  return { ok: true }
}

module.exports = { seedData }