const jwt = require('jsonwebtoken')
const { apiResponse } = require('../utils/helper')
const User = require('../models/User')

// Customer auth
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return apiResponse(res, 401, 'Token-Error，请重新获取授权')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user || user.status !== 'active') return apiResponse(res, 401, '用户不存在或已被禁用')
    req.user = user
    next()
  } catch {
    return apiResponse(res, 401, 'Token-Error，请重新获取授权')
  }
}

// Admin auth (admin + agent both allowed)
async function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return apiResponse(res, 401, 'Token-Error，请重新获取授权')

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user || !['admin', 'agent'].includes(user.role)) return apiResponse(res, 403, '无权限访问')
    if (user.status !== 'active') return apiResponse(res, 403, '账号已被禁用')
    req.user = user
    next()
  } catch {
    return apiResponse(res, 401, 'Token-Error，请重新获取授权')
  }
}

// Super admin only (agent management, system config, etc.)
function superAdminOnly(req, res, next) {
  if (req.user.role !== 'admin') return apiResponse(res, 403, '仅主管理员可操作')
  next()
}

// Helper: get agent filter for data isolation
function getAgentFilter(user) {
  if (user.role === 'agent') return { agent_id: user._id }
  return {}
}

module.exports = { authMiddleware, adminAuth, superAdminOnly, getAgentFilter }
