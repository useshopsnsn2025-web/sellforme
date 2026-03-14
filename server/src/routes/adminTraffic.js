const router = require('express').Router()
const TrafficLog = require('../models/TrafficLog')
const User = require('../models/User')
const { apiResponse } = require('../utils/helper')
const { adminAuth, getAgentFilter } = require('../middleware/auth')

router.use(adminAuth)

// Helper: build date + agent filter
function buildFilter(req) {
  const { days = 7, agent_id } = req.query
  const filter = getAgentFilter(req.user)
  if (req.user.role === 'admin' && agent_id) filter.agent_id = agent_id
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - Number(days))
  startDate.setHours(0, 0, 0, 0)
  filter.createdAt = { $gte: startDate }
  return filter
}

// ===== TAB 1: Overview / Stats =====
router.get('/stats', async (req, res) => {
  try {
    const filter = buildFilter(req)
    const pvFilter = { ...filter, event_type: 'page_view' }

    // Daily PV/UV
    const dailyStats = await TrafficLog.aggregate([
      { $match: pvFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          pv: { $sum: 1 },
          uv: { $addToSet: '$session_id' },
        }
      },
      { $project: { date: '$_id', pv: 1, uv: { $size: '$uv' }, _id: 0 } },
      { $sort: { date: 1 } },
    ])

    const totalPV = dailyStats.reduce((s, d) => s + d.pv, 0)
    const totalUV = dailyStats.reduce((s, d) => s + d.uv, 0)

    // Today stats
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayFilter = { ...getAgentFilter(req.user), event_type: 'page_view', createdAt: { $gte: todayStart } }
    if (req.user.role === 'admin' && req.query.agent_id) todayFilter.agent_id = req.query.agent_id

    const [todayPV, todayUVAgg] = await Promise.all([
      TrafficLog.countDocuments(todayFilter),
      TrafficLog.aggregate([
        { $match: todayFilter },
        { $group: { _id: '$session_id' } },
        { $count: 'count' },
      ]),
    ])

    // Device breakdown
    const deviceStats = await TrafficLog.aggregate([
      { $match: pvFilter },
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ])

    // Browser breakdown
    const browserStats = await TrafficLog.aggregate([
      { $match: pvFilter },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    // New vs returning visitors
    const visitorStats = await TrafficLog.aggregate([
      { $match: pvFilter },
      { $group: { _id: '$is_new_visitor', count: { $sum: 1 } } },
    ])
    const newVisitors = visitorStats.find(v => v._id === true)?.count || 0
    const returnVisitors = visitorStats.find(v => v._id === false)?.count || 0

    // Hourly distribution (for today)
    const hourlyStats = await TrafficLog.aggregate([
      { $match: todayFilter },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { hour: '$_id', count: 1, _id: 0 } },
    ])

    apiResponse(res, 200, 'ok', {
      daily: dailyStats,
      summary: { pv: totalPV, uv: totalUV },
      today: { pv: todayPV, uv: todayUVAgg[0]?.count || 0 },
      devices: deviceStats.reduce((acc, d) => { acc[d._id || 'unknown'] = d.count; return acc }, {}),
      browsers: browserStats.map(b => ({ name: b._id || 'Unknown', count: b.count })),
      visitors: { new: newVisitors, returning: returnVisitors },
      hourly: hourlyStats,
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// ===== TAB 2: Page Analysis =====
router.get('/pages', async (req, res) => {
  try {
    const filter = buildFilter(req)

    // Per-URL page views with page_type tag
    const urlStats = await TrafficLog.aggregate([
      { $match: { ...filter, event_type: 'page_view' } },
      {
        $group: {
          _id: '$url',
          page_type: { $first: '$page_type' },
          pv: { $sum: 1 },
          uv: { $addToSet: '$session_id' },
        }
      },
      { $project: { url: '$_id', page_type: 1, pv: 1, uv: { $size: '$uv' }, _id: 0 } },
      { $sort: { pv: -1 } },
      { $limit: 50 },
    ])

    // Average duration per URL (from page_leave events)
    const durationStats = await TrafficLog.aggregate([
      { $match: { ...filter, event_type: 'page_leave', duration: { $gt: 0 } } },
      {
        $group: {
          _id: '$url',
          avg_duration: { $avg: '$duration' },
        }
      },
      { $project: { url: '$_id', avg_duration: { $round: ['$avg_duration', 1] }, _id: 0 } },
    ])
    const durationMap = {}
    durationStats.forEach(d => { durationMap[d.url] = d.avg_duration })

    // Summary by page_type (for overview)
    const pageTypeSummary = await TrafficLog.aggregate([
      { $match: { ...filter, event_type: 'page_view' } },
      {
        $group: {
          _id: '$page_type',
          pv: { $sum: 1 },
          uv: { $addToSet: '$session_id' },
        }
      },
      { $project: { page_type: '$_id', pv: 1, uv: { $size: '$uv' }, _id: 0 } },
      { $sort: { pv: -1 } },
    ])

    // Bounce rate: sessions with only 1 page_view
    const sessionPages = await TrafficLog.aggregate([
      { $match: { ...filter, event_type: 'page_view' } },
      { $group: { _id: '$session_id', pages: { $sum: 1 } } },
    ])
    const totalSessions = sessionPages.length
    const bounceSessions = sessionPages.filter(s => s.pages === 1).length
    const bounceRate = totalSessions > 0 ? ((bounceSessions / totalSessions) * 100).toFixed(1) : 0

    const pages = urlStats.map(p => ({
      ...p,
      avg_duration: durationMap[p.url] || 0,
    }))

    apiResponse(res, 200, 'ok', {
      pages,
      page_type_summary: pageTypeSummary,
      bounce_rate: Number(bounceRate),
      total_sessions: totalSessions,
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// ===== TAB 3: Product Analysis =====
router.get('/products', async (req, res) => {
  try {
    const filter = buildFilter(req)
    const Product = require('../models/Product')

    // Product page views ranking by handle (extracted from URL)
    const productViews = await TrafficLog.aggregate([
      { $match: { ...filter, event_type: 'page_view', page_type: 'product_detail' } },
      {
        // Extract handle from URL: /products/m26351753069/?ref=a1 -> m26351753069
        $addFields: {
          handle: {
            $arrayElemAt: [
              { $split: [{ $arrayElemAt: [{ $split: [{ $arrayElemAt: [{ $split: ['$url', '?'] }, 0] }, '/products/'] }, 1] }, '/'] },
              0
            ]
          }
        }
      },
      { $match: { handle: { $ne: '' } } },
      {
        $group: {
          _id: '$handle',
          pv: { $sum: 1 },
          uv: { $addToSet: '$session_id' },
        }
      },
      { $project: { handle: '$_id', pv: 1, uv: { $size: '$uv' }, _id: 0 } },
      { $sort: { pv: -1 } },
      { $limit: 30 },
    ])

    // Lookup product titles from Product collection
    const handles = productViews.map(p => p.handle)
    const productDocs = await Product.find({ handle: { $in: handles } }).select('handle title images')
    const productMap = {}
    productDocs.forEach(p => { const img = p.images?.[0]; productMap[p.handle] = { title: p.title, image: (typeof img === 'string' ? img : img?.src) || '' } })

    // Product add-to-cart counts (by product_handle field or URL extraction)
    const productCarts = await TrafficLog.aggregate([
      { $match: { ...filter, event_type: 'add_to_cart' } },
      { $match: { $or: [{ product_handle: { $ne: '' } }] } },
      { $group: { _id: '$product_handle', count: { $sum: 1 } } },
    ])
    const cartMap = {}
    productCarts.forEach(c => { if (c._id) cartMap[c._id] = c.count })

    // Product avg duration
    const productDuration = await TrafficLog.aggregate([
      { $match: { ...filter, event_type: 'page_leave', page_type: 'product_detail', duration: { $gt: 0 } } },
      {
        $addFields: {
          handle: {
            $arrayElemAt: [
              { $split: [{ $arrayElemAt: [{ $split: [{ $arrayElemAt: [{ $split: ['$url', '?'] }, 0] }, '/products/'] }, 1] }, '/'] },
              0
            ]
          }
        }
      },
      { $match: { handle: { $ne: '' } } },
      { $group: { _id: '$handle', avg_duration: { $avg: '$duration' } } },
    ])
    const durMap = {}
    productDuration.forEach(d => { durMap[d._id] = Math.round(d.avg_duration * 10) / 10 })

    const products = productViews.map(p => ({
      ...p,
      title: productMap[p.handle]?.title || p.handle,
      image: productMap[p.handle]?.image || '',
      add_to_cart: cartMap[p.handle] || 0,
      avg_duration: durMap[p.handle] || 0,
      cart_rate: p.uv > 0 ? ((cartMap[p.handle] || 0) / p.uv * 100).toFixed(1) : '0.0',
    }))

    apiResponse(res, 200, 'ok', { products })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// ===== TAB 4: Funnel Analysis =====
router.get('/funnel', async (req, res) => {
  try {
    const filter = buildFilter(req)

    // Count unique sessions for each funnel step
    const steps = ['page_view', 'add_to_cart', 'checkout', 'purchase']
    const counts = {}

    for (const step of steps) {
      const match = step === 'page_view'
        ? { ...filter, event_type: 'page_view' }
        : { ...filter, event_type: step }

      const result = await TrafficLog.aggregate([
        { $match: match },
        { $group: { _id: '$session_id' } },
        { $count: 'count' },
      ])
      counts[step] = result[0]?.count || 0
    }

    // Also get page_type specific funnels
    const pageSteps = ['home', 'products', 'product_detail', 'cart', 'checkout']
    const pageCounts = {}
    for (const pt of pageSteps) {
      const result = await TrafficLog.aggregate([
        { $match: { ...filter, event_type: 'page_view', page_type: pt } },
        { $group: { _id: '$session_id' } },
        { $count: 'count' },
      ])
      pageCounts[pt] = result[0]?.count || 0
    }

    // Build funnel with conversion rates
    const eventFunnel = steps.map((step, i) => ({
      step,
      sessions: counts[step],
      rate: i === 0 ? '100.0' : (counts[steps[0]] > 0 ? (counts[step] / counts[steps[0]] * 100).toFixed(1) : '0.0'),
      step_rate: i === 0 ? '100.0' : (counts[steps[i - 1]] > 0 ? (counts[step] / counts[steps[i - 1]] * 100).toFixed(1) : '0.0'),
    }))

    const pageFunnel = pageSteps.map((pt, i) => ({
      page_type: pt,
      sessions: pageCounts[pt],
      rate: i === 0 && pageCounts[pageSteps[0]] > 0 ? '100.0' : (pageCounts[pageSteps[0]] > 0 ? (pageCounts[pt] / pageCounts[pageSteps[0]] * 100).toFixed(1) : '0.0'),
      step_rate: i === 0 ? '100.0' : (pageCounts[pageSteps[i - 1]] > 0 ? (pageCounts[pt] / pageCounts[pageSteps[i - 1]] * 100).toFixed(1) : '0.0'),
    }))

    apiResponse(res, 200, 'ok', {
      event_funnel: eventFunnel,
      page_funnel: pageFunnel,
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// ===== TAB 5: User Behavior =====
router.get('/behavior', async (req, res) => {
  try {
    const filter = buildFilter(req)
    const pvFilter = { ...filter, event_type: 'page_view' }

    // Referrer sources
    const referrerStats = await TrafficLog.aggregate([
      { $match: pvFilter },
      {
        $addFields: {
          source: {
            $switch: {
              branches: [
                { case: { $eq: ['$referrer', ''] }, then: 'direct' },
                { case: { $regexMatch: { input: '$referrer', regex: /google|bing|yahoo|baidu|duckduckgo/i } }, then: 'search_engine' },
              ],
              default: 'external'
            }
          }
        }
      },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $project: { source: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ])

    // Top referrer domains
    const topReferrers = await TrafficLog.aggregate([
      { $match: { ...pvFilter, referrer: { $ne: '' } } },
      {
        $addFields: {
          domain: {
            $arrayElemAt: [{ $split: [{ $arrayElemAt: [{ $split: ['$referrer', '//'] }, 1] }, '/'] }, 0]
          }
        }
      },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { domain: '$_id', count: 1, _id: 0 } },
    ])

    // OS distribution
    const osStats = await TrafficLog.aggregate([
      { $match: pvFilter },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { os: '$_id', count: 1, _id: 0 } },
    ])

    // Average pages per session
    const sessionAgg = await TrafficLog.aggregate([
      { $match: pvFilter },
      { $group: { _id: '$session_id', pages: { $sum: 1 } } },
      { $group: { _id: null, avg_pages: { $avg: '$pages' }, total_sessions: { $sum: 1 } } },
    ])
    const avgPages = sessionAgg[0]?.avg_pages ? Math.round(sessionAgg[0].avg_pages * 10) / 10 : 0

    // Average session duration (from page_leave events)
    const sessionDuration = await TrafficLog.aggregate([
      { $match: { ...filter, event_type: 'page_leave', duration: { $gt: 0 } } },
      { $group: { _id: '$session_id', total_duration: { $sum: '$duration' } } },
      { $group: { _id: null, avg_duration: { $avg: '$total_duration' } } },
    ])
    const avgSessionDuration = sessionDuration[0]?.avg_duration ? Math.round(sessionDuration[0].avg_duration) : 0

    // Language distribution
    const langStats = await TrafficLog.aggregate([
      { $match: pvFilter },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { language: '$_id', count: 1, _id: 0 } },
    ])

    apiResponse(res, 200, 'ok', {
      sources: referrerStats,
      top_referrers: topReferrers,
      os: osStats,
      languages: langStats,
      avg_pages_per_session: avgPages,
      avg_session_duration: avgSessionDuration,
      total_sessions: sessionAgg[0]?.total_sessions || 0,
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// ===== Agent Traffic Ranking (admin only) =====
router.get('/agents', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return apiResponse(res, 403, '仅主管理员可查看')

    const { days = 7 } = req.query
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))
    startDate.setHours(0, 0, 0, 0)

    const agentStats = await TrafficLog.aggregate([
      { $match: { agent_id: { $ne: null }, event_type: 'page_view', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$agent_id',
          pv: { $sum: 1 },
          uv: { $addToSet: '$session_id' },
        }
      },
      { $project: { agent_id: '$_id', pv: 1, uv: { $size: '$uv' }, _id: 0 } },
      { $sort: { pv: -1 } },
    ])

    const agentIds = agentStats.map(a => a.agent_id)
    const agents = await User.find({ _id: { $in: agentIds } }).select('first_name last_name email agent_code')
    const agentMap = {}
    agents.forEach(a => { agentMap[a._id.toString()] = a.toJSON() })

    const regStats = await User.aggregate([
      { $match: { role: 'customer', agent_id: { $in: agentIds }, createdAt: { $gte: startDate } } },
      { $group: { _id: '$agent_id', count: { $sum: 1 } } },
    ])
    const regMap = {}
    regStats.forEach(r => { regMap[r._id.toString()] = r.count })

    const result = agentStats.map(a => ({
      ...a,
      agent: agentMap[a.agent_id.toString()] || null,
      registrations: regMap[a.agent_id.toString()] || 0,
    }))

    apiResponse(res, 200, 'ok', { agents: result })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
