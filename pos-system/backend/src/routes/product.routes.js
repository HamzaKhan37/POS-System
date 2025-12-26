const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/product.controller')
const { protect, authorize } = require('../middleware/auth.middleware')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

// Public read routes
router.get('/', ctrl.getProducts)
router.get('/barcode/:barcode', ctrl.getByBarcode)

// Upload image (admin only)
router.post('/upload', protect, authorize('admin'), upload.single('image'), ctrl.uploadImage)

// Admin-only write routes
router.post('/', protect, authorize('admin'), upload.single('image'), ctrl.createProduct)
router.put('/:id', protect, authorize('admin'), upload.single('image'), ctrl.updateProduct)
router.delete('/:id', protect, authorize('admin'), ctrl.deleteProduct)

module.exports = router
