const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['customer', 'admin', 'agent'], default: 'customer' },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },

  // Agent fields (for role === 'agent')
  agent_code: { type: String, unique: true, sparse: true },  // unique referral code
  agent_weight: { type: Number, default: 0 },                 // higher = shown as default when no ref

  // Customer fields — which agent referred this customer
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Addresses
  addresses: [{
    first_name: String,
    last_name: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    province: String,
    country: String,
    zip: String,
    phone: String,
    is_default: { type: Boolean, default: false }
  }],

  // Wishlist
  wishlist: [{ type: String }], // product_id references

  // Registration tracking
  register_source: { type: String, default: 'direct' }, // direct, google, facebook, amazon, paypal, linkedin
  register_channel: { type: String, default: '' },       // UTM source or referrer domain
  register_utm: {
    source: { type: String, default: '' },
    medium: { type: String, default: '' },
    campaign: { type: String, default: '' },
    term: { type: String, default: '' },
    content: { type: String, default: '' },
  },
  register_ip: { type: String, default: '' },
  register_device: { type: String, enum: ['pc', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
  register_ua: { type: String, default: '' },            // full user-agent string
  register_browser: { type: String, default: '' },       // Chrome, Safari, Firefox, etc.
  register_os: { type: String, default: '' },             // Windows, macOS, iOS, Android, etc.
  register_referrer: { type: String, default: '' },       // document.referrer
  register_landing_page: { type: String, default: '' },   // first page user landed on
  register_country: { type: String, default: '' },        // from IP geolocation (future)
  register_language: { type: String, default: '' },       // browser Accept-Language

  // Login tracking
  last_login: { type: Date },
  last_login_ip: { type: String, default: '' },
  last_login_device: { type: String, default: '' },
  login_count: { type: Number, default: 0 },

  orders_count: { type: Number, default: 0 },
  total_spent: { type: Number, default: 0 },
  tags: [{ type: String }],                               // admin-defined tags
  note: { type: String, default: '' },                    // admin note
}, {
  timestamps: true
})

// Indexes for frequently queried fields
userSchema.index({ role: 1, status: 1 })
userSchema.index({ agent_id: 1, createdAt: -1 })
userSchema.index({ role: 1, createdAt: -1 })
userSchema.index({ email: 1, role: 1 })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
