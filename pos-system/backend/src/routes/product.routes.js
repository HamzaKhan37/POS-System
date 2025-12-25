const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/product.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

// Public read routes
router.get('/', ctrl.getProducts)
router.get('/barcode/:barcode', ctrl.getByBarcode)
// Admin-only write routes
router.post('/', protect, authorize('admin'), ctrl.createProduct)
router.put('/:id', protect, authorize('admin'), ctrl.updateProduct)
router.delete('/:id', protect, authorize('admin'), ctrl.deleteProduct)

module.exports = router
