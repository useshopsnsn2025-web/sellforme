const router = require('express').Router()
const SiteConfig = require('../models/SiteConfig')
const { apiResponse } = require('../utils/helper')
const { adminAuth, superAdminOnly } = require('../middleware/auth')
const { getTransporter, sendEmail, getEmailConfig } = require('../utils/email')

router.use(adminAuth)
router.use(superAdminOnly)

// Default welcome email template
const DEFAULT_WELCOME_TPL = `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
  <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:28px">Welcome to {{site_name}}!</h1>
  </div>
  <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none">
    <p style="font-size:16px;line-height:1.6">Hi <strong>{{name}}</strong>,</p>
    <p style="font-size:15px;line-height:1.6;color:#555">Thank you for creating an account with us. We're excited to have you on board!</p>
    <p style="font-size:15px;line-height:1.6;color:#555">With your new account, you can:</p>
    <ul style="font-size:14px;line-height:2;color:#555">
      <li>Browse our latest products and exclusive deals</li>
      <li>Track your orders in real-time</li>
      <li>Save your favorite items to your wishlist</li>
      <li>Enjoy a faster checkout experience</li>
    </ul>
    <div style="text-align:center;margin:30px 0">
      <a href="{{site_url}}" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:14px 40px;text-decoration:none;border-radius:25px;font-size:16px;font-weight:600;display:inline-block">Start Shopping</a>
    </div>
    <p style="font-size:14px;color:#888;border-top:1px solid #eee;padding-top:20px;margin-top:30px">If you have any questions, feel free to contact our support team. We're here to help!</p>
  </div>
  <div style="text-align:center;padding:20px;color:#999;font-size:12px">
    <p>&copy; {{site_name}}. All rights reserved.</p>
  </div>
</div>`

// Default order confirmation template
const DEFAULT_ORDER_TPL = `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
  <div style="background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);padding:40px 30px;text-align:center;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:28px">Order Confirmed!</h1>
    <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:16px">Order #{{order_number}}</p>
  </div>
  <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none">
    <p style="font-size:16px;line-height:1.6">Hi <strong>{{name}}</strong>,</p>
    <p style="font-size:15px;line-height:1.6;color:#555">Thank you for your purchase! Your order has been confirmed and is being processed.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <thead><tr style="background:#f9fafb"><th style="padding:10px;text-align:left;border-bottom:2px solid #e5e7eb">Item</th><th style="padding:10px;text-align:center;border-bottom:2px solid #e5e7eb">Qty</th><th style="padding:10px;text-align:right;border-bottom:2px solid #e5e7eb">Price</th></tr></thead>
      <tbody>{{order_items}}</tbody>
    </table>
    <div style="text-align:right;font-size:18px;font-weight:700;padding:15px 0;border-top:2px solid #e5e7eb">Total: {{order_total}}</div>
    <div style="text-align:center;margin:25px 0">
      <a href="{{site_url}}/tracking" style="background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#fff;padding:14px 40px;text-decoration:none;border-radius:25px;font-size:16px;font-weight:600;display:inline-block">Track Your Order</a>
    </div>
  </div>
  <div style="text-align:center;padding:20px;color:#999;font-size:12px">
    <p>&copy; {{site_name}}. All rights reserved.</p>
  </div>
</div>`

// Default config items (auto-created if missing)
const DEFAULTS = [
  { key: 'site_url', value: '', label: '前端站点URL', group: 'general' },
  { key: 'site_name', value: 'SellForMe', label: '站点名称', group: 'general' },
  { key: 'contact_method', value: 'whatsapp', label: '前端联系方式 (whatsapp/line)', group: 'general' },
  // Email SMTP
  { key: 'smtp_host', value: '', label: 'SMTP服务器地址', group: 'email' },
  { key: 'smtp_port', value: '587', label: 'SMTP端口', group: 'email' },
  { key: 'smtp_secure', value: 'false', label: 'SMTP SSL/TLS (true/false)', group: 'email' },
  { key: 'smtp_user', value: '', label: 'SMTP用户名', group: 'email' },
  { key: 'smtp_pass', value: '', label: 'SMTP密码/授权码', group: 'email' },
  { key: 'email_from_name', value: 'SellForMe', label: '发件人名称', group: 'email' },
  { key: 'email_from_address', value: '', label: '发件人邮箱', group: 'email' },
  // Email templates
  { key: 'email_tpl_welcome', value: DEFAULT_WELCOME_TPL, label: '注册欢迎邮件模板', group: 'email_template' },
  { key: 'email_tpl_order', value: DEFAULT_ORDER_TPL, label: '订单确认邮件模板', group: 'email_template' },
]

// Get all configs
router.get('/', async (req, res) => {
  try {
    // Auto-init missing defaults
    for (const def of DEFAULTS) {
      await SiteConfig.findOneAndUpdate(
        { key: def.key },
        { $setOnInsert: def },
        { upsert: true, new: true }
      )
    }
    const configs = await SiteConfig.find().sort('group key')
    apiResponse(res, 200, 'ok', { configs })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update configs (batch)
router.put('/', async (req, res) => {
  try {
    const { configs } = req.body
    if (!configs || typeof configs !== 'object') return apiResponse(res, 400, '参数错误')

    for (const [key, value] of Object.entries(configs)) {
      await SiteConfig.findOneAndUpdate({ key }, { value }, { upsert: true })
    }
    const all = await SiteConfig.find().sort('group key')
    apiResponse(res, 200, 'ok', { configs: all })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// POST /api/admin/site-config/test-email — send a test email
router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body
    if (!to) return apiResponse(res, 400, '请输入收件邮箱')

    // Verify SMTP connection first
    const t = await getTransporter()
    await t.verify()

    await sendEmail({
      to,
      subject: 'Test Email - SellForMe',
      html: '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;padding:40px;text-align:center"><h2 style="color:#667eea">SMTP Configuration Successful!</h2><p style="color:#555;font-size:15px">This is a test email from your SellForMe store. If you received this, your email settings are working correctly.</p></div>',
    })

    apiResponse(res, 200, '测试邮件发送成功')
  } catch (err) {
    apiResponse(res, 500, `发送失败: ${err.message}`)
  }
})

module.exports = router
