const router = require('express').Router()
const User = require('../models/User')
const WhatsApp = require('../models/WhatsApp')
const Line = require('../models/Line')
const TrafficLog = require('../models/TrafficLog')
const { apiResponse } = require('../utils/helper')
const { adminAuth, superAdminOnly } = require('../middleware/auth')

router.use(adminAuth)
router.use(superAdminOnly)

// List all agents
router.get('/', async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' }).sort('-createdAt').select('-password')

    // Enrich with stats
    const enriched = await Promise.all(agents.map(async (agent) => {
      const obj = agent.toJSON()
      const [customersCount, whatsappCount, lineCount, todayTraffic] = await Promise.all([
        User.countDocuments({ role: 'customer', agent_id: agent._id }),
        WhatsApp.countDocuments({ agent_id: agent._id }),
        Line.countDocuments({ agent_id: agent._id }),
        TrafficLog.countDocuments({ agent_id: agent._id, createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      ])
      obj.customers_count = customersCount
      obj.whatsapp_count = whatsappCount
      obj.line_count = lineCount
      obj.today_traffic = todayTraffic
      return obj
    }))

    apiResponse(res, 200, 'ok', { agents: enriched })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Create agent
router.post('/', async (req, res) => {
  try {
    const { email, password, first_name, last_name, agent_code, agent_weight } = req.body
    if (!email || !password) return apiResponse(res, 400, '请输入邮箱和密码')
    if (!agent_code) return apiResponse(res, 400, '请输入推广码')
    if (password.length < 6) return apiResponse(res, 400, '密码最少6位')

    const exists = await User.findOne({ $or: [{ email }, { agent_code }] })
    if (exists) {
      if (exists.email === email.toLowerCase()) return apiResponse(res, 400, '该邮箱已存在')
      return apiResponse(res, 400, '该推广码已被使用')
    }

    const agent = await User.create({
      email, password, first_name, last_name,
      role: 'agent',
      agent_code: agent_code.toLowerCase(),
      agent_weight: agent_weight || 0,
    })
    apiResponse(res, 200, 'ok', { agent: agent.toJSON() })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update agent
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['email', 'first_name', 'last_name', 'phone', 'status', 'agent_code', 'agent_weight', 'contact_method', 'note', 'tags']
    const update = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key]
    }
    if (update.agent_code) update.agent_code = update.agent_code.toLowerCase()

    // Check agent_code uniqueness
    if (update.agent_code) {
      const dup = await User.findOne({ agent_code: update.agent_code, _id: { $ne: req.params.id } })
      if (dup) return apiResponse(res, 400, '该推广码已被使用')
    }

    const agent = await User.findOneAndUpdate({ _id: req.params.id, role: 'agent' }, update, { new: true })
    if (!agent) return apiResponse(res, 404, '代理不存在')
    apiResponse(res, 200, 'ok', { agent: agent.toJSON() })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Reset agent password
router.put('/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body
    if (!password || password.length < 6 || password.length > 15) {
      return apiResponse(res, 400, '密码长度为6-15位')
    }
    const agent = await User.findOne({ _id: req.params.id, role: 'agent' })
    if (!agent) return apiResponse(res, 404, '代理不存在')
    agent.password = password
    await agent.save()
    apiResponse(res, 200, '密码已重置')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const agent = await User.findOneAndDelete({ _id: req.params.id, role: 'agent' })
    if (!agent) return apiResponse(res, 404, '代理不存在')
    // Clean up agent's WhatsApp and LINE numbers
    await Promise.all([
      WhatsApp.deleteMany({ agent_id: req.params.id }),
      Line.deleteMany({ agent_id: req.params.id }),
    ])
    apiResponse(res, 200, '删除成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
