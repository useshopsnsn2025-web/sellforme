const mongoose = require('mongoose')

const emailCampaignSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['promotion', 'new_product', 'newsletter', 'custom'], default: 'custom' },
  status: { type: String, enum: ['draft', 'sending', 'sent', 'failed'], default: 'draft' },
  target: { type: String, enum: ['all_subscribers', 'active_only'], default: 'active_only' },
  total_count: { type: Number, default: 0 },
  sent_count: { type: Number, default: 0 },
  fail_count: { type: Number, default: 0 },
  sent_at: { type: Date },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema)
