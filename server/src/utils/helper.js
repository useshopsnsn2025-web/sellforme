const crypto = require('crypto')

// Generate trace_id matching pypipi.com format
function traceId() {
  return crypto.randomUUID().replace(/-/g, '')
}

// Standard API response matching pypipi.com format: {code, msg, data, trace_id}
function apiResponse(res, code = 200, msg = 'ok', data = null) {
  const statusCode = code >= 100 && code < 600 ? code : 200
  return res.status(statusCode).json({
    code,
    msg,
    data,
    trace_id: traceId()
  })
}

// Generate product ID with 'm' prefix like pypipi.com
function generateProductId() {
  return 'm' + Date.now() + Math.floor(Math.random() * 1000)
}

// Escape special regex characters to prevent MongoDB $regex injection
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Safe pagination: enforce max limit
function safePagination(query, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(Math.max(1, parseInt(query.limit) || 20), maxLimit)
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

module.exports = { traceId, apiResponse, generateProductId, escapeRegex, safePagination }
