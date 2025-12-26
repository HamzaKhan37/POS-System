const express = require('express')
const router = express.Router()
const { seed, listUsers, updateRole } = require('../controllers/admin.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

// seed DB via API (admin only)
router.post('/seed', protect, authorize('admin'), seed)
// users management
router.get('/users', protect, authorize('admin'), listUsers)
router.post('/users/:id/role', protect, authorize('admin'), updateRole)
router.delete('/users/:id', protect, authorize('admin'), require('../controllers/admin.controller').deleteUser)

module.exports = router
