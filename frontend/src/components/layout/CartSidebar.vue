<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/store/cart'
import { useCurrencyStore } from '@/store/currency'

const { t } = useI18n()

const router = useRouter()
const cartStore = useCartStore()
const currencyStore = useCurrencyStore()
const couponInput = ref('')

function goToCheckout() {
  cartStore.toggleCart()
  router.push('/checkout')
}

function applyCoupon() {
  if (couponInput.value.trim()) {
    cartStore.applyCoupon(couponInput.value.trim())
    couponInput.value = ''
  }
}
</script>

<template>
  <!-- Overlay -->
  <div class="cart-overlay" :class="{ active: cartStore.isOpen }" @click="cartStore.toggleCart()"></div>

  <!-- Sidebar -->
  <aside class="cart-sidebar" :class="{ open: cartStore.isOpen }">
    <div class="cart-header">
      <h3>{{ t('cart.shoppingCart') }}</h3>
      <button class="close-btn" @click="cartStore.toggleCart()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="cartStore.items.length === 0" class="cart-empty">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      <p>{{ t('cart.emptyCart') }}</p>
      <button class="btn btn-primary" @click="cartStore.toggleCart(); router.push('/products')">
        {{ t('common.continueShopping') }}
      </button>
    </div>

    <!-- Cart Items -->
    <div v-else class="cart-body">
      <div class="cart-items">
        <div v-for="(item, index) in cartStore.items" :key="index" class="cart-item">
          <img :src="item.image" :alt="item.name" class="cart-item-img" />
          <div class="cart-item-info">
            <h4 class="cart-item-name">{{ item.name }}</h4>
            <p class="cart-item-price">{{ currencyStore.format(item.price) }}</p>
            <div class="cart-item-qty">
              <button @click="cartStore.updateQuantity(index, item.quantity - 1)">−</button>
              <span>{{ item.quantity }}</span>
              <button @click="cartStore.updateQuantity(index, item.quantity + 1)">+</button>
            </div>
          </div>
          <button class="cart-item-remove" @click="cartStore.removeItem(index)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Coupon -->
      <div class="cart-coupon">
        <form @submit.prevent="applyCoupon" class="coupon-form">
          <input v-model="couponInput" type="text" placeholder="Coupon code" class="coupon-input" />
          <button type="submit" class="btn btn-outline btn-sm">Apply</button>
        </form>
      </div>

      <!-- Summary -->
      <div class="cart-summary">
        <div class="summary-row">
          <span>{{ t('cart.subtotal') }}</span>
          <span class="font-semi">{{ currencyStore.format(cartStore.subtotal) }}</span>
        </div>
        <div v-if="cartStore.couponDiscount > 0" class="summary-row discount">
          <span>{{ t('cart.discount') }}</span>
          <span>-{{ currencyStore.format(cartStore.couponDiscount) }}</span>
        </div>
        <div class="summary-row total">
          <span>{{ t('cart.total') }}</span>
          <span>{{ currencyStore.format(cartStore.total) }}</span>
        </div>
        <p class="shipping-note">{{ t('cart.shippingNote') }}</p>
        <button class="btn btn-primary btn-lg checkout-btn" @click="goToCheckout">
          {{ t('cart.checkout') }}
        </button>
        <button class="btn btn-outline continue-btn" @click="cartStore.toggleCart()">
          {{ t('common.continueShopping') }}
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 998;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-normal);
}

.cart-overlay.active {
  opacity: 1;
  visibility: visible;
}

.cart-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 420px;
  max-width: 100%;
  height: 100vh;
  background: white;
  z-index: 999;
  transform: translateX(100%);
  transition: transform var(--transition-normal);
  display: flex;
  flex-direction: column;
}

.cart-sidebar.open {
  transform: translateX(0);
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-light);
}

.cart-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.close-btn {
  background: none;
  padding: 4px;
  color: var(--color-text);
}

.cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
  color: var(--color-text-light);
}

.cart-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.cart-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-light);
  position: relative;
}

.cart-item-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--color-bg-gray);
}

.cart-item-info {
  flex: 1;
}

.cart-item-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cart-item-price {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
  margin-bottom: 8px;
}

.cart-item-qty {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  width: fit-content;
}

.cart-item-qty button {
  width: 28px;
  height: 28px;
  background: none;
  font-size: 16px;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-item-qty button:hover {
  background: var(--color-bg-gray);
}

.cart-item-qty span {
  width: 32px;
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.cart-item-remove {
  position: absolute;
  top: 12px;
  right: 0;
  background: none;
  padding: 4px;
  color: var(--color-text-lighter);
  transition: color var(--transition-fast);
}

.cart-item-remove:hover {
  color: var(--color-danger);
}

.cart-coupon {
  padding: 12px 24px;
  border-top: 1px solid var(--color-border-light);
}

.coupon-form {
  display: flex;
  gap: 8px;
}

.coupon-input {
  flex: 1;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.cart-summary {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--color-border-light);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: var(--font-size-sm);
}

.summary-row.discount {
  color: var(--color-success);
}

.summary-row.total {
  font-size: var(--font-size-lg);
  font-weight: 700;
  padding: 12px 0;
  border-top: 1px solid var(--color-border);
  margin-top: 8px;
}

.shipping-note {
  font-size: var(--font-size-xs);
  color: var(--color-text-lighter);
  margin-bottom: 16px;
}

.checkout-btn {
  width: 100%;
  margin-bottom: 8px;
}

.continue-btn {
  width: 100%;
}
</style>
