const mongoose = require('mongoose')

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  status: { type: String, enum: ['active', 'unsubscribed'], default: 'active' },
  source: { type: String, default: 'footer' }, // footer / popup / etc
  ip: { type: String },
  user_agent: { type: String },
}, { timestamps: true })

subscriberSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('Subscriber', subscriberSchema)
