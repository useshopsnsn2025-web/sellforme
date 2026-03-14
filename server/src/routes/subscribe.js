const router = require('express').Router()
const crypto = require('crypto')
const Subscriber = require('../models/Subscriber')
const { apiResponse } = require('../utils/helper')

// Generate unsubscribe token (HMAC-based, no expiry needed)
function generateUnsubToken(email) {
  const secret = process.env.JWT_SECRET || 'fallback-secret'
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32)
}

// POST /api/subscribe — public endpoint
router.post('/', async (req, res) => {
  try {
    const { email, source = 'footer' } = req.body
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiResponse(res, 400, 'Please enter a valid email address')
    }

    const existing = await Subscriber.findOne({ email: email.toLowerCase() })
    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'active'
        await existing.save()
        return apiResponse(res, 200, 'Welcome back! You have been resubscribed.')
      }
      return apiResponse(res, 200, 'You are already subscribed!')
    }

    await Subscriber.create({
      email: email.toLowerCase(),
      source,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    })

    return apiResponse(res, 200, 'Thank you for subscribing!')
  } catch (err) {
    console.error('Subscribe error:', err)
    return apiResponse(res, 500, 'Subscription failed, please try again later')
  }
})

// GET /api/subscribe/unsubscribe?email=xxx&token=xxx — token-verified unsubscribe
router.get('/unsubscribe', async (req, res) => {
  try {
    const { email, token } = req.query
    if (!email || !token) return res.send('<p style="font-family:sans-serif;padding:40px;text-align:center">Invalid unsubscribe link.</p>')

    // Verify token
    const expected = generateUnsubToken(email)
    if (token !== expected) {
      return res.send('<p style="font-family:sans-serif;padding:40px;text-align:center">Invalid or expired unsubscribe link.</p>')
    }

    await Subscriber.findOneAndUpdate({ email: email.toLowerCase() }, { status: 'unsubscribed' })
    res.send('<p style="font-family:sans-serif;padding:40px;text-align:center">You have been successfully unsubscribed.</p>')
  } catch (err) {
    res.send('<p style="font-family:sans-serif;padding:40px;text-align:center">An error occurred. Please try again.</p>')
  }
})

// Export the token generator for use in campaign emails
module.exports = router
module.exports.generateUnsubToken = generateUnsubToken
