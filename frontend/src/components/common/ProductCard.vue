<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/store/cart'
import { useCurrencyStore } from '@/store/currency'

const { t } = useI18n()

const props = defineProps({
  product: { type: Object, required: true },
})

const router = useRouter()
const cartStore = useCartStore()
const currencyStore = useCurrencyStore()

const emit = defineEmits(['quickView'])

// Support both mock data format and real API format
const productId = computed(() => props.product.product_id || props.product.handle || props.product.id || props.product._id)
const productName = computed(() => props.product.title || props.product.name)
const productImage = computed(() => props.product.featured_image || props.product.images?.[0]?.src || props.product.image)
const productOriginalPrice = computed(() => props.product.compare_at_price || props.product.originalPrice)
const productDiscount = computed(() => {
  if (props.product.discount) return props.product.discount
  if (productOriginalPrice.value && productOriginalPrice.value > props.product.price) {
    return Math.round((1 - props.product.price / productOriginalPrice.value) * 100)
  }
  return 0
})
const productReviews = computed(() => props.product.reviews_count || props.product.reviews || 0)

function addToCart() {
  cartStore.addItem({
    id: productId.value,
    name: productName.value,
    price: props.product.price,
    image: productImage.value,
    variant: 'default',
  })
}

function goToProduct() {
  router.push(`/products/${productId.value}`)
}
</script>

<template>
  <div class="product-card" @click="goToProduct">
    <div class="product-image-wrap">
      <img :src="productImage" :alt="productName" class="product-image" loading="lazy" />
      <span v-if="productDiscount" class="discount-badge">-{{ productDiscount }}%</span>
      <div class="product-actions">
        <button class="action-btn quick-view" @click.stop="emit('quickView', product)">
          {{ t('product.quickView') }}
        </button>
      </div>
    </div>
    <div class="product-info">
      <h3 class="product-name">{{ productName }}</h3>
      <div class="product-rating" v-if="product.rating">
        <div class="stars">
          <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(product.rating) }">&#9733;</span>
        </div>
        <span class="review-count">({{ productReviews }})</span>
      </div>
      <div class="product-price">
        <span class="current-price">{{ currencyStore.format(product.price) }}</span>
        <span v-if="productOriginalPrice && productOriginalPrice > product.price" class="original-price">{{ currencyStore.format(productOriginalPrice) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  cursor: pointer;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: white;
  transition: box-shadow var(--transition-normal);
}

.product-card:hover {
  box-shadow: var(--shadow-md);
}

.product-image-wrap {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-bg-gray);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.discount-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-danger);
  color: white;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.product-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  transform: translateY(100%);
  transition: transform var(--transition-normal);
}

.product-card:hover .product-actions {
  transform: translateY(0);
}

.action-btn {
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.5px;
  transition: all var(--transition-fast);
}

.quick-view {
  background: white;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.quick-view:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.add-cart {
  background: var(--color-primary);
  color: white;
}

.add-cart:hover {
  background: var(--color-primary-hover);
}

.product-info {
  padding: 14px;
}

.product-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.stars {
  display: flex;
  gap: 1px;
}

.star {
  color: #ddd;
  font-size: 14px;
}

.star.filled {
  color: #FFC107;
}

.review-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-lighter);
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-price {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text);
}

.original-price {
  font-size: var(--font-size-sm);
  color: var(--color-text-lighter);
  text-decoration: line-through;
}
</style>
