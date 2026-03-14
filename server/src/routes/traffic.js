const router = require('express').Router()
const TrafficLog = require('../models/TrafficLog')
const User = require('../models/User')
const { apiResponse } = require('../utils/helper')
const { extractClientInfo } = require('../utils/clientInfo')

// Classify URL to page_type
function classifyPage(url) {
  if (!url) return 'other'
  const path = url.split('?')[0]
  if (path === '/' || path === '') return 'home'
  if (/^\/products\/[^/]+/.test(path)) return 'product_detail'
  if (path === '/products') return 'products'
  if (/^\/collections\/[^/]+/.test(path)) return 'collection_detail'
  if (path === '/collections') return 'collections'
  if (path === '/cart') return 'cart'
  if (path === '/checkout') return 'checkout'
  if (path.startsWith('/account')) return 'account'
  if (path === '/search') return 'search'
  if (path.startsWith('/blogs')) return 'blog'
  if (path.startsWith('/pages/')) return 'static_page'
  if (path === '/tracking') return 'tracking'
  return 'other'
}

// Extract product handle from URL like /products/m26351753069
function extractProductHandle(url) {
  if (!url) return ''
  const match = url.split('?')[0].match(/^\/products\/([^/]+)/)
  return match ? match[1] : ''
}

// Public: record a tracking event
router.post('/track', async (req, res) => {
  try {
    const { agent_code, url, referrer, session_id, event_type, product_id, product_title, duration, is_new_visitor } = req.body
    const client = extractClientInfo(req)

    let agent_id = null
    if (agent_code) {
      const agent = await User.findOne({ agent_code: agent_code.toLowerCase(), role: 'agent', status: 'active' })
      if (agent) agent_id = agent._id
    }

    const evType = ['page_view', 'page_leave', 'add_to_cart', 'checkout', 'purchase'].includes(event_type) ? event_type : 'page_view'
    const pageType = classifyPage(url)
    const handle = extractProductHandle(url)

    await TrafficLog.create({
      agent_id,
      agent_code: agent_code || '',
      ip: client.ip,
      ua: client.ua,
      browser: client.browser,
      os: client.os,
      device: client.device,
      url: url || '',
      referrer: referrer || '',
      language: client.language,
      session_id: session_id || '',
      event_type: evType,
      page_type: pageType,
      product_handle: handle,
      product_title: product_title || '',
      duration: Number(duration) || 0,
      is_new_visitor: is_new_visitor !== false,
    })

    apiResponse(res, 200, 'ok')
  } catch (err) {
    // Don't let tracking errors break the user experience
    apiResponse(res, 200, 'ok')
  }
})

module.exports = router
