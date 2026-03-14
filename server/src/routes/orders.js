const router = require('express').Router()
const Order = require('../models/Order')
const Product = require('../models/Product')
const { apiResponse } = require('../utils/helper')
const { authMiddleware } = require('../middleware/auth')

// Create order (can be guest or logged in)
router.post('/', async (req, res) => {
  try {
    const data = req.body
    if (!data.line_items?.length) return apiResponse(res, 400, '订单不能为空')
    if (!data.email) return apiResponse(res, 400, '请填写邮箱')

    // Server-side price verification: fetch real prices from DB
    const productIds = data.line_items.map(item => item.product_id)
    const products = await Product.find({ product_id: { $in: productIds } }).select('product_id price title featured_image').lean()
    const priceMap = {}
    for (const p of products) priceMap[p.product_id] = p

    const verifiedItems = []
    for (const item of data.line_items) {
      const real = priceMap[item.product_id]
      if (!real) return apiResponse(res, 400, `Product ${item.product_id} not found`)
      if (!item.quantity || item.quantity < 1 || item.quantity > 99) return apiResponse(res, 400, 'Invalid quantity')
      verifiedItems.push({
        ...item,
        price: real.price, // use DB price, not client price
        title: real.title,
        image: item.image || real.featured_image,
      })
    }

    // Calculate totals from verified prices
    const subtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const orderData = {
      ...data,
      line_items: verifiedItems,
      subtotal_price: Math.round(subtotal * 100) / 100,
      total_price: Math.round((subtotal + (data.total_shipping || 0) - (data.total_discounts || 0)) * 100) / 100,
    }

    // Attach user if authenticated
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        orderData.user = decoded.id
      } catch {}
    }

    const order = await Order.create(orderData)
    apiResponse(res, 200, 'ok', { order })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Get my orders (authenticated)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt')
    apiResponse(res, 200, 'ok', { orders })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Track order by order_number + email
router.get('/track', async (req, res) => {
  try {
    const { order_number, email } = req.query
    if (!order_number || !email) return apiResponse(res, 400, '请输入订单号和邮箱')

    const order = await Order.findOne({ order_number, email })
    if (!order) return apiResponse(res, 404, '订单不存在')
    apiResponse(res, 200, 'ok', { order })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
