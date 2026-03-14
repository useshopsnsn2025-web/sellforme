const mongoose = require('mongoose')

const collectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  handle: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  body_html: { type: String, default: '' },
  image: {
    src: { type: String, default: '' },
    alt: { type: String, default: '' },
    width: { type: Number },
    height: { type: Number }
  },
  ad_title: { type: String, default: '' },
  sort_order: { type: String, default: 'manual' },
  sort_weight: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
  products_count: { type: Number, default: 0 },

  // SEO
  seo_title: { type: String, default: '' },
  seo_description: { type: String, default: '' },

  // Source tracking
  source: { type: String, enum: ['manual', 'scraped'], default: 'manual' },
  source_url: { type: String, default: '' },

  published_at: { type: Date, default: Date.now },
}, {
  timestamps: true
})

module.exports = mongoose.model('Collection', collectionSchema)
