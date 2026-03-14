<script setup>
import { ref, computed, watch } from 'vue'
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
const query = computed(() => route.query.q || '')
const results = ref([])
const loading = ref(false)
const totalResults = ref(0)

async function doSearch(q) {
  if (!q) { results.value = []; totalResults.value = 0; return }
  loading.value = true
  try {
    const res = await api.get('/products', { params: { search: q, limit: 48 } })
    results.value = res.data.products
    totalResults.value = res.data.pagination.total
  } catch {} finally {
    loading.value = false
  }
}

watch(query, doSearch, { immediate: true })
</script>

<template>
  <div class="search-page">
    <div class="container">
      <h1 class="page-title">Search Results</h1>
      <p class="search-info" v-if="query">Showing {{ totalResults }} results for "<strong>{{ query }}</strong>"</p>

      <div v-if="loading" class="loading-state">Loading...</div>
      <div v-else-if="results.length" class="grid grid-4">
        <ProductCard v-for="product in results" :key="product.product_id || product._id" :product="product" @quickView="openQuickView" />
      </div>
      <div v-else class="empty-state text-center">
        <p>No results found. Try a different search term.</p>
      </div>
    </div>
    <QuickViewModal :visible="quickViewVisible" :product="quickViewProduct" @update:visible="quickViewVisible = $event" />
  </div>
</template>

<style scoped>
.search-page { padding: 40px 0 80px; }
.page-title { font-size: var(--font-size-3xl); font-weight: 700; margin-bottom: 8px; }
.search-info { color: var(--color-text-light); font-size: var(--font-size-sm); margin-bottom: 32px; }
.loading-state { text-align: center; padding: 60px 0; color: var(--color-text-light); }
.empty-state { padding: 80px 20px; color: var(--color-text-light); }
</style>
