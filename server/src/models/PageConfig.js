const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' },
  link: { type: String, default: '' },
  button_text: { type: String, default: '' },
  sort_weight: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
}, { _id: true })

const pageConfigSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true, index: true },
  banners: [bannerSchema],
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true
})

module.exports = mongoose.model('PageConfig', pageConfigSchema)
