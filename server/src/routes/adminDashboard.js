const router = require('express').Router()
const Product = require('../models/Product')
const Collection = require('../models/Collection')
const Order = require('../models/Order')
const User = require('../models/User')
const TrafficLog = require('../models/TrafficLog')
const { apiResponse } = require('../utils/helper')
const { adminAuth, getAgentFilter } = require('../middleware/auth')

router.use(adminAuth)

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const isAgent = req.user.role === 'agent'
    const agentFilter = getAgentFilter(req.user)

    // Agent sees own customers/orders; admin sees all
    const userFilter = isAgent ? { role: 'customer', agent_id: req.user._id } : { role: 'customer' }
    const orderFilter = isAgent ? { agent_id: req.user._id } : {}

    const queries = [
      Order.countDocuments(orderFilter),
      User.countDocuments(userFilter),
    ]
    // Only admin sees product/collection counts
    if (!isAgent) {
      queries.push(Product.countDocuments())
      queries.push(Collection.countDocuments())
    }

    const results = await Promise.all(queries)
    const ordersCount = results[0]
    const usersCount = results[1]
    const productsCount = isAgent ? null : results[2]
    const collectionsCount = isAgent ? null : results[3]

    const recentOrders = await Order.find(orderFilter).sort('-createdAt').limit(10).populate('user', 'email first_name last_name')

    const revenueMatch = isAgent
      ? { financial_status: 'paid', agent_id: req.user._id }
      : { financial_status: 'paid' }
    const revenue = await Order.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, total: { $sum: '$total_price' }, count: { $sum: 1 } } }
    ])

    const ordersByStatus = await Order.aggregate([
      { $match: orderFilter },
      { $group: { _id: '$financial_status', count: { $sum: 1 } } }
    ])

    // Today traffic for agent
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let todayTraffic = null
    if (isAgent) {
      const agentCode = req.user.agent_code
      if (agentCode) {
        const trafficAgg = await TrafficLog.aggregate([
          { $match: { agent_code: agentCode, createdAt: { $gte: today } } },
          { $group: { _id: null, pv: { $sum: 1 }, uv: { $addToSet: '$session_id' } } },
          { $project: { _id: 0, pv: 1, uv: { $size: '$uv' } } }
        ])
        todayTraffic = trafficAgg[0] || { pv: 0, uv: 0 }
      }
    }

    const stats = {
      orders: ordersCount,
      users: usersCount,
      revenue: revenue[0]?.total || 0,
      paid_orders: revenue[0]?.count || 0,
    }
    if (!isAgent) {
      stats.products = productsCount
      stats.collections = collectionsCount
    }
    if (todayTraffic) {
      stats.today_pv = todayTraffic.pv
      stats.today_uv = todayTraffic.uv
    }

    apiResponse(res, 200, 'ok', {
      stats,
      recent_orders: recentOrders,
      orders_by_status: ordersByStatus,
      role: req.user.role,
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
