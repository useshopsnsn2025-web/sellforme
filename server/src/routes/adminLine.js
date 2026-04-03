const router = require('express').Router()
const Line = require('../models/Line')
const { apiResponse } = require('../utils/helper')
const { adminAuth, getAgentFilter } = require('../middleware/auth')

router.use(adminAuth)

// List LINE accounts
router.get('/', async (req, res) => {
  try {
    const { status, agent_id } = req.query
    const query = { ...getAgentFilter(req.user) }
    if (status) query.status = status
    if (req.user.role === 'admin' && agent_id) query.agent_id = agent_id
    const list = await Line.find(query).sort({ sort_weight: -1, createdAt: -1 }).populate('agent_id', 'first_name last_name email agent_code')
    apiResponse(res, 200, 'ok', { list })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Stats
router.get('/stats', async (req, res) => {
  try {
    const filter = getAgentFilter(req.user)
    const [total, active, banned, disabled, clicksAgg] = await Promise.all([
      Line.countDocuments(filter),
      Line.countDocuments({ ...filter, status: 'active' }),
      Line.countDocuments({ ...filter, status: 'banned' }),
      Line.countDocuments({ ...filter, status: 'disabled' }),
      Line.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$click_count' } } }]),
    ])
    apiResponse(res, 200, 'ok', { total, active, banned, disabled, total_clicks: clicksAgg[0]?.total || 0 })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Create
router.post('/', async (req, res) => {
  try {
    const { line_url, name, note, sort_weight } = req.body
    if (!line_url) return apiResponse(res, 400, '请输入LINE链接')

    const agentId = req.user.role === 'agent' ? req.user._id : req.body.agent_id
    if (!agentId) return apiResponse(res, 400, '请指定代理')

    const exists = await Line.findOne({ agent_id: agentId, line_url })
    if (exists) return apiResponse(res, 400, '该LINE链接已存在')

    const item = await Line.create({ agent_id: agentId, line_url, name, note, sort_weight: sort_weight || 0 })
    apiResponse(res, 200, 'ok', { item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update
router.put('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getAgentFilter(req.user) }
    const item = await Line.findOneAndUpdate(query, req.body, { new: true, runValidators: true })
    if (!item) return apiResponse(res, 404, '未找到')
    apiResponse(res, 200, 'ok', { item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Ban
router.put('/:id/ban', async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getAgentFilter(req.user) }
    const item = await Line.findOneAndUpdate(query, { status: 'banned', banned_at: new Date() }, { new: true })
    if (!item) return apiResponse(res, 404, '未找到')
    apiResponse(res, 200, 'ok', { item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Activate
router.put('/:id/activate', async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getAgentFilter(req.user) }
    const item = await Line.findOneAndUpdate(query, { status: 'active', banned_at: null }, { new: true })
    if (!item) return apiResponse(res, 404, '未找到')
    apiResponse(res, 200, 'ok', { item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Reset clicks
router.put('/:id/reset-clicks', async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getAgentFilter(req.user) }
    const item = await Line.findOneAndUpdate(query, { click_count: 0 }, { new: true })
    if (!item) return apiResponse(res, 404, '未找到')
    apiResponse(res, 200, 'ok', { item })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getAgentFilter(req.user) }
    const item = await Line.findOneAndDelete(query)
    if (!item) return apiResponse(res, 404, '未找到')
    apiResponse(res, 200, '删除成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
