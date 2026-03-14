/**
 * Extract client info from request headers
 */

function getClientIP(req) {
  let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || req.ip
    || ''
  // Normalize IPv6 localhost to IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1'
  // Strip IPv6-mapped IPv4 prefix
  if (ip.startsWith('::ffff:')) ip = ip.slice(7)
  return ip
}

function parseUA(ua) {
  if (!ua) return { browser: '', os: '', device: 'unknown' }

  // Detect OS
  let os = ''
  if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11'
  else if (/Windows NT/i.test(ua)) os = 'Windows'
  else if (/Mac OS X/i.test(ua)) os = 'macOS'
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Linux/i.test(ua)) os = 'Linux'
  else if (/CrOS/i.test(ua)) os = 'ChromeOS'

  // Detect browser
  let browser = ''
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera'
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Browser'
  else if (/UCBrowser/i.test(ua)) browser = 'UC Browser'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'
  else if (/Chrome\//i.test(ua)) browser = 'Chrome'
  else if (/Safari\//i.test(ua)) browser = 'Safari'
  else if (/MSIE|Trident/i.test(ua)) browser = 'IE'

  // Detect device type
  let device = 'pc'
  if (/iPad|tablet|PlayBook|Silk/i.test(ua) && !/Mobile/i.test(ua)) {
    device = 'tablet'
  } else if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) {
    device = 'mobile'
  }

  return { browser, os, device }
}

function extractClientInfo(req) {
  const ua = req.headers['user-agent'] || ''
  const { browser, os, device } = parseUA(ua)
  const ip = getClientIP(req)
  const language = req.headers['accept-language']?.split(',')[0] || ''

  return { ip, ua, browser, os, device, language }
}

module.exports = { getClientIP, parseUA, extractClientInfo }
