const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  // Product ID with 'm' prefix like pypipi.com (e.g. m40016936905)
  product_id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  handle: { type: String, required: true, index: true },
  body_html: { type: String, default: '' },
  vendor: { type: String, default: 'SellForMe' },
  product_type: { type: String, default: '' },
  tags: [{ type: String }],
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },

  // Images - matching pypipi.com CDN format
  images: [{
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    width: { type: Number },
    height: { type: Number },
    position: { type: Number, default: 0 }
  }],
  featured_image: { type: String, default: '' },

  // Variants
  variants: [{
    variant_id: { type: String },
    title: { type: String, default: 'Default' },
    price: { type: Number, required: true },
    compare_at_price: { type: Number, default: null },
    sku: { type: String, default: '' },
    inventory_quantity: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    weight_unit: { type: String, default: 'kg' },
    option1: { type: String, default: null },
    option2: { type: String, default: null },
    option3: { type: String, default: null },
    requires_shipping: { type: Boolean, default: true },
    taxable: { type: Boolean, default: true }
  }],

  // Options (like Size, Color, etc.)
  options: [{
    name: { type: String },
    position: { type: Number },
    values: [{ type: String }]
  }],

  // Pricing (main variant)
  price: { type: Number, required: true },
  compare_at_price: { type: Number, default: null },
  currency: { type: String, default: 'USD' },

  // Collections this product belongs to
  collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],

  // Seller
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },

  // SEO
  seo_title: { type: String, default: '' },
  seo_description: { type: String, default: '' },

  // Condition (for pre-owned items like pypipi.com)
  condition: { type: String, enum: ['new', 'like-new', 'good', 'fair', 'poor'], default: 'good' },
  condition_description: { type: String, default: '' },

  // Rating
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews_count: { type: Number, default: 0 },

  // Stock
  in_stock: { type: Boolean, default: true },
  total_inventory: { type: Number, default: 0 },

  // Source tracking (for scraped data)
  source: { type: String, enum: ['manual', 'scraped'], default: 'manual' },
  source_url: { type: String, default: '' },
  scraped_at: { type: Date },

  published_at: { type: Date, default: Date.now },
}, {
  timestamps: true
})

// Text search index
productSchema.index({ title: 'text', body_html: 'text', tags: 'text', product_type: 'text' })

module.exports = mongoose.model('Product', productSchema)
