const router = require('express').Router()
const Order = require('../models/Order')
const User = require('../models/User')
const { apiResponse } = require('../utils/helper')
const { adminAuth } = require('../middleware/auth')

router.use(adminAuth)

// List orders (agent sees only own customers' orders)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, financial_status, fulfillment_status, sort = '-createdAt' } = req.query
    const query = {}

    // Agent data isolation
    if (req.user.role === 'agent') {
      const customerIds = await User.find({ role: 'customer', agent_id: req.user._id }).distinct('_id')
      query.user = { $in: customerIds }
    }

    if (search) {
      query.$or = [
        { order_number: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    if (financial_status) query.financial_status = financial_status
    if (fulfillment_status) query.fulfillment_status = fulfillment_status

    const total = await Order.countDocuments(query)
    const orders = await Order.find(query).sort(sort).skip((page - 1) * limit).limit(Number(limit)).populate('user', 'email first_name last_name')

    apiResponse(res, 200, 'ok', { orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'email first_name last_name')
    if (!order) return apiResponse(res, 404, '订单不存在')
    apiResponse(res, 200, 'ok', { order })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['financial_status', 'fulfillment_status', 'tracking_number', 'tracking_url', 'note', 'tags']
    const update = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key]
    }

    if (update.fulfillment_status === 'fulfilled' && !update.closed_at) update.closed_at = new Date()

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!order) return apiResponse(res, 404, '订单不存在')
    apiResponse(res, 200, 'ok', { order })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Cancel order
router.post('/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return apiResponse(res, 404, '订单不存在')
    if (order.financial_status === 'refunded') return apiResponse(res, 400, '订单已退款')

    order.financial_status = 'voided'
    order.fulfillment_status = 'restocked'
    order.cancelled_at = new Date()
    await order.save()
    apiResponse(res, 200, '订单已取消', { order })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
