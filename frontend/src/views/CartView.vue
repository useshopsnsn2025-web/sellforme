<script setup>
import { useRouter } from 'vue-router'
import { useCartStore } from '@/store/cart'
import { useCurrencyStore } from '@/store/currency'

const router = useRouter()
const cartStore = useCartStore()
const currencyStore = useCurrencyStore()
</script>

<template>
  <div class="cart-page">
    <div class="container">
      <h1 class="page-title">Shopping Cart</h1>

      <div v-if="cartStore.items.length === 0" class="empty-cart text-center">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <router-link to="/products" class="btn btn-primary btn-lg">Continue Shopping</router-link>
      </div>

      <div v-else class="cart-layout">
        <div class="cart-items">
          <table class="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in cartStore.items" :key="index">
                <td class="product-cell">
                  <img :src="item.image" :alt="item.name" class="cart-img" />
                  <span class="cart-item-name">{{ item.name }}</span>
                </td>
                <td>{{ currencyStore.format(item.price) }}</td>
                <td>
                  <div class="qty-control">
                    <button @click="cartStore.updateQuantity(index, item.quantity - 1)">−</button>
                    <span>{{ item.quantity }}</span>
                    <button @click="cartStore.updateQuantity(index, item.quantity + 1)">+</button>
                  </div>
                </td>
                <td class="font-semi">{{ currencyStore.format(item.price * item.quantity) }}</td>
                <td><button class="remove-btn" @click="cartStore.removeItem(index)">✕</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div class="summary-row"><span>Subtotal</span><span>{{ currencyStore.format(cartStore.subtotal) }}</span></div>
          <div class="summary-row"><span>Shipping</span><span class="text-success">Free</span></div>
          <div class="summary-row total"><span>Total</span><span>{{ currencyStore.format(cartStore.total) }}</span></div>
          <button class="btn btn-primary btn-lg" style="width:100%" @click="router.push('/checkout')">Proceed to Checkout</button>
          <router-link to="/products" class="continue-link">← Continue Shopping</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-page { padding: 40px 0 80px; }
.page-title { font-size: var(--font-size-3xl); font-weight: 700; margin-bottom: 32px; }
.empty-cart { padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; color: var(--color-text-light); }
.empty-cart h2 { color: var(--color-text); font-size: var(--font-size-xl); }
.cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 40px; }
.cart-table { width: 100%; border-collapse: collapse; }
.cart-table th { text-align: left; padding: 12px 8px; border-bottom: 2px solid var(--color-border); font-size: var(--font-size-sm); font-weight: 600; }
.cart-table td { padding: 16px 8px; border-bottom: 1px solid var(--color-border-light); font-size: var(--font-size-sm); vertical-align: middle; }
.product-cell { display: flex; align-items: center; gap: 12px; }
.cart-img { width: 70px; height: 70px; object-fit: cover; border-radius: var(--radius-md); }
.cart-item-name { font-weight: 500; max-width: 250px; }
.qty-control { display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-sm); width: fit-content; }
.qty-control button { width: 32px; height: 32px; background: none; font-size: 16px; }
.qty-control span { width: 36px; text-align: center; font-weight: 500; border-left: 1px solid var(--color-border); border-right: 1px solid var(--color-border); line-height: 32px; }
.remove-btn { background: none; color: var(--color-text-lighter); font-size: 16px; padding: 4px 8px; }
.remove-btn:hover { color: var(--color-danger); }
.cart-summary { padding: 24px; background: var(--color-bg-light); border-radius: var(--radius-lg); height: fit-content; position: sticky; top: 120px; }
.cart-summary h3 { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: 20px; }
.summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: var(--font-size-sm); }
.summary-row.total { font-size: var(--font-size-lg); font-weight: 700; padding: 16px 0; border-top: 2px solid var(--color-border); margin: 12px 0 20px; }
.text-success { color: var(--color-success); }
.continue-link { display: block; text-align: center; margin-top: 16px; font-size: var(--font-size-sm); color: var(--color-primary); font-weight: 500; }
@media (max-width: 768px) { .cart-layout { grid-template-columns: 1fr; } }
</style>
