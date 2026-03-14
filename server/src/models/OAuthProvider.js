const mongoose = require('mongoose')

const oauthProviderSchema = new mongoose.Schema({
  provider: { type: String, required: true, unique: true, enum: ['google', 'facebook', 'amazon', 'paypal', 'linkedin'] },
  enabled: { type: Boolean, default: false },
  client_id: { type: String, default: '' },
  client_secret: { type: String, default: '' },
  redirect_uri: { type: String, default: '' },
  scopes: { type: String, default: '' },
  note: { type: String, default: '' },
}, {
  timestamps: true
})

module.exports = mongoose.model('OAuthProvider', oauthProviderSchema)
