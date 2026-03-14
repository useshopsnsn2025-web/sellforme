const router = require('express').Router()
const OAuthProvider = require('../models/OAuthProvider')
const { apiResponse } = require('../utils/helper')
const { adminAuth } = require('../middleware/auth')

router.use(adminAuth)

const PROVIDERS = ['google', 'facebook', 'amazon', 'paypal', 'linkedin']

const PROVIDER_DEFAULTS = {
  google: { scopes: 'openid email profile', redirect_uri: '/api/auth/google/callback' },
  facebook: { scopes: 'email,public_profile', redirect_uri: '/api/auth/facebook/callback' },
  amazon: { scopes: 'profile', redirect_uri: '/api/auth/amazon/callback' },
  paypal: { scopes: 'openid email profile', redirect_uri: '/api/auth/paypal/callback' },
  linkedin: { scopes: 'openid profile email', redirect_uri: '/api/auth/linkedin/callback' },
}

// Get all providers (init missing ones)
router.get('/', async (req, res) => {
  try {
    let providers = await OAuthProvider.find().sort({ provider: 1 })

    // Auto-create missing providers
    const existing = providers.map(p => p.provider)
    const missing = PROVIDERS.filter(p => !existing.includes(p))
    if (missing.length) {
      const docs = missing.map(p => ({
        provider: p,
        enabled: false,
        redirect_uri: PROVIDER_DEFAULTS[p]?.redirect_uri || '',
        scopes: PROVIDER_DEFAULTS[p]?.scopes || '',
      }))
      await OAuthProvider.insertMany(docs)
      providers = await OAuthProvider.find().sort({ provider: 1 })
    }

    apiResponse(res, 200, 'ok', { providers })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update a provider
router.put('/:provider', async (req, res) => {
  try {
    const { provider } = req.params
    if (!PROVIDERS.includes(provider)) return apiResponse(res, 400, '无效的登录方式')

    const update = {}
    const allowed = ['enabled', 'client_id', 'client_secret', 'redirect_uri', 'scopes', 'note']
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key]
    }

    const item = await OAuthProvider.findOneAndUpdate({ provider }, update, { new: true, upsert: true })
    apiResponse(res, 200, 'ok', { provider: item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
