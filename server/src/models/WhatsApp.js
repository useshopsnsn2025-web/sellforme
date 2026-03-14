const mongoose = require('mongoose')

const whatsappSchema = new mongoose.Schema({
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String, required: true },
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

// Unique per agent + phone combination
whatsappSchema.index({ agent_id: 1, phone: 1 }, { unique: true })

module.exports = mongoose.model('WhatsApp', whatsappSchema)
