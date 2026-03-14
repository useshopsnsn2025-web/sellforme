import api from './api'

// Visitor ID persists across sessions (localStorage)
function getVisitorId() {
  let vid = localStorage.getItem('visitor_id')
  if (!vid) {
    vid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('visitor_id', vid)
    return { vid, isNew: true }
  }
  return { vid, isNew: false }
}

// Session ID resets per browser session (sessionStorage)
function getSessionId() {
  let sid = sessionStorage.getItem('session_id')
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('session_id', sid)
  }
  return sid
}

// Track page enter time for duration calculation
let pageEnterTime = Date.now()
let currentUrl = ''

function getBasePayload() {
  return {
    agent_code: localStorage.getItem('agent_ref') || '',
    session_id: getSessionId(),
    is_new_visitor: getVisitorId().isNew,
    referrer: document.referrer || '',
  }
}

// Send tracking event
function track(event_type, extra = {}) {
  const payload = {
    ...getBasePayload(),
    event_type,
    url: extra.url || window.location.pathname + window.location.search,
    ...extra,
  }
  // Remove undefined values
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
  api.post('/traffic/track', payload).catch(() => {})
}

// Track page view — called on route change
export function trackPageView(url) {
  // Send page_leave for previous page
  if (currentUrl) {
    const duration = Math.round((Date.now() - pageEnterTime) / 1000)
    if (duration > 0 && duration < 3600) {
      track('page_leave', { url: currentUrl, duration })
    }
  }
  // Record new page enter
  currentUrl = url
  pageEnterTime = Date.now()
  track('page_view', { url })
}

// Track add to cart event
export function trackAddToCart(product) {
  track('add_to_cart', {
    product_id: product?._id || product?.id || '',
    product_title: product?.title || '',
  })
}

// Track checkout event
export function trackCheckout() {
  track('checkout')
}

// Track purchase event
export function trackPurchase() {
  track('purchase')
}

// Send page_leave on tab close / navigate away
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (currentUrl) {
      const duration = Math.round((Date.now() - pageEnterTime) / 1000)
      if (duration > 0 && duration < 3600) {
        const payload = {
          ...getBasePayload(),
          event_type: 'page_leave',
          url: currentUrl,
          duration,
        }
        // Use sendBeacon for reliable delivery on page close
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
        const apiBase = api.defaults?.baseURL || '/api'
        navigator.sendBeacon(`${apiBase}/traffic/track`, blob)
      }
    }
  })
}
