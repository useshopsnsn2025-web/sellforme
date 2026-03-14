const router = require('express').Router()
const User = require('../models/User')
const { apiResponse, escapeRegex, safePagination } = require('../utils/helper')
const { adminAuth, superAdminOnly, getAgentFilter } = require('../middleware/auth')

router.use(adminAuth)

// List users (agent sees only own customers, admin sees all)
router.get('/', async (req, res) => {
  try {
    const { search, role = 'customer', status, device, source, agent_id } = req.query
    const { page, limit, skip } = safePagination(req.query)
    const query = { role }

    // Agent data isolation
    if (req.user.role === 'agent') {
      query.agent_id = req.user._id
    } else if (agent_id) {
      query.agent_id = agent_id
    }

    if (search) {
      const s = escapeRegex(search)
      query.$or = [
        { email: { $regex: s, $options: 'i' } },
        { first_name: { $regex: s, $options: 'i' } },
        { last_name: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } }
      ]
    }
    if (status) query.status = status
    if (device) query.register_device = device
    if (source) query.register_source = source

    const total = await User.countDocuments(query)
    const users = await User.find(query).sort('-createdAt').skip(skip).limit(limit).populate('agent_id', 'first_name last_name agent_code')

    // Stats (scoped to agent if agent role)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const statsBase = { role: 'customer' }
    if (req.user.role === 'agent') statsBase.agent_id = req.user._id

    const [totalAll, today, pc, mobile] = await Promise.all([
      User.countDocuments(statsBase),
      User.countDocuments({ ...statsBase, createdAt: { $gte: todayStart } }),
      User.countDocuments({ ...statsBase, register_device: 'pc' }),
      User.countDocuments({ ...statsBase, register_device: 'mobile' }),
    ])

    apiResponse(res, 200, 'ok', {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: { total: totalAll, today, pc, mobile },
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Create admin user (super admin only)
router.post('/admin', superAdminOnly, async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body
    if (!email || !password) return apiResponse(res, 400, '请输入邮箱和密码')
    if (password.length < 6) return apiResponse(res, 400, '密码最少6位')

    const exists = await User.findOne({ email })
    if (exists) return apiResponse(res, 400, '该邮箱已存在')

    const user = await User.create({ email, password, first_name, last_name, role: 'admin' })
    apiResponse(res, 200, 'ok', { user: user.toJSON() })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id }
    if (req.user.role === 'agent') query.agent_id = req.user._id
    const user = await User.findOne(query)
    if (!user) return apiResponse(res, 404, '用户不存在')
    apiResponse(res, 200, 'ok', { user })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update user
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['email', 'first_name', 'last_name', 'phone', 'status', 'role', 'note', 'tags']
    const update = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key]
    }
    // Agent cannot change role
    if (req.user.role === 'agent') delete update.role

    const query = { _id: req.params.id }
    if (req.user.role === 'agent') query.agent_id = req.user._id

    const user = await User.findOneAndUpdate(query, update, { new: true })
    if (!user) return apiResponse(res, 404, '用户不存在')
    apiResponse(res, 200, 'ok', { user })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Reset password
router.put('/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body
    if (!password || password.length < 6 || password.length > 15) {
      return apiResponse(res, 400, '密码长度为6-15位')
    }
    const query = { _id: req.params.id }
    if (req.user.role === 'agent') query.agent_id = req.user._id

    const user = await User.findOne(query)
    if (!user) return apiResponse(res, 404, '用户不存在')
    user.password = password
    await user.save()
    apiResponse(res, 200, '密码已重置')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Delete user (super admin only)
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return apiResponse(res, 400, '不能删除自己')
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return apiResponse(res, 404, '用户不存在')
    apiResponse(res, 200, '删除成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
