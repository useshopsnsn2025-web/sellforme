const mongoose = require('mongoose')

const lineSchema = new mongoose.Schema({
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  line_url: { type: String, required: true },
  name: { type: String, default: '' },
  status: { type: String, enum: ['active', 'banned', 'disabled'], default: 'active' },
  click_count: { type: Number, default: 0 },
  last_clicked_at: { type: Date },
  banned_at: { type: Date },
  sort_weight: { type: Number, default: 0 },
  note: { type: String, default: '' },
}, {
  timestamps: true
})

lineSchema.index({ agent_id: 1, line_url: 1 }, { unique: true })

module.exports = mongoose.model('Line', lineSchema)
