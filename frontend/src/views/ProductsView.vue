<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ProductCard from '@/components/common/ProductCard.vue'
import QuickViewModal from '@/components/common/QuickViewModal.vue'
import api from '@/utils/api'

const quickViewVisible = ref(false)
const quickViewProduct = ref(null)
function openQuickView(product) {
  quickViewProduct.value = product
  quickViewVisible.value = true
}

const { t } = useI18n()
const products = ref([])
const sortBy = ref('featured')
const currentPage = ref(1)
const perPage = 12
const totalProducts = ref(0)
const loading = ref(false)

const sortOptions = computed(() => [
  { value: 'featured', label: t('product.featured') },
  { value: 'best-selling', label: t('product.bestSelling') },
  { value: 'alpha-asc', label: t('product.alphaAsc') },
  { value: 'alpha-desc', label: t('product.alphaDesc') },
  { value: 'price-asc', label: t('product.priceAsc') },
  { value: 'price-desc', label: t('product.priceDesc') },
  { value: 'date-asc', label: t('product.dateAsc') },
  { value: 'date-desc', label: t('product.dateDesc') },
])

const totalPages = computed(() => Math.ceil(totalProducts.value / perPage))

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(start + 4, total)
  start = Math.max(1, end - 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

async function fetchProducts() {
  loading.value = true
  try {
    const params = { page: currentPage.value, limit: perPage }
    if (sortBy.value !== 'featured') params.sort = sortBy.value
    const res = await api.get('/products', { params })
    products.value = res.data.products
    totalProducts.value = res.data.pagination.total
  } catch {} finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

watch(sortBy, () => { currentPage.value = 1 })
watch([currentPage, sortBy], fetchProducts)
onMounted(fetchProducts)
</script>

<template>
  <div class="products-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">{{ t('product.allProducts') }}</h1>
        <p class="product-count">{{ t('product.productsCount', { count: totalProducts.toLocaleString() }) }}</p>
      </div>
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-outline btn-sm filter-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            {{ t('product.filter') }}
          </button>
        </div>
        <div class="toolbar-right">
          <label class="sort-label">{{ t('product.sortBy') }}:</label>
          <select v-model="sortBy" class="sort-select">
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-state">Loading...</div>
      <div v-else-if="!products.length" class="empty-state">No products found.</div>
      <template v-else>
        <div class="grid grid-4 products-grid">
          <ProductCard v-for="product in products" :key="product.product_id || product._id" :product="product" @quickView="openQuickView" />
        </div>
        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">&#8592; {{ t('common.back').toUpperCase() }}</button>
          <button v-for="page in visiblePages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="goToPage(page)">{{ page }}</button>
          <span v-if="visiblePages[visiblePages.length - 1] < totalPages" class="page-ellipsis">...</span>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">{{ t('common.next').toUpperCase() }} &#8594;</button>
        </div>
      </template>
    </div>
    <QuickViewModal :visible="quickViewVisible" :product="quickViewProduct" @update:visible="quickViewVisible = $event" />
  </div>
</template>

<style scoped>
.products-page { padding: 40px 0 80px; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: var(--font-size-3xl); font-weight: 700; }
.product-count { color: var(--color-text-light); font-size: var(--font-size-sm); margin-top: 4px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border-light); }
.toolbar-right { display: flex; align-items: center; gap: 10px; }
.sort-label { font-size: var(--font-size-sm); color: var(--color-text-light); }
.sort-select { padding: 8px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); cursor: pointer; background: white; }
.filter-btn { display: flex; align-items: center; gap: 6px; }
.products-grid { margin-bottom: 48px; }
.loading-state,
.empty-state { text-align: center; padding: 60px 0; color: var(--color-text-light); font-size: var(--font-size-lg); }
.pagination { display: flex; align-items: center; justify-content: center; gap: 6px; }
.page-btn { padding: 8px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: white; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text); transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.page-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: white; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-ellipsis { padding: 0 8px; color: var(--color-text-lighter); }
</style>
