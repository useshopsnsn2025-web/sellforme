const mongoose = require('mongoose')

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  avatar: { type: String, default: '' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews_count: { type: Number, default: 0 },
  sales_count: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  products_count: { type: Number, default: 0 },
  source: { type: String, enum: ['manual', 'scraped'], default: 'scraped' },
}, {
  timestamps: true
})

module.exports = mongoose.model('Seller', sellerSchema)
