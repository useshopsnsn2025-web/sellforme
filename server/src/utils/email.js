const nodemailer = require('nodemailer')
const SiteConfig = require('../models/SiteConfig')

let transporter = null

// Get email config from SiteConfig DB
async function getEmailConfig() {
  const keys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'email_from_name', 'email_from_address']
  const configs = await SiteConfig.find({ key: { $in: keys } })
  const map = {}
  for (const c of configs) map[c.key] = c.value
  return map
}

// Create or refresh transporter
async function getTransporter() {
  const cfg = await getEmailConfig()
  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) {
    throw new Error('邮件服务未配置，请在系统设置中配置SMTP信息')
  }
  transporter = nodemailer.createTransport({
    host: cfg.smtp_host,
    port: Number(cfg.smtp_port) || 587,
    secure: cfg.smtp_secure === 'true' || cfg.smtp_secure === true,
    auth: {
      user: cfg.smtp_user,
      pass: cfg.smtp_pass,
    },
  })
  transporter._fromName = cfg.email_from_name || 'SellForMe'
  transporter._fromAddress = cfg.email_from_address || cfg.smtp_user
  return transporter
}

// Send email
async function sendEmail({ to, subject, html }) {
  const t = await getTransporter()
  return t.sendMail({
    from: `"${t._fromName}" <${t._fromAddress}>`,
    to,
    subject,
    html,
  })
}

// Get email template from SiteConfig
async function getTemplate(key) {
  const cfg = await SiteConfig.findOne({ key })
  return cfg?.value || ''
}

// HTML-escape to prevent XSS in email templates
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Replace template variables {{var}} with HTML-escaped values
function renderTemplate(template, vars = {}) {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escapeHtml(value))
  }
  return result
}

// Send welcome email to new user
async function sendWelcomeEmail(user) {
  try {
    const template = await getTemplate('email_tpl_welcome')
    if (!template) {
      console.log('Welcome email template not configured, skipping.')
      return
    }

    const siteName = (await SiteConfig.findOne({ key: 'site_name' }))?.value || 'SellForMe'
    const siteUrl = (await SiteConfig.findOne({ key: 'site_url' }))?.value || ''

    const html = renderTemplate(template, {
      name: user.first_name || user.email.split('@')[0],
      email: user.email,
      site_name: siteName,
      site_url: siteUrl,
    })

    await sendEmail({
      to: user.email,
      subject: `Welcome to ${siteName}!`,
      html,
    })
    console.log(`Welcome email sent to ${user.email}`)
  } catch (err) {
    console.error('Failed to send welcome email:', err.message)
  }
}

// Send order confirmation email
async function sendOrderEmail(order) {
  try {
    const template = await getTemplate('email_tpl_order')
    if (!template) return

    const siteName = (await SiteConfig.findOne({ key: 'site_name' }))?.value || 'SellForMe'
    const siteUrl = (await SiteConfig.findOne({ key: 'site_url' }))?.value || ''

    const itemsHtml = (order.line_items || []).map(item =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.title}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${item.price?.toFixed(2)}</td></tr>`
    ).join('')

    const html = renderTemplate(template, {
      name: order.shipping_address?.first_name || order.email?.split('@')[0] || 'Customer',
      email: order.email,
      order_number: order.order_number || order._id,
      order_total: `$${order.total_price?.toFixed(2)}`,
      order_items: itemsHtml,
      site_name: siteName,
      site_url: siteUrl,
    })

    await sendEmail({
      to: order.email,
      subject: `Order Confirmed #${order.order_number || order._id} - ${siteName}`,
      html,
    })
    console.log(`Order email sent to ${order.email}`)
  } catch (err) {
    console.error('Failed to send order email:', err.message)
  }
}

module.exports = { sendEmail, sendWelcomeEmail, sendOrderEmail, getEmailConfig, getTransporter, getTemplate, renderTemplate }
