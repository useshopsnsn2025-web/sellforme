<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '@/store/cart'
import { useCurrencyStore } from '@/store/currency'
import { useUserStore } from '@/store/user'
import ProductCard from '@/components/common/ProductCard.vue'
import QuickViewModal from '@/components/common/QuickViewModal.vue'
import api from '@/utils/api'
import { useContact } from '@/composables/useContact'

const { contactMethod, fetchContact, handleContactClick: _handleContactClick } = useContact()

const quickViewVisible = ref(false)
const quickViewProduct = ref(null)
function openQuickView(p) {
  quickViewProduct.value = p
  quickViewVisible.value = true
}

const route = useRoute()
const cartStore = useCartStore()
const currencyStore = useCurrencyStore()
const userStore = useUserStore()

const quantity = ref(1)
const activeImage = ref(0)
const activeTab = ref('description')
const loading = ref(true)
const error = ref('')

const product = ref(null)
const relatedProducts = ref([])

const isWished = computed(() => product.value ? userStore.isInWishlist(product.value.product_id) : false)

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const estimatedDeliveryStart = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 5)
  return `${monthNames[d.getMonth()]} ${d.getDate()}`
})
const estimatedDeliveryEnd = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 10)
  return `${monthNames[d.getMonth()]} ${d.getDate()}`
})

const discount = computed(() => {
  if (!product.value || !product.value.compare_at_price || product.value.compare_at_price <= product.value.price) return 0
  return Math.round((1 - product.value.price / product.value.compare_at_price) * 100)
})

async function fetchProduct() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get(`/products/${route.params.id}`)
    product.value = res.data.product
    fetchRelated()
  } catch (err) {
    error.value = 'Failed to load product'
  } finally {
    loading.value = false
  }
}

async function fetchRelated() {
  try {
    const collectionId = product.value.collections?.[0]?._id
    const params = { limit: 4 }
    if (collectionId) params.collection = collectionId
    const res = await api.get('/products', { params })
    relatedProducts.value = res.data.products.filter(p => p.product_id !== product.value.product_id)
  } catch {}
}

function addToCart() {
  if (!product.value) return
  cartStore.addItem({
    id: product.value.product_id,
    name: product.value.title,
    price: product.value.price,
    image: product.value.featured_image || product.value.images?.[0]?.src,
    variant: 'default',
  }, quantity.value)
  cartStore.isOpen = true
}

function buyNow() {
  addToCart()
}

function toggleWishlist() {
  if (product.value) userStore.toggleWishlist(product.value.product_id)
}

const faqOpen = ref(-1)
const faqItems = [
  { title: 'Item Condition & Contents', content: 'All items are pre-owned and inspected before listing. Cosmetic condition is described in the listing. Original accessories may or may not be included — check the listing details for specifics.' },
  { title: 'How Consignment Works', content: 'Sellers ship items to us for inspection and authentication. Once approved, we list and handle the sale. Payment is securely processed through our platform with buyer protection.' },
  { title: 'Shipping & Tracking', content: 'Orders ship within 1-3 business days. You will receive a tracking number via email once shipped. Free standard shipping is available on all US orders.' },
  { title: 'Returns & Refunds', content: 'Returns are accepted within 30 days of delivery. Items must be in the same condition as received. Refunds are processed within 5-7 business days after we receive the return.' },
  { title: 'Payment & Buyer Protection', content: 'We accept all major credit cards and PayPal. Every purchase is covered by our Buyer Protection program — if the item is not as described, you get a full refund.' },
  { title: 'Warranty & Quality Check', content: 'Each item undergoes a basic inspection and function check before listing. Warranty coverage varies by item type — electronics typically include a 30-day functional warranty.' },
]

// Contact rotation (WhatsApp or LINE)
async function handleContactBtnClick() {
  await _handleContactClick()
  showPopup.value = false
}

// Popup after 15 seconds
const showPopup = ref(false)
let popupTimer = null

function startPopupTimer() {
  clearTimeout(popupTimer)
  showPopup.value = false
  popupTimer = setTimeout(() => {
    showPopup.value = true
  }, 15000)
}

onMounted(() => {
  fetchProduct()
  fetchContact()
  startPopupTimer()
})
onUnmounted(() => { clearTimeout(popupTimer) })
watch(() => route.params.id, () => {
  activeImage.value = 0
  activeTab.value = 'description'
  quantity.value = 1
  fetchProduct()
  startPopupTimer()
})
</script>

<template>
  <div class="product-detail-page">
    <div class="container">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">Loading...</div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">{{ error }}</div>

      <!-- Product Content -->
      <template v-else-if="product">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <router-link to="/">Home</router-link>
          <span>/</span>
          <router-link to="/products">Products</router-link>
          <span>/</span>
          <span class="current">{{ product.title }}</span>
        </div>

        <!-- Product Main -->
        <div class="product-main">
          <!-- Image Gallery -->
          <div class="product-gallery">
            <div class="main-image">
              <img :src="product.images?.[activeImage]?.src || product.featured_image" :alt="product.title" />
              <span v-if="discount" class="discount-badge">-{{ discount }}%</span>
            </div>
            <div class="thumb-list" v-if="product.images?.length > 1">
              <button
                v-for="(img, index) in product.images"
                :key="index"
                class="thumb"
                :class="{ active: activeImage === index }"
                @click="activeImage = index"
              >
                <img :src="img.src" :alt="`${product.title} ${index + 1}`" />
              </button>
            </div>
          </div>

          <!-- Product Info -->
          <div class="product-info">
            <h1 class="product-name">{{ product.title }}</h1>

            <div class="product-price-group">
              <span class="current-price">{{ currencyStore.format(product.price) }}</span>
              <span v-if="product.compare_at_price && product.compare_at_price > product.price" class="original-price">{{ currencyStore.format(product.compare_at_price) }}</span>
              <span v-if="discount" class="save-badge">Save {{ discount }}%</span>
            </div>

            <div class="stock-status" :class="{ 'in-stock': product.in_stock, 'out-stock': !product.in_stock }">
              {{ product.in_stock ? '● In Stock' : '● Out of Stock' }}
            </div>

            <p class="product-desc">{{ product.condition_description || '' }}</p>

            <!-- Quantity -->
            <!-- <div class="quantity-row">
              <label>Quantity:</label>
              <div class="quantity-selector">
                <button @click="quantity = Math.max(1, quantity - 1)">-</button>
                <span>{{ quantity }}</span>
                <button @click="quantity++">+</button>
              </div>
            </div> -->

            <!-- Action Buttons -->
            <!-- <div class="action-buttons">
              <button class="btn btn-primary btn-lg" @click="addToCart" :disabled="!product.in_stock">
                Add to Cart
              </button>
              <button class="btn btn-dark btn-lg" @click="buyNow" :disabled="!product.in_stock">
                Buy it Now
              </button>
              <button class="wishlist-btn" :class="{ active: isWished }" @click="toggleWishlist">
                <svg width="22" height="22" viewBox="0 0 24 24" :fill="isWished ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div> -->

            <!-- Delivery & Wishlist Info -->
            <div class="delivery-info">
              <div class="delivery-row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Get it between <strong>{{ estimatedDeliveryStart }}</strong> ~ <strong>{{ estimatedDeliveryEnd }}</strong></span>
              </div>
              <div class="delivery-row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span><strong>{{ product.wishlist_count || Math.floor(Math.random() * 30 + 5) }}</strong> people have wishlisted this product</span>
              </div>
            </div>

            <!-- Contact Button -->
            <button v-if="contactMethod === 'line'" class="contact-btn line-btn" @click="handleContactBtnClick">
              <span>Chat on</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              <span>LINE</span>
            </button>
            <button v-else class="contact-btn whatsapp-btn" @click="handleContactBtnClick">
              <span>Chat on</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span>WhatsApp</span>
            </button>

            <!-- Trust Guarantees -->
            <div class="trust-guarantees">
              <div class="guarantee-item">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                </div>
                <div class="guarantee-text">
                  <strong>Returns & Exchanges within 30 days</strong>
                  <span>Eligible returns within 30 days (see listing).</span>
                </div>
              </div>
              <div class="guarantee-item">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                </div>
                <div class="guarantee-text">
                  <strong>Money Back Guarantee</strong>
                  <span>Refunds issued after return inspection.</span>
                </div>
              </div>
              <div class="guarantee-item">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                </div>
                <div class="guarantee-text">
                  <strong>Warranty (Varies by Item)</strong>
                  <span>Covers material & workmanship defects.</span>
                </div>
              </div>
              <div class="guarantee-item">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                </div>
                <div class="guarantee-text">
                  <strong>Inspected Before Listing</strong>
                  <span>Basic inspection/function check before listing.</span>
                </div>
              </div>
              <div class="guarantee-item">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
                <div class="guarantee-text">
                  <strong>Free US Shipping</strong>
                  <span>One-of-one item. Ships via USPS from the United States.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="product-tabs">
          <div class="tab-headers">
            <button class="tab-btn" :class="{ active: activeTab === 'description' }" @click="activeTab = 'description'">
              Description
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'specs' }" @click="activeTab = 'specs'">
              Specifications
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'reviews' }" @click="activeTab = 'reviews'">
              Reviews ({{ product.reviews_count || 0 }})
            </button>
          </div>

          <div class="tab-content">
            <div v-if="activeTab === 'description'" class="tab-pane">
              <div v-if="product.body_html" v-html="product.body_html"></div>
              <p v-else>No description available.</p>
            </div>

            <div v-if="activeTab === 'specs'" class="tab-pane">
              <table class="specs-table">
                <tr>
                  <td class="spec-label">Condition</td>
                  <td class="spec-value">{{ product.condition || 'N/A' }}</td>
                </tr>
                <tr v-if="product.product_type">
                  <td class="spec-label">Type</td>
                  <td class="spec-value">{{ product.product_type }}</td>
                </tr>
                <tr v-if="product.vendor">
                  <td class="spec-label">Vendor</td>
                  <td class="spec-value">{{ product.vendor }}</td>
                </tr>
                <tr v-for="opt in product.options" :key="opt.name">
                  <td class="spec-label">{{ opt.name }}</td>
                  <td class="spec-value">{{ opt.values?.join(', ') }}</td>
                </tr>
              </table>
            </div>

            <div v-if="activeTab === 'reviews'" class="tab-pane">
              <div class="review-summary">
                <div class="rating-big">{{ product.rating || 0 }}</div>
                <div>
                  <div class="stars">
                    <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(product.rating || 0) }">&#9733;</span>
                  </div>
                  <p>Based on {{ product.reviews_count || 0 }} reviews</p>
                </div>
              </div>
              <p class="text-light">Customer reviews will appear here.</p>
            </div>
          </div>
        </div>

        <!-- FAQ Help Section -->
        <section class="faq-help-section">
          <div class="faq-help-inner">
            <div class="faq-help-left">
              <h2 class="faq-help-title">Have a question ? We are here to help.</h2>
              <p class="faq-help-desc">Consignment pre-owned items, inspected before listing — secure checkout, tracking included, buyer protection, 48-hour response.</p>
              <div class="faq-help-avatars">
                <img src="@/static/images/ac.webp" alt="Support Team" class="faq-avatars-img" />
              </div>
              <p class="faq-help-hours">Our customer support is available Monday to Friday: 8am-8:30pm.<br/>Average answer time: 24h</p>
            </div>
            <div class="faq-help-right">
              <div v-for="(faq, idx) in faqItems" :key="idx" class="faq-accordion" :class="{ open: faqOpen === idx }">
                <button class="faq-accordion-header" @click="faqOpen = faqOpen === idx ? -1 : idx">
                  <span class="faq-accordion-icon">
                    <svg v-if="idx===0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><polyline points="9 12 11 14 15 10"/></svg>
                    <svg v-else-if="idx===1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    <svg v-else-if="idx===2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    <svg v-else-if="idx===3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                    <svg v-else-if="idx===4" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                  </span>
                  <strong>{{ faq.title }}</strong>
                  <svg class="faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div class="faq-accordion-body">
                  <p>{{ faq.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Related Products -->
        <section v-if="relatedProducts.length" class="related-section">
          <h2 class="section-title">You May Also Like</h2>
          <div class="grid grid-4">
            <ProductCard v-for="p in relatedProducts" :key="p.product_id || p._id" :product="p" @quickView="openQuickView" />
          </div>
        </section>
      </template>
    </div>

    <!-- WhatsApp Popup (15s delay) -->
    <Transition name="popup-fade">
      <div v-if="showPopup" class="popup-overlay" @click.self="showPopup = false">
        <div class="popup-card">
          <button class="popup-close" @click="showPopup = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div class="popup-header">
            <div class="popup-icon-wrap" :class="{ 'popup-icon-line': contactMethod === 'line' }">
              <svg v-if="contactMethod === 'line'" width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              <svg v-else width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div class="popup-badge">Online Now</div>
          </div>
          <h3 class="popup-title">Contact the Seller via {{ contactMethod === 'line' ? 'LINE' : 'WhatsApp' }}</h3>
          <p class="popup-desc">Still brand new, used only once. Second-hand goods are consigned and inspected before being listed.</p>
          <div class="popup-features">
            <div class="popup-feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="contactMethod === 'line' ? '#06C755' : '#25D366'" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Verified Condition</span>
            </div>
            <div class="popup-feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="contactMethod === 'line' ? '#06C755' : '#25D366'" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Quality Inspected</span>
            </div>
            <div class="popup-feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="contactMethod === 'line' ? '#06C755' : '#25D366'" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Consigned Item</span>
            </div>
          </div>
          <button class="popup-contact-btn" :class="contactMethod === 'line' ? 'popup-line-btn' : 'popup-wa-btn'" @click="handleContactBtnClick">
            <svg v-if="contactMethod === 'line'" width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span>Chat with Seller</span>
          </button>
          <p class="popup-sub">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Typically replies within minutes
          </p>
        </div>
      </div>
    </Transition>
    <QuickViewModal :visible="quickViewVisible" :product="quickViewProduct" @update:visible="quickViewVisible = $event" />
  </div>
</template>

<style scoped>
.product-detail-page {
  padding: 20px 0 80px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 80px 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-light);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  color: var(--color-text-lighter);
  margin-bottom: 32px;
}

.breadcrumb a:hover {
  color: var(--color-primary);
}

.breadcrumb .current {
  color: var(--color-text);
}

.product-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  margin-bottom: 60px;
}

/* Gallery */
.product-gallery {
  position: sticky;
  top: 120px;
  align-self: start;
}

.main-image {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-gray);
  margin-bottom: 12px;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.discount-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: var(--color-danger);
  color: white;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.thumb-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.thumb {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color var(--transition-fast);
  background: var(--color-bg-gray);
  padding: 0;
}

.thumb.active {
  border-color: var(--color-primary);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Info */
.product-name {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.3;
}

.stars { display: flex; gap: 2px; }
.star { color: #ddd; font-size: 18px; }
.star.filled { color: #FFC107; }

.product-price-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.current-price {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-text);
}

.original-price {
  font-size: var(--font-size-lg);
  color: var(--color-text-lighter);
  text-decoration: line-through;
}

.save-badge {
  background: #fff3cd;
  color: #856404;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.stock-status {
  font-size: var(--font-size-sm);
  font-weight: 500;
  margin-bottom: 16px;
}

.stock-status.in-stock { color: var(--color-success); }
.stock-status.out-stock { color: var(--color-danger); }

.product-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  line-height: 1.7;
  margin-bottom: 24px;
}

.quantity-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.quantity-row label {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.quantity-selector button {
  width: 40px;
  height: 40px;
  background: none;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-selector button:hover {
  background: var(--color-bg-gray);
}

.quantity-selector span {
  width: 50px;
  text-align: center;
  font-weight: 500;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  height: 40px;
  line-height: 40px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.action-buttons .btn {
  flex: 1;
}

.wishlist-btn {
  width: 52px;
  height: 52px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  background: none;
  color: var(--color-text-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.wishlist-btn:hover,
.wishlist-btn.active {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

/* Delivery Info */
.delivery-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.delivery-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.delivery-row svg {
  flex-shrink: 0;
  color: var(--color-text-lighter);
}

.delivery-row svg[fill="currentColor"] {
  color: #333;
}

/* Contact Button */
.contact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-bottom: 24px;
}

.whatsapp-btn { background: #25D366; }
.whatsapp-btn:hover { background: #1da851; color: white; }
.line-btn { background: #06C755; }
.line-btn:hover { background: #05a648; color: white;
}

/* Trust Guarantees */
.trust-guarantees {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 8px 0;
}

.guarantee-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 20px;
}

.guarantee-item + .guarantee-item {
  border-top: 1px solid var(--color-border-light);
}

.guarantee-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text);
}

.guarantee-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.guarantee-text strong {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.guarantee-text span {
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
  line-height: 1.5;
}

/* Tabs */
.product-tabs {
  margin-bottom: 60px;
}

.tab-headers {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border-light);
  margin-bottom: 24px;
}

.tab-btn {
  padding: 14px 24px;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-light);
  background: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all var(--transition-fast);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-pane {
  font-size: var(--font-size-sm);
  line-height: 1.8;
  color: var(--color-text-light);
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table tr {
  border-bottom: 1px solid var(--color-border-light);
}

.spec-label {
  padding: 12px 16px;
  font-weight: 600;
  color: var(--color-text);
  width: 200px;
  background: var(--color-bg-light);
}

.spec-value {
  padding: 12px 16px;
}

.review-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.rating-big {
  font-size: 48px;
  font-weight: 700;
  color: var(--color-text);
}

/* FAQ Help Section */
.faq-help-section {
  background: #f5f5f7;
  border-radius: var(--radius-lg);
  padding: 48px;
  margin-bottom: 48px;
}

.faq-help-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
}

.faq-help-title {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 16px;
  color: var(--color-text);
}

.faq-help-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  line-height: 1.7;
  margin-bottom: 20px;
}

.faq-help-avatars {
  margin-bottom: 20px;
}

.faq-avatars-img {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.faq-help-hours {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  line-height: 1.6;
}

.faq-accordion {
  background: white;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.faq-accordion + .faq-accordion {
  margin-top: 8px;
}

.faq-accordion-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  background: none;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.15s ease;
}

.faq-accordion-header:hover {
  background: #fafafa;
}

.faq-accordion-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.faq-accordion-header strong {
  flex: 1;
  text-align: left;
}

.faq-chevron {
  flex-shrink: 0;
  color: var(--color-text-lighter);
  transition: transform 0.2s ease;
}

.faq-accordion.open .faq-chevron {
  transform: rotate(180deg);
}

.faq-accordion-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}

.faq-accordion.open .faq-accordion-body {
  max-height: 200px;
}

.faq-accordion-body p {
  padding: 0 20px 16px 50px;
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
  line-height: 1.7;
}

.related-section {
  padding-top: 40px;
  border-top: 1px solid var(--color-border-light);
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .product-main {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .product-gallery {
    position: static;
  }

  .action-buttons {
    flex-wrap: wrap;
  }

  .faq-help-section {
    padding: 28px 20px;
  }

  .faq-help-inner {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .faq-help-title {
    font-size: 24px;
  }
}

/* WhatsApp Popup */
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.popup-card {
  background: white;
  border-radius: 24px;
  padding: 52px 56px 44px;
  max-width: 640px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.popup-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  cursor: pointer;
  transition: all 0.2s ease;
}

.popup-close:hover {
  background: #eee;
  color: #666;
}

.popup-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.popup-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #25D366, #128C7E);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(37, 211, 102, 0.35);
}
.popup-icon-line {
  background: linear-gradient(135deg, #06C755, #04a045);
  box-shadow: 0 8px 24px rgba(6, 199, 85, 0.35);
}

.popup-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.popup-badge::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  animation: popup-pulse 2s infinite;
}

@keyframes popup-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.popup-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.popup-desc {
  font-size: 14px;
  color: var(--color-text-light);
  line-height: 1.7;
  margin-bottom: 28px;
  max-width: 380px;
  margin-left: auto;
  margin-right: auto;
}

.popup-features {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 28px;
}

.popup-feature {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.popup-contact-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 28px;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.25s ease;
}

.popup-wa-btn {
  background: linear-gradient(135deg, #25D366, #20bd5a);
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.3);
}
.popup-wa-btn:hover {
  background: linear-gradient(135deg, #20bd5a, #1da851);
  color: white;
}
.popup-line-btn {
  background: linear-gradient(135deg, #06C755, #05a648);
  box-shadow: 0 4px 16px rgba(6, 199, 85, 0.3);
}
.popup-line-btn:hover {
  background: linear-gradient(135deg, #05a648, #049a3d);
  color: white;
  box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
  transform: translateY(-1px);
}

.popup-sub {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-lighter);
  margin-top: 16px;
}

/* Popup Transition */
.popup-fade-enter-active {
  transition: opacity 0.35s ease;
}
.popup-fade-enter-active .popup-card {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
}
.popup-fade-leave-active {
  transition: opacity 0.2s ease;
}
.popup-fade-leave-active .popup-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.popup-fade-enter-from {
  opacity: 0;
}
.popup-fade-enter-from .popup-card {
  transform: scale(0.85) translateY(20px);
  opacity: 0;
}
.popup-fade-leave-to {
  opacity: 0;
}
.popup-fade-leave-to .popup-card {
  transform: scale(0.92);
  opacity: 0;
}
</style>
