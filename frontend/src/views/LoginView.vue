<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import api from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const enabledProviders = ref([])

async function fetchProviders() {
  try {
    const res = await api.get('/auth/providers')
    enabledProviders.value = res.data.providers
  } catch {}
}

onMounted(fetchProviders)

function socialLogin(provider) {
  window.location.href = `${api.defaults.baseURL}/auth/${provider}`
}

async function handleLogin() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }
  loading.value = true
  try {
    const res = await api.post('/auth/login', {
      email: email.value,
      password: password.value,
    })
    userStore.login(res.data.user, res.data.token)
    router.push('/account')
  } catch (err) {
    error.value = err.response?.data?.msg || err.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Left: Brand Panel -->
    <div class="auth-brand">
      <div class="brand-content">
        <router-link to="/" class="brand-logo">SellForMe</router-link>
        <h2 class="brand-headline">Buy & Sell with<br/>Confidence</h2>
        <p class="brand-desc">Your trusted consignment marketplace. Every item is inspected and verified before listing, so you can shop with peace of mind.</p>
        <div class="brand-stats">
          <div class="brand-stat">
            <div class="brand-stat-num">50K+</div>
            <div class="brand-stat-label">Active Users</div>
          </div>
          <div class="brand-stat">
            <div class="brand-stat-num">100%</div>
            <div class="brand-stat-label">Inspected Items</div>
          </div>
          <div class="brand-stat">
            <div class="brand-stat-num">30-Day</div>
            <div class="brand-stat-label">Money Back</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Login Form -->
    <div class="auth-main">
      <div class="auth-card">
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-subtitle">Sign in to your account to continue</p>

        <!-- Social Buttons (dynamic from API) -->
        <div v-if="enabledProviders.length" class="social-grid" :class="{ 'single-col': enabledProviders.length <= 2 }">
          <button v-if="enabledProviders.includes('google')" class="social-btn social-google-btn" @click="socialLogin('google')">
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span>Google</span>
          </button>
          <button v-if="enabledProviders.includes('facebook')" class="social-btn social-facebook" @click="socialLogin('facebook')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span>Facebook</span>
          </button>
          <button v-if="enabledProviders.includes('amazon')" class="social-btn" @click="socialLogin('amazon')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF9900"><path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595.416-.16.764-.025.94.395.168.414-.012.784-.5.98C18.04 22.48 14.82 23.3 11.38 23.3c-4.476 0-8.53-1.2-12.16-3.6-.244-.16-.32-.356-.175-.68zm22.472-2.86c-.256-.336-.78-.5-1.556-.5-.78 0-1.46.248-2.04.744-.108.1-.06.2.06.236.396.104.78.156 1.14.156.396 0 .768-.06 1.116-.184.444-.16.636.1.576.432-.06.336-.384.696-.972.984-.588.288-1.212.432-1.872.432-.768 0-1.368-.216-1.8-.648-.108-.108-.204-.06-.288.072-.672 1.068-1.596 1.644-2.772 1.728-.072 0-.168-.024-.288-.072-1.14-.432-1.836-1.188-2.088-2.268-.036-.156-.108-.204-.216-.144-.768.432-1.584.648-2.448.648-.72 0-1.26-.18-1.62-.54a.663.663 0 0 1-.132-.204c-.048-.12-.048-.204 0-.252.516-.876 1.236-1.356 2.16-1.44.192-.024.408-.036.648-.036.48 0 .924.06 1.332.18.156.048.252.012.288-.108.24-.804.42-1.644.54-2.52.036-.264.012-.48-.072-.648-.264-.5-.8-.74-1.608-.74-.6 0-1.176.12-1.728.36-.108.048-.168.024-.18-.072-.012-.252.18-.468.576-.648.6-.264 1.272-.396 2.016-.396 1.092 0 1.8.384 2.124 1.152.048.108.108.144.18.108 1.08-.552 2.208-.828 3.384-.828.672 0 1.2.156 1.584.468.108.084.18.072.216-.036.168-.54.6-.876 1.296-1.008.108-.024.228-.036.36-.036.852 0 1.464.456 1.836 1.368.048.108.108.132.18.072.444-.372.972-.672 1.584-.9.108-.036.204-.012.288.072.288.264.18.624-.324 1.08z"/></svg>
            <span>Amazon</span>
          </button>
          <button v-if="enabledProviders.includes('paypal')" class="social-btn" @click="socialLogin('paypal')">
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.964L7.076 21.337z" fill="#253B80"/><path d="M18.429 7.534c-.983 5.05-4.349 6.797-8.647 6.797H7.95c-.564 0-1.04.408-1.13.964L5.11 23.89a.474.474 0 0 0 .468.548h3.293c.493 0 .913-.358.992-.843l.04-.213.787-4.998.051-.277a1.002 1.002 0 0 1 .992-.843h.625c4.047 0 7.216-1.643 8.14-6.396.387-1.987.187-3.643-.837-4.81a3.997 3.997 0 0 0-1.153-.916c.078.465.108.95.078 1.456-.024.144-.048.29-.078.438z" fill="#179BD7"/><path d="M17.304 7.032a8.542 8.542 0 0 0-1.047-.235 13.247 13.247 0 0 0-2.1-.155H9.254a.998.998 0 0 0-.992.843l-1.345 8.52-.039.249a1.13 1.13 0 0 1 1.13-.964h1.832c4.298 0 7.664-1.746 8.647-6.797.03-.149.053-.294.077-.437a5.086 5.086 0 0 0-1.17-.977.197.197 0 0 1-.09-.047z" fill="#222D65"/></svg>
            <span>PayPal</span>
          </button>
          <button v-if="enabledProviders.includes('linkedin')" class="social-btn social-linkedin" @click="socialLogin('linkedin')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            <span>LinkedIn</span>
          </button>
        </div>

        <div v-if="enabledProviders.length" class="social-divider">
          <span>or sign in with email</span>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label>Email address</label>
            <input v-model="email" type="email" placeholder="name@example.com" required />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input v-model="password" type="password" placeholder="Enter your password" required />
          </div>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" /> Remember me
            </label>
            <router-link to="/account/forgot-password" class="forgot-link">Forgot password?</router-link>
          </div>
          <button type="submit" class="btn btn-primary btn-lg auth-btn" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="auth-switch">
          Don't have an account? <router-link to="/account/register">Create one</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  min-height: 100vh;
}

/* Left Brand Panel */
.auth-brand {
  flex: 0 0 480px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;
}

.auth-brand::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
}

.auth-brand::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -30%;
  width: 80%;
  height: 80%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
}

.brand-content {
  position: relative;
  z-index: 1;
}

.brand-logo {
  font-size: 28px;
  font-weight: 800;
  color: white;
  letter-spacing: -0.5px;
  display: block;
  margin-bottom: 48px;
}

.brand-headline {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 20px;
  letter-spacing: -0.5px;
}

.brand-desc {
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255,255,255,0.7);
  margin-bottom: 48px;
  max-width: 360px;
}

.brand-stats {
  display: flex;
  gap: 32px;
}

.brand-stat-num {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}

.brand-stat-label {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
}

/* Right Form Panel */
.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #fafafa;
}

.auth-card {
  width: 100%;
  max-width: 480px;
}

.auth-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #111;
  letter-spacing: -0.3px;
}

.auth-subtitle {
  color: #6b7280;
  font-size: 15px;
  margin-bottom: 32px;
}

/* Social Grid */
.social-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 28px;
}

.social-grid .social-google-btn {
  grid-column: 1 / -1;
}

.social-grid.single-col {
  grid-template-columns: 1fr;
}

.social-grid.single-col .social-google-btn {
  grid-column: auto;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
}

.social-btn:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}

.social-facebook { background: #1877F2; color: white; border-color: #1877F2; }
.social-facebook:hover { background: #166fe5; border-color: #166fe5; }
.social-linkedin { background: #0A66C2; color: white; border-color: #0A66C2; }
.social-linkedin:hover { background: #095eb5; border-color: #095eb5; }
.social-paypal:hover { border-color: #253B80; }

/* Divider */
.social-divider {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.social-divider::before,
.social-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.social-divider span {
  font-size: 13px;
  color: #9ca3af;
  white-space: nowrap;
}

/* Error */
.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
  border: 1px solid #fecaca;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;
}

.form-group input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  outline: none;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
  color: #6b7280;
}

.forgot-link {
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 500;
}

.auth-btn {
  width: 100%;
  margin-top: 4px;
  padding: 14px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
}

.auth-switch {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin-top: 28px;
}

.auth-switch a {
  color: var(--color-primary);
  font-weight: 600;
}

/* Responsive */
@media (max-width: 960px) {
  .auth-brand {
    display: none;
  }
  .auth-main {
    padding: 24px 20px;
  }
}
</style>
