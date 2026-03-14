<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { footerLinks } from '@/utils/mockData'
import api from '@/utils/api'

const { t } = useI18n()
const siteUrl = computed(() => window.location.origin)
const email = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref('') // 'success' | 'error'

async function handleSubscribe() {
  const val = email.value.trim()
  if (!val) return
  loading.value = true
  message.value = ''
  try {
    const res = await api.post('/subscribe', { email: val, source: 'footer' })
    message.value = res.data?.msg || 'Thank you for subscribing!'
    messageType.value = 'success'
    email.value = ''
  } catch (err) {
    message.value = err.response?.data?.msg || 'Subscription failed, please try again.'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Subscribe Section -->
  <section class="subscribe-section">
    <div class="container text-center">
      <h2 class="subscribe-title">{{ t('home.subscribeTitle') }}</h2>
      <p class="subscribe-desc">{{ t('home.subscribeDesc') }}</p>
      <form @submit.prevent="handleSubscribe" class="subscribe-form">
        <input v-model="email" type="email" :placeholder="t('home.subscribePlaceholder')" class="subscribe-input" :disabled="loading" required />
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '...' : t('home.subscribeBtn') }}
        </button>
      </form>
      <p v-if="message" class="subscribe-message" :class="messageType">{{ message }}</p>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <!-- Brand -->
        <div class="footer-col footer-brand">
          <h3 class="footer-logo">SellForMe</h3>
          <p class="footer-brand-desc">{{ t('footer.brandDesc') }}</p>
          <div class="social-links">
            <a :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Share on Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a :href="`https://twitter.com/intent/tweet?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent('Check out SellForMe - Quality pre-owned electronics!')}`" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Share on Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            </a>
            <a :href="`https://www.instagram.com/`" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Follow on Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a :href="`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(siteUrl)}&description=${encodeURIComponent('SellForMe - Quality pre-owned electronics')}`" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Share on Pinterest">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>
            </a>
            <a :href="`https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent('Check out SellForMe - Quality pre-owned electronics!')}`" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Share on Telegram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>

        <!-- Customer Care -->
        <div class="footer-col">
          <h4 class="footer-title">{{ t('footer.customerCare') }}</h4>
          <ul class="footer-list">
            <li><router-link to="/pages/shipping-policy">{{ t('footer.shippingPolicy') }}</router-link></li>
            <li><router-link to="/pages/returns-refunds">{{ t('footer.returnsRefunds') }}</router-link></li>
            <li><router-link to="/pages/buyer-confidence">{{ t('footer.buyerConfidence') }}</router-link></li>
            <li><router-link to="/pages/buyer-protection">{{ t('footer.buyerProtection') }}</router-link></li>
            <li><router-link to="/pages/warranty-policy">{{ t('footer.warrantyPolicy') }}</router-link></li>
            <li><router-link to="/pages/consignment-policy">{{ t('footer.consignmentPolicy') }}</router-link></li>
          </ul>
        </div>

        <!-- My Account -->
        <div class="footer-col">
          <h4 class="footer-title">{{ t('footer.myAccount') }}</h4>
          <ul class="footer-list">
            <li><router-link to="/account/login">{{ t('common.signIn') }}</router-link></li>
            <li><router-link to="/account/register">{{ t('common.register') }}</router-link></li>
            <li><router-link to="/tracking">{{ t('footer.orderTracking') }}</router-link></li>
            <li><router-link to="/account/orders">{{ t('account.myOrders') }}</router-link></li>
          </ul>
        </div>

        <!-- Company & Legal -->
        <div class="footer-col">
          <h4 class="footer-title">{{ t('footer.companyLegal') }}</h4>
          <ul class="footer-list">
            <li><router-link to="/pages/about-us">{{ t('footer.aboutUs') }}</router-link></li>
            <li><router-link to="/pages/privacy-policy">{{ t('footer.privacyPolicy') }}</router-link></li>
            <li><router-link to="/pages/terms-of-service">{{ t('footer.termsOfService') }}</router-link></li>
            <li><router-link to="/pages/contact-us">{{ t('footer.contactUs') }}</router-link></li>
          </ul>
        </div>
      </div>

      <!-- Copyright -->
      <div class="footer-bottom">
        <p>{{ t('footer.copyright') }}</p>
        <p class="footer-contact">{{ t('footer.contact') }}</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.subscribe-section { background: var(--color-bg-gray); padding: 60px 0; }
.subscribe-title { font-size: var(--font-size-3xl); font-weight: 700; margin-bottom: 12px; }
.subscribe-desc { color: var(--color-text-light); margin-bottom: 30px; font-size: var(--font-size-base); }
.subscribe-form { display: flex; max-width: 480px; margin: 0 auto; gap: 12px; }
.subscribe-input { flex: 1; padding: 14px 20px; border: 2px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--font-size-sm); transition: border-color var(--transition-fast); }
.subscribe-input:focus { border-color: var(--color-primary); }
.subscribe-message { margin-top: 14px; font-size: var(--font-size-sm); }
.subscribe-message.success { color: #22c55e; }
.subscribe-message.error { color: #ef4444; }
.footer { background: var(--color-bg-dark); color: var(--color-text-white); padding: 60px 0 0; }
.footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.footer-logo { font-size: 24px; font-weight: 700; color: var(--color-primary); margin-bottom: 16px; }
.footer-brand-desc { color: rgba(255,255,255,0.6); font-size: var(--font-size-sm); line-height: 1.8; margin-bottom: 20px; }
.social-links { display: flex; gap: 12px; }
.social-link { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.7); transition: all var(--transition-fast); }
.social-link:hover { background: var(--color-primary); color: white; }
.footer-title { font-size: var(--font-size-base); font-weight: 600; margin-bottom: 20px; color: white; }
.footer-list li { margin-bottom: 12px; }
.footer-list a { color: rgba(255,255,255,0.6); font-size: var(--font-size-sm); transition: color var(--transition-fast); }
.footer-list a:hover { color: var(--color-primary); }
.footer-bottom { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; font-size: var(--font-size-sm); color: rgba(255,255,255,0.4); }
.footer-contact { color: rgba(255,255,255,0.4); }
@media (max-width: 768px) {
  .footer-grid { grid-template-columns: 1fr 1fr; }
  .footer-brand { grid-column: 1 / -1; }
  .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
  .subscribe-form { flex-direction: column; }
}
</style>
