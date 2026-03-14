<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import api from '@/utils/api'

const userStore = useUserStore()
const ordersCount = ref(0)
const addressesCount = ref(0)
const recentOrders = ref([])

async function fetchDashboard() {
  try {
    const [ordersRes, addrRes] = await Promise.all([
      api.get('/orders/my'),
      api.get('/auth/addresses'),
    ])
    const orders = ordersRes.data.orders || []
    ordersCount.value = orders.length
    recentOrders.value = orders.slice(0, 3)
    addressesCount.value = (addrRes.data.addresses || []).length
  } catch {}
}

function statusClass(status) {
  const s = (status || '').toLowerCase()
  if (s === 'shipped' || s === 'in_transit') return 'shipped'
  if (s === 'delivered' || s === 'completed') return 'delivered'
  if (s === 'cancelled' || s === 'refunded') return 'cancelled'
  return 'pending'
}

onMounted(fetchDashboard)
</script>

<template>
  <div class="dashboard">
    <h2 class="section-title">Welcome back, {{ userStore.user?.first_name || 'there' }}!</h2>
    <p class="welcome-text">Manage your account, view orders, and track shipments.</p>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
        </span>
        <div class="stat-info">
          <span class="stat-number">{{ ordersCount }}</span>
          <span class="stat-label">Orders</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </span>
        <div class="stat-info">
          <span class="stat-number">{{ userStore.wishlist.length }}</span>
          <span class="stat-label">Wishlist</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </span>
        <div class="stat-info">
          <span class="stat-number">{{ addressesCount }}</span>
          <span class="stat-label">Addresses</span>
        </div>
      </div>
    </div>

    <div class="recent-orders">
      <h3>Recent Orders</h3>
      <div v-if="recentOrders.length" class="orders-list">
        <div v-for="order in recentOrders" :key="order._id" class="order-row">
          <span class="order-id">{{ order.order_number || '#' + order._id.slice(-8) }}</span>
          <span class="order-status" :class="statusClass(order.status)">{{ order.status || 'Pending' }}</span>
          <span class="order-total">${{ (order.total_price || 0).toFixed(2) }}</span>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No recent orders. <router-link to="/products">Start shopping</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title { font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 8px; }
.welcome-text { color: var(--color-text-light); font-size: var(--font-size-sm); margin-bottom: 32px; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 40px; }
.stat-card { display: flex; align-items: center; gap: 14px; padding: 20px; background: var(--color-bg-light); border-radius: var(--radius-md); }
.stat-icon { color: var(--color-text-light); }
.stat-number { display: block; font-size: var(--font-size-xl); font-weight: 700; }
.stat-label { font-size: var(--font-size-xs); color: var(--color-text-light); }
.recent-orders h3 { font-size: var(--font-size-base); font-weight: 600; margin-bottom: 16px; }
.orders-list { display: flex; flex-direction: column; gap: 8px; }
.order-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--color-bg-light); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
.order-id { font-weight: 600; }
.order-status { padding: 2px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; text-transform: capitalize; }
.order-status.shipped { background: #dbeafe; color: #1d4ed8; }
.order-status.delivered { background: #dcfce7; color: #16a34a; }
.order-status.pending { background: #fef3c7; color: #d97706; }
.order-status.cancelled { background: #fee2e2; color: #dc2626; }
.order-total { font-weight: 700; }
.empty-state { padding: 40px; text-align: center; background: var(--color-bg-light); border-radius: var(--radius-md); color: var(--color-text-light); font-size: var(--font-size-sm); }
.empty-state a { color: var(--color-primary); font-weight: 600; }
</style>
