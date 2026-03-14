const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String, default: '' },
  group: { type: String, default: '默认分组' },
  size: { type: Number, default: 0 },
  width: { type: Number },
  height: { type: Number },
  mime: { type: String, default: '' },
  is_external: { type: Boolean, default: false },
}, {
  timestamps: true
})

imageSchema.index({ group: 1, createdAt: -1 })
imageSchema.index({ name: 'text' })

module.exports = mongoose.model('Image', imageSchema)
