<script setup>
import { ref } from 'vue'

const email = ref('')
const sent = ref(false)

function handleReset() {
  if (email.value.trim()) {
    sent.value = true
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <template v-if="!sent">
        <h1 class="auth-title">Reset Password</h1>
        <p class="auth-subtitle">Enter your email and we'll send you a reset link.</p>
        <form @submit.prevent="handleReset" class="auth-form">
          <div class="form-group">
            <label>Email Address</label>
            <input v-model="email" type="email" placeholder="Enter your email" required />
          </div>
          <button type="submit" class="btn btn-primary btn-lg auth-btn">Send Reset Link</button>
        </form>
      </template>
      <template v-else>
        <div class="success-state text-center">
          <div class="success-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></div>
          <h2>Check Your Email</h2>
          <p>We've sent a password reset link to <strong>{{ email }}</strong></p>
        </div>
      </template>
      <p class="auth-switch">
        <router-link to="/account/login">← Back to Sign In</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 60px 20px; }
.auth-card { width: 100%; max-width: 440px; background: white; padding: 40px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }
.auth-title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: 8px; }
.auth-subtitle { color: var(--color-text-light); font-size: var(--font-size-sm); margin-bottom: 32px; }
.auth-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; }
.form-group input { padding: 12px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.form-group input:focus { border-color: var(--color-primary); }
.auth-btn { width: 100%; }
.auth-switch { text-align: center; font-size: var(--font-size-sm); margin-top: 24px; }
.auth-switch a { color: var(--color-primary); font-weight: 600; }
.success-state { padding: 20px 0 30px; }
.success-icon { font-size: 48px; margin-bottom: 16px; }
.success-state h2 { font-size: var(--font-size-xl); margin-bottom: 12px; }
.success-state p { color: var(--color-text-light); font-size: var(--font-size-sm); }
</style>
