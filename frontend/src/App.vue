<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import CartSidebar from '@/components/layout/CartSidebar.vue'
import { useUserStore } from '@/store/user'
import { trackPageView } from '@/utils/tracker'

// Record first landing page for registration tracking
if (!sessionStorage.getItem('landing_page')) {
  sessionStorage.setItem('landing_page', window.location.pathname + window.location.search)
}

// Capture agent referral code from ?ref=xxx
const urlParams = new URLSearchParams(window.location.search)
const refCode = urlParams.get('ref')
if (refCode) {
  localStorage.setItem('agent_ref', refCode.toLowerCase())
}

// Restore user session on page load
const userStore = useUserStore()

// Handle OAuth callback token
const oauthToken = urlParams.get('oauth_token')
const oauthUser = urlParams.get('oauth_user')
if (oauthToken && oauthUser) {
  try {
    const userData = JSON.parse(oauthUser)
    userStore.login(userData, oauthToken)
  } catch {}
  // Clean URL
  window.history.replaceState({}, '', window.location.pathname)
} else {
  userStore.restoreSession()
}

// Track on initial load
trackPageView(window.location.pathname + window.location.search)

// Track on route change
const route = useRoute()
watch(() => route.fullPath, (newPath) => {
  trackPageView(newPath)
})
</script>

<template>
  <div id="app-wrapper">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
    <CartSidebar />
  </div>
</template>

<style>
.main-content {
  min-height: calc(100vh - var(--header-height) - var(--announcement-height) - 300px);
}
</style>
