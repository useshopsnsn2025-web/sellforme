<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/utils/api'

const { t } = useI18n()
const collections = ref([])
const loading = ref(false)

async function fetchCollections() {
  loading.value = true
  try {
    const res = await api.get('/collections')
    collections.value = res.data.collections
  } catch {} finally {
    loading.value = false
  }
}

onMounted(fetchCollections)
</script>

<template>
  <div class="collections-page">
    <div class="container">
      <div class="page-header text-center">
        <h1 class="page-title">{{ t('collections.title') }}</h1>
        <p class="page-desc">{{ t('collections.subtitle') }}</p>
      </div>

      <div v-if="loading" class="loading-state">Loading...</div>
      <div v-else-if="!collections.length" class="empty-state">No collections found.</div>
      <div v-else class="collections-grid">
        <router-link
          v-for="col in collections"
          :key="col.handle"
          :to="`/collections/${col.handle}`"
          class="collection-card"
        >
          <div class="collection-image-wrap">
            <img v-if="col.image" :src="col.image" :alt="col.title" class="collection-image" loading="lazy" />
            <div v-else class="collection-placeholder">{{ col.title?.charAt(0) }}</div>
            <div class="collection-overlay">
              <span class="collection-count">{{ t('collections.productsCount', { count: col.products_count || 0 }) }}</span>
            </div>
          </div>
          <h3 class="collection-name">{{ col.title }}</h3>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collections-page {
  padding: 40px 0 80px;
}

.page-header {
  margin-bottom: 48px;
}

.page-title {
  font-size: var(--font-size-4xl);
  font-weight: 700;
}

.page-desc {
  color: var(--color-text-light);
  font-size: var(--font-size-base);
  margin-top: 8px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--color-text-light);
  font-size: var(--font-size-lg);
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.collection-card {
  text-align: center;
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform var(--transition-fast);
}

.collection-card:hover {
  transform: translateY(-4px);
}

.collection-image-wrap {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-gray);
}

.collection-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.collection-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  color: var(--color-text-lighter);
  background: var(--color-bg-gray);
}

.collection-card:hover .collection-image {
  transform: scale(1.08);
}

.collection-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.collection-card:hover .collection-overlay {
  opacity: 1;
}

.collection-count {
  color: white;
  font-size: var(--font-size-sm);
  font-weight: 600;
  background: rgba(0,0,0,0.5);
  padding: 6px 16px;
  border-radius: var(--radius-full);
}

.collection-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-top: 12px;
  color: var(--color-text);
}

@media (max-width: 1024px) {
  .collections-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
