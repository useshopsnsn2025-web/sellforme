<script setup>
import { ref } from 'vue'
import { useCartStore } from '@/store/cart'
import { useCurrencyStore } from '@/store/currency'
import { trackCheckout } from '@/utils/tracker'

const cartStore = useCartStore()
const currencyStore = useCurrencyStore()
const step = ref(1)

const form = ref({
  email: '', firstName: '', lastName: '', address: '', city: '', state: '', zip: '', country: 'United States', phone: '',
})
</script>

<template>
  <div class="checkout-page">
    <div class="container">
      <h1 class="page-title">Checkout</h1>

      <!-- Progress Steps -->
      <div class="steps">
        <div class="step" :class="{ active: step >= 1, done: step > 1 }"><span>1</span> Information</div>
        <div class="step-line" :class="{ active: step > 1 }"></div>
        <div class="step" :class="{ active: step >= 2, done: step > 2 }"><span>2</span> Shipping</div>
        <div class="step-line" :class="{ active: step > 2 }"></div>
        <div class="step" :class="{ active: step >= 3 }"><span>3</span> Payment</div>
      </div>

      <div class="checkout-layout">
        <div class="checkout-form">
          <!-- Step 1: Information -->
          <div v-if="step === 1">
            <h2 class="step-title">Contact Information</h2>
            <div class="form-group"><label>Email</label><input v-model="form.email" type="email" placeholder="Email address" /></div>
            <h2 class="step-title mt">Shipping Address</h2>
            <div class="form-row-2">
              <div class="form-group"><label>First Name</label><input v-model="form.firstName" type="text" /></div>
              <div class="form-group"><label>Last Name</label><input v-model="form.lastName" type="text" /></div>
            </div>
            <div class="form-group"><label>Address</label><input v-model="form.address" type="text" /></div>
            <div class="form-row-3">
              <div class="form-group"><label>City</label><input v-model="form.city" type="text" /></div>
              <div class="form-group"><label>State</label><input v-model="form.state" type="text" /></div>
              <div class="form-group"><label>ZIP Code</label><input v-model="form.zip" type="text" /></div>
            </div>
            <div class="form-group"><label>Phone</label><input v-model="form.phone" type="tel" placeholder="Optional" /></div>
            <button class="btn btn-primary btn-lg" @click="step = 2">Continue to Shipping</button>
          </div>

          <!-- Step 2: Shipping -->
          <div v-if="step === 2">
            <h2 class="step-title">Shipping Method</h2>
            <div class="shipping-options">
              <label class="shipping-option active">
                <input type="radio" name="shipping" checked />
                <div class="shipping-info">
                  <span class="shipping-name">Free Standard Shipping</span>
                  <span class="shipping-time">5-10 business days</span>
                </div>
                <span class="shipping-price">Free</span>
              </label>
              <label class="shipping-option">
                <input type="radio" name="shipping" />
                <div class="shipping-info">
                  <span class="shipping-name">Express Shipping</span>
                  <span class="shipping-time">2-3 business days</span>
                </div>
                <span class="shipping-price">$14.99</span>
              </label>
            </div>
            <div class="step-actions">
              <button class="btn btn-outline" @click="step = 1">← Back</button>
              <button class="btn btn-primary btn-lg" @click="step = 3; trackCheckout()">Continue to Payment</button>
            </div>
          </div>

          <!-- Step 3: Payment -->
          <div v-if="step === 3">
            <h2 class="step-title">Payment Method</h2>
            <div class="payment-options">
              <label class="payment-option active">
                <input type="radio" name="payment" checked />
                <span>Credit Card</span>
              </label>
              <label class="payment-option">
                <input type="radio" name="payment" />
                <span>PayPal</span>
              </label>
            </div>
            <div class="form-row-2">
              <div class="form-group full"><label>Card Number</label><input type="text" placeholder="1234 5678 9012 3456" /></div>
            </div>
            <div class="form-row-3">
              <div class="form-group"><label>Expiry</label><input type="text" placeholder="MM/YY" /></div>
              <div class="form-group"><label>CVV</label><input type="text" placeholder="123" /></div>
              <div class="form-group"><label>Name on Card</label><input type="text" /></div>
            </div>
            <div class="step-actions">
              <button class="btn btn-outline" @click="step = 2">← Back</button>
              <button class="btn btn-primary btn-lg">Place Order</button>
            </div>
          </div>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="order-summary">
          <h3>Order Summary</h3>
          <div class="summary-items">
            <div v-for="(item, i) in cartStore.items" :key="i" class="summary-item">
              <img :src="item.image" :alt="item.name" class="summary-img" />
              <div class="summary-item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-qty">x{{ item.quantity }}</span>
              </div>
              <span class="item-price">{{ currencyStore.format(item.price * item.quantity) }}</span>
            </div>
          </div>
          <div class="summary-totals">
            <div class="s-row"><span>Subtotal</span><span>{{ currencyStore.format(cartStore.subtotal) }}</span></div>
            <div class="s-row"><span>Shipping</span><span>Free</span></div>
            <div class="s-row total"><span>Total</span><span>{{ currencyStore.format(cartStore.total) }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-page { padding: 40px 0 80px; }
.page-title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: 32px; }
.steps { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 48px; }
.step { display: flex; align-items: center; gap: 8px; font-size: var(--font-size-sm); color: var(--color-text-lighter); font-weight: 500; }
.step.active { color: var(--color-primary); }
.step.done { color: var(--color-success); }
.step span { width: 28px; height: 28px; border-radius: 50%; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600; }
.step.active span { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.step-line { width: 60px; height: 2px; background: var(--color-border); margin: 0 12px; }
.step-line.active { background: var(--color-primary); }
.checkout-layout { display: grid; grid-template-columns: 1fr 380px; gap: 48px; }
.step-title { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: 20px; }
.mt { margin-top: 32px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; }
.form-group input { padding: 12px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.form-group input:focus { border-color: var(--color-primary); }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.shipping-options, .payment-options { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
.shipping-option { display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; }
.shipping-option.active { border-color: var(--color-primary); background: var(--color-primary-light); }
.shipping-info { flex: 1; display: flex; flex-direction: column; }
.shipping-name { font-weight: 500; font-size: var(--font-size-sm); }
.shipping-time { font-size: var(--font-size-xs); color: var(--color-text-light); }
.shipping-price { font-weight: 600; font-size: var(--font-size-sm); }
.payment-option { display: flex; align-items: center; gap: 10px; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: 500; }
.payment-option.active { border-color: var(--color-primary); background: var(--color-primary-light); }
.step-actions { display: flex; justify-content: space-between; margin-top: 24px; }
.order-summary { padding: 24px; background: var(--color-bg-light); border-radius: var(--radius-lg); height: fit-content; position: sticky; top: 120px; }
.order-summary h3 { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: 20px; }
.summary-items { margin-bottom: 20px; }
.summary-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--color-border-light); }
.summary-img { width: 56px; height: 56px; border-radius: var(--radius-sm); object-fit: cover; }
.summary-item-info { flex: 1; }
.item-name { display: block; font-size: var(--font-size-sm); font-weight: 500; }
.item-qty { font-size: var(--font-size-xs); color: var(--color-text-light); }
.item-price { font-size: var(--font-size-sm); font-weight: 600; }
.s-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: var(--font-size-sm); }
.s-row.total { font-size: var(--font-size-lg); font-weight: 700; padding-top: 12px; border-top: 2px solid var(--color-border); margin-top: 8px; }
@media (max-width: 768px) { .checkout-layout { grid-template-columns: 1fr; } .form-row-3 { grid-template-columns: 1fr; } }
</style>
