const express = require('express')
const router = express.Router()
const { seed, listUsers, updateRole } = require('../controllers/admin.controller')
const { protect, authorize } = require('../middleware/auth.middleware')
const multer = require('multer')
const upload = multer({ dest: './uploads/tmp' })
const adminController = require('../controllers/admin.controller')

// seed DB via API (admin only)
router.post('/seed', protect, authorize('admin'), seed)
// users management
router.get('/users', protect, authorize('admin'), listUsers)
router.post('/users/:id/role', protect, authorize('admin'), updateRole)
router.delete('/users/:id', protect, authorize('admin'), require('../controllers/admin.controller').deleteUser)

// Upload personal PhonePe QR from admin UI (to Cloudinary)
router.post('/phonepe-qr-upload', protect, authorize('admin'), upload.single('qr'), adminController.uploadPhonePeQr)

// Get current PhonePe QR URL (public, no auth needed since POS needs it)
router.get('/phonepe-qr', adminController.getPhonePeQr)

// Get pending orders for payment verification (admin only)
router.get('/pending-payments', protect, authorize('admin'), adminController.getPendingPayments)

// Manually verify/mark an order as paid (admin only)
router.post('/verify-payment', protect, authorize('admin'), express.json(), adminController.verifyPayment)

// Database management (stats, export, delete collections)
router.get('/db-stats', protect, authorize('admin'), adminController.getDbStats)
router.get('/export-db', protect, authorize('admin'), adminController.exportDatabase)
router.post('/delete-collection', protect, authorize('admin'), express.json(), adminController.deleteCollection)

// Backup DB to CSV files and wipe data (keeps calling admin)
router.post('/backup-wipe', protect, authorize('admin'), express.json(), adminController.backupAndWipe)

module.exports = router
