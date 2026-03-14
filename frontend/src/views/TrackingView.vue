<script setup>
import { ref } from 'vue'

const trackingNumber = ref('')
const result = ref(null)

function handleTrack() {
  if (trackingNumber.value.trim()) {
    result.value = {
      number: trackingNumber.value,
      status: 'In Transit',
      carrier: 'USPS',
      estimated: 'Mar 15, 2026',
      steps: [
        { status: 'Order Placed', date: 'Mar 8, 2026', done: true },
        { status: 'Processing', date: 'Mar 9, 2026', done: true },
        { status: 'Shipped', date: 'Mar 10, 2026', done: true },
        { status: 'In Transit', date: 'Mar 10, 2026', done: true },
        { status: 'Delivered', date: '', done: false },
      ],
    }
  }
}
</script>

<template>
  <div class="tracking-page">
    <div class="container">
      <div class="tracking-card">
        <h1 class="page-title text-center">Order Tracking</h1>
        <p class="text-center text-light">Enter your tracking number to check the status of your order.</p>

        <form @submit.prevent="handleTrack" class="tracking-form">
          <input v-model="trackingNumber" type="text" placeholder="Enter tracking number or order ID" />
          <button type="submit" class="btn btn-primary">Track Order</button>
        </form>

        <div v-if="result" class="tracking-result">
          <div class="result-header">
            <div>
              <span class="result-label">Tracking #:</span>
              <span class="result-value">{{ result.number }}</span>
            </div>
            <span class="status-badge">{{ result.status }}</span>
          </div>
          <div class="timeline">
            <div v-for="(step, i) in result.steps" :key="i" class="timeline-step" :class="{ done: step.done }">
              <div class="step-dot"></div>
              <div class="step-info">
                <span class="step-status">{{ step.status }}</span>
                <span class="step-date" v-if="step.date">{{ step.date }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tracking-page { padding: 60px 0 80px; }
.tracking-card { max-width: 600px; margin: 0 auto; }
.page-title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: 8px; }
.text-light { color: var(--color-text-light); font-size: var(--font-size-sm); margin-bottom: 32px; }
.tracking-form { display: flex; gap: 12px; margin-bottom: 40px; }
.tracking-form input { flex: 1; padding: 14px 20px; border: 2px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--font-size-sm); }
.tracking-form input:focus { border-color: var(--color-primary); }
.result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding: 20px; background: var(--color-bg-light); border-radius: var(--radius-md); }
.result-label { font-size: var(--font-size-sm); color: var(--color-text-light); margin-right: 8px; }
.result-value { font-weight: 600; }
.status-badge { background: #dbeafe; color: #1d4ed8; padding: 6px 14px; border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 600; }
.timeline { position: relative; padding-left: 24px; }
.timeline::before { content: ''; position: absolute; left: 7px; top: 0; bottom: 0; width: 2px; background: var(--color-border); }
.timeline-step { position: relative; padding-bottom: 24px; padding-left: 24px; }
.step-dot { position: absolute; left: -24px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: white; border: 2px solid var(--color-border); }
.timeline-step.done .step-dot { background: var(--color-primary); border-color: var(--color-primary); }
.step-status { display: block; font-size: var(--font-size-sm); font-weight: 500; }
.step-date { font-size: var(--font-size-xs); color: var(--color-text-light); }
</style>
