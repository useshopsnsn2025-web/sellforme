const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { apiResponse } = require('../utils/helper')
const { adminAuth } = require('../middleware/auth')

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return apiResponse(res, 400, '请输入邮箱和密码')

    const user = await User.findOne({ email, role: { $in: ['admin', 'agent'] } })
    if (!user) return apiResponse(res, 401, '账号或密码错误')
    if (user.status !== 'active') return apiResponse(res, 401, '账号已被禁用')

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return apiResponse(res, 401, '账号或密码错误')

    user.last_login = new Date()
    await user.save()

    const token = jwt.sign({ id: user._id }, process.env.ADMIN_JWT_SECRET, { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN })
    apiResponse(res, 200, 'ok', { token, user: user.toJSON() })
  } catch (err) {
    apiResponse(res, 500, process.env.NODE_ENV === 'production' ? '登录失败' : err.message)
  }
})

// Get current admin info
router.get('/me', adminAuth, async (req, res) => {
  apiResponse(res, 200, 'ok', { user: req.user.toJSON() })
})

// Change password
router.put('/password', adminAuth, async (req, res) => {
  try {
    const { old_password, new_password } = req.body
    const isMatch = await req.user.comparePassword(old_password)
    if (!isMatch) return apiResponse(res, 400, '原密码错误')
    if (!new_password || new_password.length < 8) return apiResponse(res, 400, '新密码至少8位')

    req.user.password = new_password
    await req.user.save()
    apiResponse(res, 200, '密码修改成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Initialize default admin (run once, requires init_secret or first-time setup)
router.post('/init', async (req, res) => {
  try {
    const exists = await User.findOne({ role: 'admin' })
    if (exists) return apiResponse(res, 400, '管理员已存在，无法重复初始化')

    const { email, password, init_secret } = req.body
    // In production, require INIT_SECRET env var to prevent unauthorized creation
    const requiredSecret = process.env.INIT_SECRET
    if (requiredSecret && init_secret !== requiredSecret) {
      return apiResponse(res, 403, '初始化密钥错误')
    }

    if (!email || !password) return apiResponse(res, 400, '请输入管理员邮箱和密码')
    if (password.length < 8) return apiResponse(res, 400, '密码至少8位')

    const admin = await User.create({
      email,
      password,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    })
    apiResponse(res, 200, '管理员创建成功', { email: admin.email })
  } catch (err) {
    apiResponse(res, 500, process.env.NODE_ENV === 'production' ? '初始化失败' : err.message)
  }
})

module.exports = router
