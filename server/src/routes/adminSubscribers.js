const router = require('express').Router()
const Subscriber = require('../models/Subscriber')
const EmailCampaign = require('../models/EmailCampaign')
const SiteConfig = require('../models/SiteConfig')
const { apiResponse, escapeRegex, safePagination } = require('../utils/helper')
const { adminAuth } = require('../middleware/auth')
const { sendEmail } = require('../utils/email')
const { generateUnsubToken } = require('./subscribe')

router.use(adminAuth)

// GET /api/admin/subscribers — list all subscribers
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query
    const { page, limit, skip } = safePagination(req.query)
    const query = {}
    if (status) query.status = status
    if (search) query.email = { $regex: escapeRegex(search), $options: 'i' }

    const total = await Subscriber.countDocuments(query)
    const list = await Subscriber.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    return apiResponse(res, 200, 'ok', { total, list })
  } catch (err) {
    return apiResponse(res, 500, err.message)
  }
})

// GET /api/admin/subscribers/stats
router.get('/stats', async (req, res) => {
  try {
    const total = await Subscriber.countDocuments()
    const active = await Subscriber.countDocuments({ status: 'active' })
    const unsubscribed = await Subscriber.countDocuments({ status: 'unsubscribed' })

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recent = await Subscriber.countDocuments({ createdAt: { $gte: since } })

    const campaignCount = await EmailCampaign.countDocuments()
    const lastCampaign = await EmailCampaign.findOne({ status: 'sent' }).sort({ sent_at: -1 }).lean()

    return apiResponse(res, 200, 'ok', { total, active, unsubscribed, recent, campaignCount, lastCampaign })
  } catch (err) {
    return apiResponse(res, 500, err.message)
  }
})

// DELETE /api/admin/subscribers/:id
router.delete('/:id', async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id)
    return apiResponse(res, 200, 'Deleted')
  } catch (err) {
    return apiResponse(res, 500, err.message)
  }
})

// ===== Email Campaign APIs =====

// GET /api/admin/subscribers/campaigns — list campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const total = await EmailCampaign.countDocuments()
    const list = await EmailCampaign.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()
    return apiResponse(res, 200, 'ok', { total, list })
  } catch (err) {
    return apiResponse(res, 500, err.message)
  }
})

// POST /api/admin/subscribers/campaigns — create & send campaign
router.post('/campaigns', async (req, res) => {
  try {
    const { subject, content, type = 'custom', target = 'active_only' } = req.body
    if (!subject || !content) return apiResponse(res, 400, '请填写邮件主题和内容')

    // Get subscribers
    const filter = target === 'active_only' ? { status: 'active' } : {}
    const subscribers = await Subscriber.find(filter).select('email').lean()
    if (!subscribers.length) return apiResponse(res, 400, '没有可发送的订阅者')

    // Create campaign record
    const campaign = await EmailCampaign.create({
      subject,
      content,
      type,
      target,
      status: 'sending',
      total_count: subscribers.length,
      sent_count: 0,
      fail_count: 0,
      created_by: req.user._id,
    })

    // Respond immediately, send in background
    apiResponse(res, 200, `开始发送，共 ${subscribers.length} 封邮件`, { campaign })

    // Get site config for unsubscribe link
    const siteUrl = (await SiteConfig.findOne({ key: 'site_url' }))?.value || ''

    // Send emails in background
    let sent = 0, failed = 0
    for (const sub of subscribers) {
      try {
        const unsubToken = generateUnsubToken(sub.email)
        const unsubLink = `${siteUrl ? siteUrl.replace(/\/$/, '') : ''}/api/subscribe/unsubscribe?email=${encodeURIComponent(sub.email)}&token=${unsubToken}`
        const fullHtml = `${content}
          <div style="text-align:center;padding:20px;margin-top:20px;border-top:1px solid #eee">
            <a href="${unsubLink}" style="color:#999;font-size:12px;text-decoration:underline">Unsubscribe</a>
          </div>`
        await sendEmail({ to: sub.email, subject, html: fullHtml })
        sent++
      } catch {
        failed++
      }
      // Update progress every 10 emails
      if ((sent + failed) % 10 === 0) {
        await EmailCampaign.findByIdAndUpdate(campaign._id, { sent_count: sent, fail_count: failed })
      }
    }

    // Final update
    await EmailCampaign.findByIdAndUpdate(campaign._id, {
      status: failed === subscribers.length ? 'failed' : 'sent',
      sent_count: sent,
      fail_count: failed,
      sent_at: new Date(),
    })
    console.log(`Campaign "${subject}" done: ${sent} sent, ${failed} failed`)
  } catch (err) {
    return apiResponse(res, 500, err.message)
  }
})

// DELETE /api/admin/subscribers/campaigns/:id
router.delete('/campaigns/:id', async (req, res) => {
  try {
    await EmailCampaign.findByIdAndDelete(req.params.id)
    return apiResponse(res, 200, 'Deleted')
  } catch (err) {
    return apiResponse(res, 500, err.message)
  }
})

module.exports = router
