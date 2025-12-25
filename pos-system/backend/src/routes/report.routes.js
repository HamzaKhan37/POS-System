const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/report.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

router.use(protect, authorize('admin'))
router.get('/sales-summary', ctrl.salesSummary)
router.get('/top-products', ctrl.topProducts)
router.get('/low-stock', ctrl.lowStock)
router.get('/analytics', ctrl.analytics)

module.exports = router
