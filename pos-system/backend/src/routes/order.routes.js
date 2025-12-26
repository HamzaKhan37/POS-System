const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/order.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

// allow checkout only to authenticated staff (cashier or admin)
router.post('/', protect, authorize('admin','cashier'), ctrl.createOrder)
router.get('/', protect, authorize('admin'), ctrl.getOrders)
router.get('/:id', protect, authorize('admin','cashier'), ctrl.getOrder)

module.exports = router
