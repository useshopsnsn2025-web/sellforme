const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const OAuthProvider = require('../models/OAuthProvider')
const { apiResponse } = require('../utils/helper')
const { authMiddleware } = require('../middleware/auth')
const { extractClientInfo } = require('../utils/clientInfo')
const { sendWelcomeEmail } = require('../utils/email')

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name,
            referrer, landing_page, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            agent_code } = req.body
    if (!email || !password) return apiResponse(res, 400, '请输入邮箱和密码')
    if (password.length < 8 || password.length > 50) return apiResponse(res, 400, 'Password must be 8-50 characters')

    const exists = await User.findOne({ email })
    if (exists) return apiResponse(res, 400, '该邮箱已注册')

    const client = extractClientInfo(req)

    // Determine channel from UTM or referrer
    let channel = ''
    if (utm_source) {
      channel = utm_source
    } else if (referrer) {
      try { channel = new URL(referrer).hostname } catch { channel = referrer }
    }

    // Resolve agent from referral code
    let agentId = null
    if (agent_code) {
      const agent = await User.findOne({ agent_code: agent_code.toLowerCase(), role: 'agent', status: 'active' })
      if (agent) agentId = agent._id
    }

    const user = await User.create({
      email, password, first_name, last_name,
      agent_id: agentId,
      register_source: 'direct',
      register_channel: channel,
      register_utm: {
        source: utm_source || '',
        medium: utm_medium || '',
        campaign: utm_campaign || '',
        term: utm_term || '',
        content: utm_content || '',
      },
      register_ip: client.ip,
      register_device: client.device,
      register_ua: client.ua,
      register_browser: client.browser,
      register_os: client.os,
      register_referrer: referrer || '',
      register_landing_page: landing_page || '',
      register_language: client.language,
      last_login: new Date(),
      last_login_ip: client.ip,
      last_login_device: client.device,
      login_count: 1,
    })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })

    // Send welcome email (async, don't block response)
    sendWelcomeEmail(user).catch(() => {})

    apiResponse(res, 200, 'ok', { token, user: user.toJSON() })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return apiResponse(res, 400, '请输入邮箱和密码')

    const user = await User.findOne({ email, role: 'customer' })
    if (!user) return apiResponse(res, 401, '账号或密码错误')
    if (user.status !== 'active') return apiResponse(res, 401, '账号已被禁用')

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return apiResponse(res, 401, '账号或密码错误')

    const client = extractClientInfo(req)
    user.last_login = new Date()
    user.last_login_ip = client.ip
    user.last_login_device = client.device
    user.login_count = (user.login_count || 0) + 1
    await user.save()

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
    apiResponse(res, 200, 'ok', { token, user: user.toJSON() })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  apiResponse(res, 200, 'ok', { user: req.user.toJSON() })
})

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body
    Object.assign(req.user, { first_name, last_name, phone })
    await req.user.save()
    apiResponse(res, 200, 'ok', { user: req.user.toJSON() })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// ===== Addresses =====

// Get all addresses
router.get('/addresses', authMiddleware, async (req, res) => {
  apiResponse(res, 200, 'ok', { addresses: req.user.addresses || [] })
})

// Add address
router.post('/addresses', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, company, address1, address2, city, province, country, zip, phone, is_default } = req.body
    if (!address1 || !city || !country) return apiResponse(res, 400, 'Address, city and country are required')

    const addr = { first_name, last_name, company, address1, address2, city, province, country, zip, phone, is_default: !!is_default }

    // If setting as default, unset other defaults
    if (addr.is_default) {
      req.user.addresses.forEach(a => a.is_default = false)
    }
    // If first address, make it default
    if (!req.user.addresses.length) addr.is_default = true

    req.user.addresses.push(addr)
    await req.user.save()
    apiResponse(res, 200, 'ok', { addresses: req.user.addresses })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update address
router.put('/addresses/:addrId', authMiddleware, async (req, res) => {
  try {
    const addr = req.user.addresses.id(req.params.addrId)
    if (!addr) return apiResponse(res, 404, 'Address not found')

    const fields = ['first_name', 'last_name', 'company', 'address1', 'address2', 'city', 'province', 'country', 'zip', 'phone', 'is_default']
    for (const key of fields) {
      if (req.body[key] !== undefined) addr[key] = req.body[key]
    }

    if (addr.is_default) {
      req.user.addresses.forEach(a => {
        if (a._id.toString() !== addr._id.toString()) a.is_default = false
      })
    }

    await req.user.save()
    apiResponse(res, 200, 'ok', { addresses: req.user.addresses })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Delete address
router.delete('/addresses/:addrId', authMiddleware, async (req, res) => {
  try {
    const addr = req.user.addresses.id(req.params.addrId)
    if (!addr) return apiResponse(res, 404, 'Address not found')
    addr.deleteOne()
    await req.user.save()
    apiResponse(res, 200, 'ok', { addresses: req.user.addresses })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// ===== Wishlist =====

// Get wishlist products
router.get('/wishlist', authMiddleware, async (req, res) => {
  try {
    const Product = require('../models/Product')
    const products = await Product.find({ product_id: { $in: req.user.wishlist } })
    apiResponse(res, 200, 'ok', { products, ids: req.user.wishlist })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Toggle wishlist item
router.post('/wishlist', authMiddleware, async (req, res) => {
  try {
    const { product_id } = req.body
    if (!product_id) return apiResponse(res, 400, 'product_id is required')

    const index = req.user.wishlist.indexOf(product_id)
    if (index > -1) {
      req.user.wishlist.splice(index, 1)
    } else {
      req.user.wishlist.push(product_id)
    }
    await req.user.save()
    apiResponse(res, 200, 'ok', { wishlist: req.user.wishlist })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Get enabled OAuth providers (public)
router.get('/providers', async (req, res) => {
  try {
    const providers = await OAuthProvider.find({ enabled: true }).select('provider')
    apiResponse(res, 200, 'ok', { providers: providers.map(p => p.provider) })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// OAuth config map for building auth URLs
const OAUTH_URLS = {
  google: (cfg) => `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cfg.client_id}&redirect_uri=${encodeURIComponent(cfg.redirect_uri)}&response_type=code&scope=${encodeURIComponent(cfg.scopes)}&access_type=offline&prompt=consent`,
  facebook: (cfg) => `https://www.facebook.com/v18.0/dialog/oauth?client_id=${cfg.client_id}&redirect_uri=${encodeURIComponent(cfg.redirect_uri)}&scope=${encodeURIComponent(cfg.scopes)}`,
  amazon: (cfg) => `https://www.amazon.com/ap/oa?client_id=${cfg.client_id}&scope=${encodeURIComponent(cfg.scopes)}&response_type=code&redirect_uri=${encodeURIComponent(cfg.redirect_uri)}`,
  paypal: (cfg) => `https://www.paypal.com/signin/authorize?client_id=${cfg.client_id}&response_type=code&scope=${encodeURIComponent(cfg.scopes)}&redirect_uri=${encodeURIComponent(cfg.redirect_uri)}`,
  linkedin: (cfg) => `https://www.linkedin.com/oauth/v2/authorization?client_id=${cfg.client_id}&redirect_uri=${encodeURIComponent(cfg.redirect_uri)}&response_type=code&scope=${encodeURIComponent(cfg.scopes)}`,
}

// OAuth redirect (initiate login)
router.get('/:provider', async (req, res) => {
  try {
    const { provider } = req.params
    const cfg = await OAuthProvider.findOne({ provider, enabled: true })
    if (!cfg || !cfg.client_id) {
      return res.status(400).send('This login method is not configured or disabled.')
    }
    const buildUrl = OAUTH_URLS[provider]
    if (!buildUrl) return res.status(400).send('Unsupported provider.')
    res.redirect(buildUrl(cfg))
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// OAuth callback (placeholder - implement token exchange per provider)
router.get('/:provider/callback', async (req, res) => {
  try {
    const { provider } = req.params
    const { code } = req.query
    if (!code) return res.status(400).send('Missing authorization code.')

    const cfg = await OAuthProvider.findOne({ provider, enabled: true })
    if (!cfg) return res.status(400).send('Provider not configured.')

    // TODO: Exchange code for token, fetch user profile, create/login user
    // For now redirect to frontend with a message
    res.redirect(`/?oauth=${provider}&status=pending`)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

module.exports = router
