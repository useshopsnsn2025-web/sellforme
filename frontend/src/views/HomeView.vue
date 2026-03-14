<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ProductCard from '@/components/common/ProductCard.vue'
import QuickViewModal from '@/components/common/QuickViewModal.vue'
import api, { fullUrl } from '@/utils/api'

const quickViewVisible = ref(false)
const quickViewProduct = ref(null)
function openQuickView(product) {
  quickViewProduct.value = product
  quickViewVisible.value = true
}

const { t } = useI18n()

const currentSlide = ref(0)
const bannerSlides = ref([])
const featuredProducts = ref([])
const collections = ref([])
let slideInterval = null

async function fetchBanners() {
  try {
    const res = await api.get('/page-config/home')
    bannerSlides.value = res.data.banners
  } catch {}
}

async function fetchFeatured() {
  try {
    const res = await api.get('/products', { params: { limit: 8, sort: 'best-selling' } })
    featuredProducts.value = res.data.products
  } catch {}
}

async function fetchCollections() {
  try {
    const res = await api.get('/collections')
    collections.value = res.data.collections.slice(0, 8)
  } catch {}
}

function nextSlide() {
  if (!bannerSlides.value.length) return
  currentSlide.value = (currentSlide.value + 1) % bannerSlides.value.length
}

function prevSlide() {
  if (!bannerSlides.value.length) return
  currentSlide.value = (currentSlide.value - 1 + bannerSlides.value.length) % bannerSlides.value.length
}

function goToSlide(index) {
  currentSlide.value = index
}

function getCollectionImage(col) {
  if (col.image?.src) return col.image.src
  if (typeof col.image === 'string' && col.image) return col.image
  return ''
}

onMounted(() => {
  fetchBanners().then(() => {
    if (bannerSlides.value.length) {
      slideInterval = setInterval(nextSlide, 5000)
    }
  })
  fetchFeatured()
  fetchCollections()
})
onUnmounted(() => { clearInterval(slideInterval) })

const faqKeys = ['condition', 'consignment', 'shipping', 'returns', 'payment', 'warranty']
const serviceKeys = ['freeShipping', 'support', 'buyerProtection', 'hours']
</script>

<template>
<div>
  <!-- Hero Banner / Slider -->
  <section class="hero-slider" v-if="bannerSlides.length">
    <div class="slider-container">
      <div class="slides" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
        <div v-for="(slide, index) in bannerSlides" :key="index" class="slide">
          <img :src="fullUrl(slide.image)" :alt="slide.title" class="slide-image" />
          <div class="slide-overlay"></div>
          <div class="slide-content" v-if="slide.title || slide.subtitle || slide.description">
            <span v-if="slide.subtitle" class="slide-subtitle">{{ slide.subtitle }}</span>
            <h1 v-if="slide.title" class="slide-title">{{ slide.title }}</h1>
            <p v-if="slide.description" class="slide-desc">{{ slide.description }}</p>
            <router-link v-if="slide.link && slide.button_text" :to="slide.link" class="btn btn-primary btn-lg">{{ slide.button_text }}</router-link>
          </div>
        </div>
      </div>
      <button class="slider-arrow prev" @click="prevSlide" v-if="bannerSlides.length > 1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <button class="slider-arrow next" @click="nextSlide" v-if="bannerSlides.length > 1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
      </button>
      <div class="slider-dots" v-if="bannerSlides.length > 1">
        <button v-for="(_, index) in bannerSlides" :key="index" class="dot" :class="{ active: currentSlide === index }" @click="goToSlide(index)"></button>
      </div>
    </div>
  </section>

  <!-- Category Bento Grid -->
  <section class="section categories-section" v-if="collections.length">
    <div class="container">
      <h2 class="section-title text-center">{{ t('home.shopByCategory') }}</h2>
      <div class="bento-grid">
        <router-link
          v-for="(col, i) in collections"
          :key="col.handle"
          :to="`/collections/${col.handle}`"
          class="bento-card"
          :class="`bento-${i}`"
        >
          <img v-if="getCollectionImage(col)" :src="getCollectionImage(col)" :alt="col.title" class="bento-image" loading="lazy" />
          <div v-else class="bento-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <path d="m9 22 3-3 3 3"/>
              <circle cx="9" cy="10" r="2"/>
            </svg>
          </div>
          <div class="bento-overlay">
            <h3 class="bento-title">{{ col.ad_title || col.title }}</h3>
            <!-- <span class="bento-count">{{ col.products_count || 0 }} products</span> -->
          </div>
        </router-link>
      </div>
    </div>
  </section>

  <!-- Featured Products -->
  <section class="section featured-section" v-if="featuredProducts.length">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">{{ t('home.featuredProducts') }}</h2>
        <router-link to="/products" class="btn btn-outline btn-sm">{{ t('common.viewAll') }}</router-link>
      </div>
      <div class="grid grid-4">
        <ProductCard v-for="product in featuredProducts" :key="product.product_id || product._id" :product="product" @quickView="openQuickView" />
      </div>
    </div>
  </section>

  <!-- FAQ / Help Section -->
  <section class="section faq-section">
    <div class="container">
      <h2 class="section-title text-center">{{ t('home.faqTitle') }}</h2>
      <p class="section-subtitle text-center">{{ t('home.faqSubtitle') }}</p>
      <div class="faq-grid">
        <div v-for="(key, i) in faqKeys" :key="key" class="faq-card">
          <div class="faq-icon-wrap">
            <svg v-if="i===0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <svg v-else-if="i===1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            <svg v-else-if="i===2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <svg v-else-if="i===3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            <svg v-else-if="i===4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h3 class="faq-title">{{ t(`faq.${key}Title`) }}</h3>
          <p class="faq-content">{{ t(`faq.${key}Content`) }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Service Features -->
  <section class="service-section">
    <div class="container">
      <div class="service-grid">
        <div v-for="(key, i) in serviceKeys" :key="key" class="service-card">
          <div class="service-icon-wrap">
            <svg v-if="i===0" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <svg v-else-if="i===1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <svg v-else-if="i===2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <h4 class="service-title">{{ t(`services.${key}`) }}</h4>
            <p class="service-desc">{{ t(`services.${key}Desc`) }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
  <QuickViewModal :visible="quickViewVisible" :product="quickViewProduct" @update:visible="quickViewVisible = $event" />
</div>
</template>

<style scoped>
/* Hero Slider */
.hero-slider { position: relative; overflow: hidden; }
.slider-container { position: relative; }
.slides { display: flex; transition: transform 0.6s ease; }
.slide { min-width: 100%; position: relative; height: 500px; }
.slide-image { width: 100%; height: 100%; object-fit: cover; }
.slide-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); }
.slide-content { position: absolute; top: 50%; left: 80px; transform: translateY(-50%); color: white; max-width: 500px; }
.slide-subtitle { font-size: var(--font-size-sm); text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; margin-bottom: 8px; display: block; }
.slide-title { font-size: var(--font-size-4xl); font-weight: 700; margin-bottom: 16px; line-height: 1.1; }
.slide-desc { font-size: var(--font-size-base); opacity: 0.9; margin-bottom: 28px; line-height: 1.6; }
.slider-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.9); color: var(--color-text); display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); box-shadow: var(--shadow-sm); cursor: pointer; }
.slider-arrow:hover { background: white; box-shadow: var(--shadow-md); }
.slider-arrow.prev { left: 20px; }
.slider-arrow.next { right: 20px; }
.slider-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5); transition: all var(--transition-fast); cursor: pointer; }
.dot.active { background: white; transform: scale(1.2); }

/* Section Common */
.section-title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: 12px; }
.section-subtitle { color: var(--color-text-light); margin-bottom: 40px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }

/* Bento Grid Categories */
.categories-section { padding: 60px 0; }

.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 280px 280px 220px;
  gap: 14px;
}

/* Asymmetric bento layout */
.bento-card.bento-0 { grid-column: 1 / 3; grid-row: 1 / 2; }
.bento-card.bento-1 { grid-column: 3 / 4; grid-row: 1 / 3; }
.bento-card.bento-2 { grid-column: 4 / 5; grid-row: 1 / 2; }
.bento-card.bento-3 { grid-column: 1 / 2; grid-row: 2 / 3; }
.bento-card.bento-4 { grid-column: 2 / 3; grid-row: 2 / 3; }
.bento-card.bento-5 { grid-column: 4 / 5; grid-row: 2 / 3; }
.bento-card.bento-6 { grid-column: 1 / 3; grid-row: 3 / 4; }
.bento-card.bento-7 { grid-column: 3 / 5; grid-row: 3 / 4; }

.bento-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #f5f5f7;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.bento-card:hover {
  transform: scale(1.015);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  z-index: 2;
}

.bento-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  position: absolute;
  inset: 0;
  transition: transform 0.4s ease;
}

.bento-card:hover .bento-image {
  transform: scale(1.06);
}

.bento-placeholder {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  color: #bbb;
}

.bento-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 22px;
  background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%);
  color: white;
}

.bento-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  margin-bottom: 2px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

/* Large cards get bigger titles */
.bento-card.bento-0 .bento-title,
.bento-card.bento-1 .bento-title,
.bento-card.bento-6 .bento-title,
.bento-card.bento-7 .bento-title {
  font-size: var(--font-size-xl);
}

.bento-count {
  font-size: var(--font-size-xs);
  opacity: 0.85;
}

/* Featured Products */
.featured-section { background: var(--color-bg-light); }

/* FAQ Grid */
.faq-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.faq-card { background: white; padding: 30px; border-radius: 16px; border: 1px solid var(--color-border-light); transition: box-shadow 0.2s ease; }
.faq-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.faq-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: var(--color-bg-gray, #f5f5f5); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: var(--color-primary); }
.faq-title { font-size: var(--font-size-base); font-weight: 600; margin-bottom: 10px; }
.faq-content { font-size: var(--font-size-sm); color: var(--color-text-light); line-height: 1.7; }

/* Service Features */
.service-section { padding: 40px 0; background: var(--color-bg-gray, #f5f5f5); }
.service-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.service-card { display: flex; align-items: flex-start; gap: 14px; padding: 20px; }
.service-icon-wrap { width: 44px; height: 44px; border-radius: 10px; background: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--color-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.service-title { font-size: var(--font-size-sm); font-weight: 600; margin-bottom: 4px; }
.service-desc { font-size: var(--font-size-xs); color: var(--color-text-light); line-height: 1.5; }

/* Responsive */
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: 220px 220px 220px 200px;
  }
  .bento-card.bento-0 { grid-column: 1 / 3; grid-row: 1 / 2; }
  .bento-card.bento-1 { grid-column: 1 / 2; grid-row: 2 / 3; }
  .bento-card.bento-2 { grid-column: 2 / 3; grid-row: 2 / 3; }
  .bento-card.bento-3 { grid-column: 1 / 2; grid-row: 3 / 4; }
  .bento-card.bento-4 { grid-column: 2 / 3; grid-row: 3 / 4; }
  .bento-card.bento-5 { grid-column: 1 / 2; grid-row: 4 / 5; }
  .bento-card.bento-6 { grid-column: 2 / 3; grid-row: 4 / 5; }
  .bento-card.bento-7 { grid-column: 1 / 3; grid-row: 5 / 6; }
  .faq-grid { grid-template-columns: repeat(2, 1fr); }
  .service-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .slide { height: 350px; }
  .slide-content { left: 20px; right: 20px; }
  .slide-title { font-size: var(--font-size-2xl); }
  .bento-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(4, 180px);
    gap: 10px;
  }
  .bento-card.bento-0 { grid-column: 1 / 3; grid-row: 1 / 2; }
  .bento-card.bento-1 { grid-column: 1 / 2; grid-row: 2 / 3; }
  .bento-card.bento-2 { grid-column: 2 / 3; grid-row: 2 / 3; }
  .bento-card.bento-3 { grid-column: 1 / 2; grid-row: 3 / 4; }
  .bento-card.bento-4 { grid-column: 2 / 3; grid-row: 3 / 4; }
  .bento-card.bento-5 { grid-column: 1 / 2; grid-row: 4 / 5; }
  .bento-card.bento-6 { grid-column: 2 / 3; grid-row: 4 / 5; }
  .bento-card.bento-7 { grid-column: 1 / 3; grid-row: 5 / 6; }
  .faq-grid { grid-template-columns: 1fr; }
  .service-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .bento-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(8, 160px);
  }
  .bento-card.bento-0,
  .bento-card.bento-1,
  .bento-card.bento-2,
  .bento-card.bento-3,
  .bento-card.bento-4,
  .bento-card.bento-5,
  .bento-card.bento-6,
  .bento-card.bento-7 {
    grid-column: 1 / -1;
    grid-row: auto;
  }
}
</style>
