import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/admin',
  timeout: 30000
})

// Request interceptor - add token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor
api.interceptors.response.use(
  response => {
    // Blob responses (file downloads) bypass JSON parsing
    if (response.config.responseType === 'blob') return response
    const { code, msg, data } = response.data
    if (code === 200) return response.data
    ElMessage.error(msg || '请求失败')
    return Promise.reject(new Error(msg))
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(error.response?.data?.msg || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default api
