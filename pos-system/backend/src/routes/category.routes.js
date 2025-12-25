const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/category.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

// public get
router.get('/', ctrl.getCategories)

// admin-only for modifications
router.post('/', protect, authorize('admin'), ctrl.createCategory)
router.put('/:id', protect, authorize('admin'), ctrl.updateCategory)
router.delete('/:id', protect, authorize('admin'), ctrl.deleteCategory)

module.exports = router
