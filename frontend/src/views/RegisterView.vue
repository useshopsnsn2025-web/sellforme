<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import api from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// Collect UTM params from URL
function getUTM() {
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || '',
  }
}

async function handleRegister() {
  error.value = ''
  if (!firstName.value || !lastName.value || !email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }
  if (password.value.length < 6 || password.value.length > 15) {
    error.value = 'Password length should be between 6-15 characters'
    return
  }
  loading.value = true
  try {
    const utm = getUTM()
    const res = await api.post('/auth/register', {
      email: email.value,
      password: password.value,
      first_name: firstName.value,
      last_name: lastName.value,
      referrer: document.referrer || '',
      landing_page: sessionStorage.getItem('landing_page') || window.location.pathname,
      agent_code: localStorage.getItem('agent_ref') || '',
      ...utm,
    })
    userStore.login(res.data.user, res.data.token)
    router.push('/account')
  } catch (err) {
    error.value = err.response?.data?.msg || err.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Create Account</h1>
      <p class="auth-subtitle">Join us and start shopping for great deals.</p>

      <div v-if="error" class="error-msg">{{ error }}</div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-row-2">
          <div class="form-group">
            <label>First Name</label>
            <input v-model="firstName" type="text" placeholder="First name" required />
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input v-model="lastName" type="text" placeholder="Last name" required />
          </div>
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input v-model="email" type="email" placeholder="Enter your email" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="6-15 characters" required />
        </div>
        <button type="submit" class="btn btn-primary btn-lg auth-btn" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="auth-switch">
        Already have an account? <router-link to="/account/login">Sign In</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 60px 20px; }
.auth-card { width: 100%; max-width: 520px; background: white; padding: 48px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }
.auth-title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: 8px; }
.auth-subtitle { color: var(--color-text-light); font-size: var(--font-size-sm); margin-bottom: 32px; }
.error-msg { background: #fee2e2; color: #dc2626; padding: 10px 14px; border-radius: var(--radius-sm); font-size: var(--font-size-sm); margin-bottom: 20px; }
.auth-form { display: flex; flex-direction: column; gap: 20px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; }
.form-group input { padding: 12px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); transition: border-color var(--transition-fast); }
.form-group input:focus { border-color: var(--color-primary); }
.auth-btn { width: 100%; margin-top: 8px; }
.auth-switch { text-align: center; font-size: var(--font-size-sm); color: var(--color-text-light); margin-top: 24px; }
.auth-switch a { color: var(--color-primary); font-weight: 600; }
</style>
