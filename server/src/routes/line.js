const router = require('express').Router()
const Line = require('../models/Line')
const User = require('../models/User')
const { apiResponse } = require('../utils/helper')

// Get next active LINE account for a given agent (or highest-weight agent if no ref)
router.get('/next', async (req, res) => {
  try {
    const { agent_code } = req.query
    let agentId = null

    if (agent_code) {
      const agent = await User.findOne({ agent_code: agent_code.toLowerCase(), role: 'agent', status: 'active' })
      if (agent) agentId = agent._id
    }

    if (!agentId) {
      const topAgent = await User.findOne({ role: 'agent', status: 'active' }).sort({ agent_weight: -1 })
      if (topAgent) agentId = topAgent._id
    }

    if (!agentId) return apiResponse(res, 404, 'No available LINE account')

    const item = await Line.findOne({ agent_id: agentId, status: 'active' })
      .sort({ click_count: 1, last_clicked_at: 1 })
    if (!item) return apiResponse(res, 404, 'No available LINE account')

    apiResponse(res, 200, 'ok', { line_url: item.line_url, id: item._id, name: item.name })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Record a click
router.post('/click', async (req, res) => {
  try {
    const { id } = req.body
    if (!id) return apiResponse(res, 400, 'Missing id')
    const item = await Line.findByIdAndUpdate(id, {
      $inc: { click_count: 1 },
      last_clicked_at: new Date()
    }, { new: true })
    if (!item) return apiResponse(res, 404, 'Not found')
    apiResponse(res, 200, 'ok', { line_url: item.line_url })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Report a LINE account as banned, return next from same agent
router.post('/report', async (req, res) => {
  try {
    const { id } = req.body
    if (!id) return apiResponse(res, 400, 'Missing id')
    const item = await Line.findById(id)
    if (!item) return apiResponse(res, 404, 'Not found')

    const agentId = item.agent_id
    if (item.status === 'active') {
      item.status = 'banned'
      item.banned_at = new Date()
      await item.save()
    }

    const next = await Line.findOne({ agent_id: agentId, status: 'active' })
      .sort({ click_count: 1, last_clicked_at: 1 })
    if (!next) return apiResponse(res, 404, 'No available LINE account')
    apiResponse(res, 200, 'ok', { line_url: next.line_url, id: next._id, name: next.name })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
