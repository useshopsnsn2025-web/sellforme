const router = require('express').Router()
const WhatsApp = require('../models/WhatsApp')
const User = require('../models/User')
const { apiResponse } = require('../utils/helper')

// Get next active WhatsApp number for a given agent (or highest-weight agent if no ref)
router.get('/next', async (req, res) => {
  try {
    const { agent_code } = req.query
    let agentId = null

    if (agent_code) {
      const agent = await User.findOne({ agent_code: agent_code.toLowerCase(), role: 'agent', status: 'active' })
      if (agent) agentId = agent._id
    }

    // If no agent_code or agent not found, pick the agent with highest weight
    if (!agentId) {
      const topAgent = await User.findOne({ role: 'agent', status: 'active' }).sort({ agent_weight: -1 })
      if (topAgent) agentId = topAgent._id
    }

    if (!agentId) return apiResponse(res, 404, 'No available WhatsApp number')

    // Round-robin: pick the one with least clicks
    const item = await WhatsApp.findOne({ agent_id: agentId, status: 'active' })
      .sort({ click_count: 1, last_clicked_at: 1 })
    if (!item) return apiResponse(res, 404, 'No available WhatsApp number')

    apiResponse(res, 200, 'ok', { phone: item.phone, id: item._id, name: item.name })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Record a click and return the phone number
router.post('/click', async (req, res) => {
  try {
    const { id } = req.body
    if (!id) return apiResponse(res, 400, 'Missing id')
    const item = await WhatsApp.findByIdAndUpdate(id, {
      $inc: { click_count: 1 },
      last_clicked_at: new Date()
    }, { new: true })
    if (!item) return apiResponse(res, 404, 'Not found')
    apiResponse(res, 200, 'ok', { phone: item.phone })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Report a number as banned, return next from same agent
router.post('/report', async (req, res) => {
  try {
    const { id } = req.body
    if (!id) return apiResponse(res, 400, 'Missing id')
    const item = await WhatsApp.findById(id)
    if (!item) return apiResponse(res, 404, 'Not found')

    const agentId = item.agent_id
    if (item.status === 'active') {
      item.status = 'banned'
      item.banned_at = new Date()
      await item.save()
    }

    // Return next available number from same agent
    const next = await WhatsApp.findOne({ agent_id: agentId, status: 'active' })
      .sort({ click_count: 1, last_clicked_at: 1 })
    if (!next) return apiResponse(res, 404, 'No available WhatsApp number')
    apiResponse(res, 200, 'ok', { phone: next.phone, id: next._id, name: next.name })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
