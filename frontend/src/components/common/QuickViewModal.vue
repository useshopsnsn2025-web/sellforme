<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/store/cart'
import { useCurrencyStore } from '@/store/currency'

const { t } = useI18n()
const router = useRouter()
const cartStore = useCartStore()
const currencyStore = useCurrencyStore()

const props = defineProps({
  visible: { type: Boolean, default: false },
  product: { type: Object, default: null },
})
const emit = defineEmits(['update:visible'])

const quantity = ref(1)
const activeImage = ref(0)

watch(() => props.visible, (val) => {
  if (val) {
    quantity.value = 1
    activeImage.value = 0
  }
})

const productId = computed(() => props.product?.product_id || props.product?.handle || props.product?.id || props.product?._id)
const productName = computed(() => props.product?.title || props.product?.name)
const images = computed(() => {
  if (!props.product) return []
  if (props.product.images?.length) return props.product.images.map(img => img.src || img)
  if (props.product.featured_image) return [props.product.featured_image]
  if (props.product.image) return [props.product.image]
  return []
})
const currentImage = computed(() => images.value[activeImage.value] || '')
const originalPrice = computed(() => props.product?.compare_at_price || props.product?.originalPrice)
const discount = computed(() => {
  if (props.product?.discount) return props.product.discount
  if (originalPrice.value && originalPrice.value > props.product?.price) {
    return Math.round((1 - props.product.price / originalPrice.value) * 100)
  }
  return 0
})

function close() {
  emit('update:visible', false)
}

function addToCart() {
  if (!props.product) return
  cartStore.addItem({
    id: productId.value,
    name: productName.value,
    price: props.product.price,
    image: images.value[0],
    variant: 'default',
  }, quantity.value)
  cartStore.isOpen = true
  close()
}

function viewDetails() {
  close()
  router.push(`/products/${productId.value}`)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible && product" class="qv-overlay" @click.self="close">
        <div class="qv-modal">
          <button class="qv-close" @click="close" aria-label="Close">&times;</button>
          <div class="qv-body">
            <!-- Images -->
            <div class="qv-gallery">
              <div class="qv-main-image">
                <img :src="currentImage" :alt="productName" />
                <span v-if="discount" class="qv-badge">-{{ discount }}%</span>
              </div>
              <div v-if="images.length > 1" class="qv-thumbs">
                <div
                  v-for="(img, i) in images.slice(0, 5)"
                  :key="i"
                  class="qv-thumb"
                  :class="{ active: i === activeImage }"
                  @click="activeImage = i"
                >
                  <img :src="img" :alt="`${productName} ${i + 1}`" />
                </div>
              </div>
            </div>
            <!-- Info -->
            <div class="qv-info">
              <h2 class="qv-title">{{ productName }}</h2>
              <div class="qv-price">
                <span class="qv-current">{{ currencyStore.format(product.price) }}</span>
                <span v-if="originalPrice && originalPrice > product.price" class="qv-original">{{ currencyStore.format(originalPrice) }}</span>
                <span v-if="discount" class="qv-discount">Save {{ discount }}%</span>
              </div>
              <div v-if="product.rating" class="qv-rating">
                <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(product.rating) }">&#9733;</span>
                <span class="qv-reviews">({{ product.reviews_count || product.reviews || 0 }} reviews)</span>
              </div>
              <p v-if="product.description || product.body_html" class="qv-desc">
                {{ (product.description || product.body_html || '').replace(/<[^>]+>/g, '').slice(0, 200) }}{{ (product.description || product.body_html || '').length > 200 ? '...' : '' }}
              </p>
              <div class="qv-actions">
                <div class="qv-qty">
                  <button @click="quantity > 1 && quantity--" class="qty-btn">−</button>
                  <span class="qty-val">{{ quantity }}</span>
                  <button @click="quantity++" class="qty-btn">+</button>
                </div>
                <button class="btn-add-cart" @click="addToCart">
                  {{ t('product.addToCart') }}
                </button>
              </div>
              <button class="btn-details" @click="viewDetails">
                {{ t('product.viewDetails') || 'View Full Details' }} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.qv-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.qv-modal {
  background: white;
  border-radius: 12px;
  max-width: 860px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.qv-close {
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 10;
  background: none;
  border: none;
  font-size: 28px;
  color: #666;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.qv-close:hover {
  background: #f3f3f3;
  color: #333;
}

.qv-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.qv-gallery {
  padding: 24px;
  border-right: 1px solid #f0f0f0;
}

.qv-main-image {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f9f9f9;
  margin-bottom: 12px;
}

.qv-main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qv-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-danger, #ef4444);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.qv-thumbs {
  display: flex;
  gap: 8px;
}

.qv-thumb {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.qv-thumb.active {
  border-color: var(--color-primary, #6366f1);
}

.qv-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qv-info {
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qv-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  color: #1a1a1a;
  padding-right: 30px;
}

.qv-price {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.qv-current {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

.qv-original {
  font-size: 16px;
  color: #999;
  text-decoration: line-through;
}

.qv-discount {
  font-size: 13px;
  color: white;
  background: var(--color-danger, #ef4444);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.qv-rating {
  display: flex;
  align-items: center;
  gap: 6px;
}

.star {
  color: #ddd;
  font-size: 16px;
}

.star.filled {
  color: #FFC107;
}

.qv-reviews {
  font-size: 13px;
  color: #888;
}

.qv-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.qv-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.qv-qty {
  display: flex;
  align-items: center;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.qty-btn {
  width: 36px;
  height: 40px;
  border: none;
  background: #f9f9f9;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.qty-btn:hover {
  background: #eee;
}

.qty-val {
  width: 40px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.btn-add-cart {
  flex: 1;
  height: 40px;
  background: var(--color-primary, #6366f1);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add-cart:hover {
  background: var(--color-primary-hover, #4f46e5);
}

.btn-details {
  background: none;
  border: none;
  color: var(--color-primary, #6366f1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  padding: 0;
  transition: opacity 0.2s;
}

.btn-details:hover {
  opacity: 0.7;
}

/* Transition */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .qv-modal, .modal-leave-active .qv-modal {
  transition: transform 0.25s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .qv-modal {
  transform: scale(0.95);
}
.modal-leave-to .qv-modal {
  transform: scale(0.95);
}

@media (max-width: 640px) {
  .qv-body {
    grid-template-columns: 1fr;
  }
  .qv-gallery {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding: 16px;
  }
  .qv-info {
    padding: 20px 16px;
  }
}
</style>
