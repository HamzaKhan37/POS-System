const mongoose = require('mongoose')

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. 'phonepe_qr_url'
  value: { type: String }, // URL or JSON
  cloudinaryPublicId: { type: String } // track Cloudinary asset for deletion
}, { timestamps: true })

module.exports = mongoose.model('Settings', SettingsSchema)
