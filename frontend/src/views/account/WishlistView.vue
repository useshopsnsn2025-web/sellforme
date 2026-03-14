<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import api from '@/utils/api'
import { fullUrl } from '@/utils/api'
import ProductCard from '@/components/common/ProductCard.vue'
import QuickViewModal from '@/components/common/QuickViewModal.vue'

const quickViewVisible = ref(false)
const quickViewProduct = ref(null)
function openQuickView(product) {
  quickViewProduct.value = product
  quickViewVisible.value = true
}

const userStore = useUserStore()
const products = ref([])
const loading = ref(true)

async function fetchWishlist() {
  try {
    const res = await api.get('/auth/wishlist')
    products.value = res.data.products || []
  } catch {} finally {
    loading.value = false
  }
}

async function removeFromWishlist(productId) {
  await userStore.toggleWishlist(productId)
  products.value = products.value.filter(p => (p.product_id || p._id) !== productId)
}

onMounted(fetchWishlist)
</script>

<template>
  <div>
    <h2 class="section-title">My Wishlist</h2>

    <div v-if="loading" class="loading-state">Loading...</div>

    <div v-else-if="products.length" class="wishlist-grid">
      <div v-for="product in products" :key="product.product_id || product._id" class="wishlist-item">
        <ProductCard :product="product" @quickView="openQuickView" />
        <button class="remove-btn" @click="removeFromWishlist(product.product_id || product._id)" title="Remove from wishlist">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Your wishlist is empty. <router-link to="/products">Browse products</router-link></p>
    </div>
    <QuickViewModal :visible="quickViewVisible" :product="quickViewProduct" @update:visible="quickViewVisible = $event" />
  </div>
</template>

<style scoped>
.section-title { font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 24px; }
.loading-state { padding: 40px; text-align: center; color: var(--color-text-light); }
.wishlist-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.wishlist-item { position: relative; }
.remove-btn {
  position: absolute; top: 8px; right: 8px; z-index: 2;
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: white; border: 1px solid var(--color-border); border-radius: 50%;
  cursor: pointer; transition: all var(--transition-fast);
  color: var(--color-text-light);
}
.remove-btn:hover { background: #fee2e2; color: var(--color-danger); border-color: var(--color-danger); }
.empty-state { padding: 60px; text-align: center; background: var(--color-bg-light); border-radius: var(--radius-md); color: var(--color-text-light); }
.empty-state a { color: var(--color-primary); font-weight: 600; }
</style>
