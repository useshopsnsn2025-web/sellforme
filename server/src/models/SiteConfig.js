const mongoose = require('mongoose')

const siteConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, default: '' },
  label: { type: String, default: '' },
  group: { type: String, default: 'general' },
}, {
  timestamps: true
})

module.exports = mongoose.model('SiteConfig', siteConfigSchema)
