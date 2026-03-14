<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/common/ProductCard.vue'
import QuickViewModal from '@/components/common/QuickViewModal.vue'
import api from '@/utils/api'

const quickViewVisible = ref(false)
const quickViewProduct = ref(null)
function openQuickView(product) {
  quickViewProduct.value = product
  quickViewVisible.value = true
}

const route = useRoute()
const sortBy = ref('featured')
const currentPage = ref(1)
const perPage = 12
const loading = ref(false)

const collection = ref(null)
const products = ref([])
const totalProducts = ref(0)

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'alpha-asc', label: 'A-Z' },
  { value: 'alpha-desc', label: 'Z-A' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

const totalPages = computed(() => Math.ceil(totalProducts.value / perPage))

async function fetchCollection() {
  loading.value = true
  try {
    const params = { page: currentPage.value, limit: perPage }
    if (sortBy.value !== 'featured') params.sort = sortBy.value
    const res = await api.get(`/collections/${route.params.slug}`, { params })
    collection.value = res.data.collection
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

watch(() => route.params.slug, () => { currentPage.value = 1; sortBy.value = 'featured' })
watch(sortBy, () => { currentPage.value = 1 })
watch([() => route.params.slug, currentPage, sortBy], fetchCollection)
onMounted(fetchCollection)
</script>

<template>
  <div class="collection-detail-page">
    <div class="container">
      <div class="breadcrumb">
        <router-link to="/">Home</router-link>
        <span>/</span>
        <router-link to="/collections">Collections</router-link>
        <span>/</span>
        <span class="current">{{ collection?.title || route.params.slug }}</span>
      </div>

      <div class="page-header">
        <h1 class="page-title">{{ collection?.title || route.params.slug }}</h1>
        <p class="product-count">{{ totalProducts }} products</p>
      </div>

      <div class="toolbar">
        <div></div>
        <div class="toolbar-right">
          <label>Sort by:</label>
          <select v-model="sortBy" class="sort-select">
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-state">Loading...</div>
      <div v-else-if="!products.length" class="empty-state">No products found in this collection.</div>
      <template v-else>
        <div class="grid grid-4">
          <ProductCard v-for="product in products" :key="product.product_id || product._id" :product="product" @quickView="openQuickView" />
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">&#8592; BACK</button>
          <button
            v-for="page in Math.min(totalPages, 5)"
            :key="page"
            class="page-btn"
            :class="{ active: currentPage === page }"
            @click="goToPage(page)"
          >{{ page }}</button>
          <span v-if="totalPages > 5" class="page-ellipsis">...</span>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">NEXT &#8594;</button>
        </div>
      </template>
    </div>
    <QuickViewModal :visible="quickViewVisible" :product="quickViewProduct" @update:visible="quickViewVisible = $event" />
  </div>
</template>

<style scoped>
.collection-detail-page { padding: 20px 0 80px; }
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: var(--font-size-sm); color: var(--color-text-lighter); margin-bottom: 24px; }
.breadcrumb a:hover { color: var(--color-primary); }
.breadcrumb .current { color: var(--color-text); }
.page-header { margin-bottom: 24px; }
.page-title { font-size: var(--font-size-3xl); font-weight: 700; }
.product-count { color: var(--color-text-light); font-size: var(--font-size-sm); margin-top: 4px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border-light); }
.toolbar-right { display: flex; align-items: center; gap: 10px; font-size: var(--font-size-sm); }
.sort-select { padding: 8px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); background: white; }
.loading-state,
.empty-state { text-align: center; padding: 60px 0; color: var(--color-text-light); font-size: var(--font-size-lg); }
.pagination { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 48px; }
.page-btn { padding: 8px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: white; font-size: var(--font-size-sm); font-weight: 500; }
.page-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.page-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: white; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-ellipsis { padding: 0 8px; color: var(--color-text-lighter); }
</style>
