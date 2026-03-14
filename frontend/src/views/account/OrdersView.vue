<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const orders = ref([])
const loading = ref(true)

function statusLabel(order) {
  if (order.cancelled_at) return 'Cancelled'
  if (order.fulfillment_status === 'fulfilled') return 'Delivered'
  if (order.fulfillment_status === 'partial') return 'Shipped'
  if (order.financial_status === 'paid') return 'Processing'
  if (order.financial_status === 'refunded') return 'Refunded'
  return 'Pending'
}

function statusClass(order) {
  const label = statusLabel(order).toLowerCase()
  if (label === 'delivered') return 'delivered'
  if (label === 'shipped' || label === 'processing') return 'shipped'
  if (label === 'cancelled' || label === 'refunded') return 'cancelled'
  return 'pending'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchOrders() {
  try {
    const res = await api.get('/orders/my')
    orders.value = res.data.orders || []
  } catch {} finally {
    loading.value = false
  }
}

onMounted(fetchOrders)
</script>

<template>
  <div class="orders-page">
    <h2 class="section-title">My Orders</h2>

    <div v-if="loading" class="loading-state">Loading...</div>

    <div v-else-if="orders.length" class="orders-list">
      <div v-for="order in orders" :key="order._id" class="order-card">
        <div class="order-header">
          <div>
            <span class="order-id">{{ order.order_number || '#' + order._id.slice(-8) }}</span>
            <span class="order-date">{{ formatDate(order.createdAt) }}</span>
          </div>
          <span class="order-status" :class="statusClass(order)">{{ statusLabel(order) }}</span>
        </div>
        <div class="order-items" v-if="order.line_items && order.line_items.length">
          <div v-for="item in order.line_items" :key="item.product_id" class="line-item">
            <img v-if="item.image" :src="item.image" :alt="item.title" class="item-thumb" />
            <div class="item-info">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-variant" v-if="item.variant_title">{{ item.variant_title }}</span>
            </div>
            <span class="item-qty">x{{ item.quantity }}</span>
            <span class="item-price">${{ item.price.toFixed(2) }}</span>
          </div>
        </div>
        <div class="order-footer">
          <span>{{ (order.line_items || []).length }} item(s)</span>
          <span class="order-total">${{ (order.total_price || 0).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>No orders yet. <router-link to="/products">Start shopping</router-link></p>
    </div>
  </div>
</template>

<style scoped>
.section-title { font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 24px; }
.loading-state { padding: 40px; text-align: center; color: var(--color-text-light); }
.orders-list { display: flex; flex-direction: column; gap: 12px; }
.order-card { padding: 20px; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.order-id { font-weight: 600; margin-right: 12px; }
.order-date { font-size: var(--font-size-sm); color: var(--color-text-light); }
.order-status { padding: 4px 12px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; text-transform: capitalize; }
.order-status.shipped { background: #dbeafe; color: #1d4ed8; }
.order-status.delivered { background: #dcfce7; color: #16a34a; }
.order-status.pending { background: #fef3c7; color: #d97706; }
.order-status.cancelled { background: #fee2e2; color: #dc2626; }
.order-items { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-top: 1px solid var(--color-border-light); }
.line-item { display: flex; align-items: center; gap: 12px; font-size: var(--font-size-sm); }
.item-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: var(--radius-sm); background: var(--color-bg-gray); }
.item-info { flex: 1; min-width: 0; }
.item-title { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-variant { display: block; font-size: var(--font-size-xs); color: var(--color-text-light); }
.item-qty { color: var(--color-text-light); }
.item-price { font-weight: 600; }
.order-footer { display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--color-text-light); padding-top: 12px; border-top: 1px solid var(--color-border-light); }
.order-total { font-weight: 700; color: var(--color-text); }
.empty-state { padding: 60px; text-align: center; background: var(--color-bg-light); border-radius: var(--radius-md); color: var(--color-text-light); font-size: var(--font-size-sm); }
.empty-state a { color: var(--color-primary); font-weight: 600; }
</style>
