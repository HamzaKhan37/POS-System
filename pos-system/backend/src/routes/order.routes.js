const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/order.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

// allow public checkout (guest) and authenticated checkout
router.post('/', ctrl.createOrder)
router.get('/', protect, authorize('admin'), ctrl.getOrders)
router.get('/:id', protect, authorize('admin','cashier'), ctrl.getOrder)

module.exports = router
