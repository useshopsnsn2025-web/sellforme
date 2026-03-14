const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  order_number: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email: { type: String, required: true },

  // Line items
  line_items: [{
    product_id: { type: String, required: true },
    variant_id: { type: String },
    title: { type: String, required: true },
    variant_title: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    image: { type: String, default: '' },
    sku: { type: String, default: '' }
  }],

  // Pricing
  subtotal_price: { type: Number, required: true },
  total_shipping: { type: Number, default: 0 },
  total_tax: { type: Number, default: 0 },
  total_discounts: { type: Number, default: 0 },
  total_price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },

  // Discount
  discount_code: { type: String, default: '' },
  discount_amount: { type: Number, default: 0 },

  // Status
  financial_status: { type: String, enum: ['pending', 'paid', 'refunded', 'partially_refunded', 'voided'], default: 'pending' },
  fulfillment_status: { type: String, enum: ['unfulfilled', 'partial', 'fulfilled', 'restocked'], default: 'unfulfilled' },

  // Shipping
  shipping_address: {
    first_name: String,
    last_name: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    province: String,
    country: String,
    zip: String,
    phone: String
  },
  billing_address: {
    first_name: String,
    last_name: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    province: String,
    country: String,
    zip: String,
    phone: String
  },

  // Shipping method
  shipping_method: { type: String, default: '' },
  tracking_number: { type: String, default: '' },
  tracking_url: { type: String, default: '' },

  // Payment
  payment_method: { type: String, default: '' },
  payment_id: { type: String, default: '' },

  note: { type: String, default: '' },
  tags: [{ type: String }],

  cancelled_at: { type: Date },
  closed_at: { type: Date },
}, {
  timestamps: true
})

// Indexes
orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ email: 1 })
orderSchema.index({ agent_id: 1, createdAt: -1 })
orderSchema.index({ financial_status: 1 })
orderSchema.index({ fulfillment_status: 1 })
orderSchema.index({ order_number: 1, email: 1 })

// Counter collection for atomic order number generation
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 10000 }
})
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema)

// Auto-generate order number using atomic counter (race-condition safe)
orderSchema.pre('save', async function(next) {
  if (!this.order_number) {
    const counter = await Counter.findByIdAndUpdate(
      'order_number',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
    this.order_number = 'SF' + String(counter.seq).padStart(6, '0')
  }
  next()
})

module.exports = mongoose.model('Order', orderSchema)
