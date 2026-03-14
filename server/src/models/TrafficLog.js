const mongoose = require('mongoose')

const trafficLogSchema = new mongoose.Schema({
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  agent_code: { type: String, default: '' },
  ip: { type: String, default: '' },
  ua: { type: String, default: '' },
  browser: { type: String, default: '' },
  os: { type: String, default: '' },
  device: { type: String, enum: ['pc', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
  url: { type: String, default: '' },
  referrer: { type: String, default: '' },
  language: { type: String, default: '' },
  session_id: { type: String, default: '' },

  // Event tracking
  event_type: {
    type: String,
    enum: ['page_view', 'page_leave', 'add_to_cart', 'checkout', 'purchase'],
    default: 'page_view'
  },

  // Page classification
  page_type: {
    type: String,
    enum: ['home', 'products', 'product_detail', 'collections', 'collection_detail', 'cart', 'checkout', 'account', 'search', 'blog', 'static_page', 'tracking', 'other'],
    default: 'other'
  },

  // Product tracking
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  product_handle: { type: String, default: '' },
  product_title: { type: String, default: '' },

  // Duration (seconds) — sent by page_leave event
  duration: { type: Number, default: 0 },

  // Visitor type
  is_new_visitor: { type: Boolean, default: true },
}, {
  timestamps: true
})

// Indexes for fast queries
trafficLogSchema.index({ agent_id: 1, createdAt: -1 })
trafficLogSchema.index({ agent_code: 1, createdAt: -1 })
trafficLogSchema.index({ createdAt: -1 })
trafficLogSchema.index({ event_type: 1, createdAt: -1 })
trafficLogSchema.index({ page_type: 1, createdAt: -1 })
trafficLogSchema.index({ product_id: 1, createdAt: -1 })
trafficLogSchema.index({ product_handle: 1, createdAt: -1 })
trafficLogSchema.index({ session_id: 1 })

module.exports = mongoose.model('TrafficLog', trafficLogSchema)
