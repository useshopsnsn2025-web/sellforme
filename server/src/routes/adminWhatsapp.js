const router = require('express').Router()
const WhatsApp = require('../models/WhatsApp')
const { apiResponse } = require('../utils/helper')
const { adminAuth, getAgentFilter } = require('../middleware/auth')

router.use(adminAuth)

// List WhatsApp numbers (agent sees own, admin sees all or filtered by agent_id)
router.get('/', async (req, res) => {
  try {
    const { status, agent_id } = req.query
    const query = { ...getAgentFilter(req.user) }
    if (status) query.status = status
    // Admin can filter by specific agent
    if (req.user.role === 'admin' && agent_id) query.agent_id = agent_id
    const list = await WhatsApp.find(query).sort({ sort_weight: -1, createdAt: -1 }).populate('agent_id', 'first_name last_name email agent_code')
    apiResponse(res, 200, 'ok', { list })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Get stats summary
router.get('/stats', async (req, res) => {
  try {
    const filter = getAgentFilter(req.user)
    const [total, active, banned, disabled, clicksAgg] = await Promise.all([
      WhatsApp.countDocuments(filter),
      WhatsApp.countDocuments({ ...filter, status: 'active' }),
      WhatsApp.countDocuments({ ...filter, status: 'banned' }),
      WhatsApp.countDocuments({ ...filter, status: 'disabled' }),
      WhatsApp.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$click_count' } } }]),
    ])
    apiResponse(res, 200, 'ok', { total, active, banned, disabled, total_clicks: clicksAgg[0]?.total || 0 })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Create WhatsApp number (auto-assign agent_id)
router.post('/', async (req, res) => {
  try {
    const { phone, name, note, sort_weight } = req.body
    if (!phone) return apiResponse(res, 400, '请输入WhatsApp号码')

    const agentId = req.user.role === 'agent' ? req.user._id : req.body.agent_id
    if (!agentId) return apiResponse(res, 400, '请指定代理')

    const exists = await WhatsApp.findOne({ agent_id: agentId, phone })
    if (exists) return apiResponse(res, 400, '该号码已存在')

    const item = await WhatsApp.create({ agent_id: agentId, phone, name, note, sort_weight: sort_weight || 0 })
    apiResponse(res, 200, 'ok', { item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update WhatsApp number
router.put('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getAgentFilter(req.user) }
    const item = await WhatsApp.findOneAndUpdate(query, req.body, { new: true, runValidators: true })
    if (!item) return apiResponse(res, 404, '未找到')
    apiResponse(res, 200, 'ok', { item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Mark as banned
router.put('/:id/ban', async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getAgentFilter(req.user) }
    const item = await WhatsApp.findOneAndUpdate(query, { status: 'banned', banned_at: new Date() }, { new: true })
    if (!item) return apiResponse(res, 404, '未找到')
    apiResponse(res, 200, 'ok', { item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Reactivate
router.put('/:id/activate', async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getAgentFilter(req.user) }
    const item = await WhatsApp.findOneAndUpdate(query, { status: 'active', banned_at: null }, { new: true })
    if (!item) return apiResponse(res, 404, '未找到')
    apiResponse(res, 200, 'ok', { item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Reset click count
router.put('/:id/reset-clicks', async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getAgentFilter(req.user) }
    const item = await WhatsApp.findOneAndUpdate(query, { click_count: 0 }, { new: true })
    if (!item) return apiResponse(res, 404, '未找到')
    apiResponse(res, 200, 'ok', { item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Delete WhatsApp number
router.delete('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getAgentFilter(req.user) }
    const item = await WhatsApp.findOneAndDelete(query)
    if (!item) return apiResponse(res, 404, '未找到')
    apiResponse(res, 200, '删除成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
