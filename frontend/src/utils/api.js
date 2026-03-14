import axios from 'axios'

// In production VITE_SERVER_BASE is empty → same-origin relative URL
// In development VITE_SERVER_BASE is http://127.0.0.1:3100
const SERVER_BASE = import.meta.env.VITE_SERVER_BASE || ''

const api = axios.create({
  baseURL: SERVER_BASE + '/api',
  timeout: 30000,
})

// Request interceptor - add token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor - unwrap { code, msg, data }
api.interceptors.response.use(
  response => {
    const { code, msg, data } = response.data
    if (code === 200) return { data, msg }
    return Promise.reject(new Error(msg || '请求失败'))
  },
  error => Promise.reject(error)
)

/**
 * Convert relative URL to full server URL
 * e.g. /uploads/xxx.jpg → http://127.0.0.1:3100/uploads/xxx.jpg
 */
export function fullUrl(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : SERVER_BASE + url
}

export default api
