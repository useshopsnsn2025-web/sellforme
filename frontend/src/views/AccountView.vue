<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const sidebarLinks = [
  { title: 'Dashboard', path: '/account', icon: 'dashboard' },
  { title: 'My Orders', path: '/account/orders', icon: 'orders' },
  { title: 'Addresses', path: '/account/addresses', icon: 'address' },
  { title: 'Wishlist', path: '/account/wishlist', icon: 'heart' },
]

function logout() {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="account-page">
    <div class="container">
      <h1 class="page-title">My Account</h1>
      <div class="account-layout">
        <aside class="account-sidebar">
          <nav class="sidebar-nav">
            <router-link
              v-for="link in sidebarLinks"
              :key="link.path"
              :to="link.path"
              class="sidebar-link"
              :class="{ active: $route.path === link.path }"
            >
              <span class="sidebar-icon">
                <!-- Dashboard -->
                <svg v-if="link.icon === 'dashboard'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                <!-- Orders -->
                <svg v-else-if="link.icon === 'orders'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
                <!-- Address -->
                <svg v-else-if="link.icon === 'address'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <!-- Heart -->
                <svg v-else-if="link.icon === 'heart'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </span>
              {{ link.title }}
            </router-link>
            <button class="sidebar-link logout-btn" @click="logout">
              <span class="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </span>
              Sign Out
            </button>
          </nav>
        </aside>
        <main class="account-content">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-page { padding: 40px 0 80px; }
.page-title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: 32px; }
.account-layout { display: grid; grid-template-columns: 240px 1fr; gap: 40px; }
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; }
.sidebar-link { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text); transition: all var(--transition-fast); background: none; width: 100%; text-align: left; }
.sidebar-link:hover { background: var(--color-bg-gray); color: var(--color-primary); }
.sidebar-link.active { background: var(--color-primary-light); color: var(--color-primary); }
.sidebar-icon { font-size: 18px; }
.logout-btn { color: var(--color-danger); }
.logout-btn:hover { background: #fee2e2; color: var(--color-danger); }
@media (max-width: 768px) { .account-layout { grid-template-columns: 1fr; } }
</style>
