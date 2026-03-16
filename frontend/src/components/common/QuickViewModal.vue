<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCurrencyStore } from '@/store/currency'
import api from '@/utils/api'

const { t } = useI18n()
const router = useRouter()
const currencyStore = useCurrencyStore()

const props = defineProps({
  visible: { type: Boolean, default: false },
  product: { type: Object, default: null },
})
const emit = defineEmits(['update:visible'])

const activeImage = ref(0)
const waPhone = ref('')
const waId = ref('')

async function fetchWhatsApp() {
  try {
    const agentRef = localStorage.getItem('agent_ref') || ''
    const res = await api.get('/whatsapp/next', { params: { agent_code: agentRef } })
    waPhone.value = res.data.phone
    waId.value = res.data.id
  } catch {}
}

async function handleWhatsAppClick() {
  if (waId.value) {
    try { await api.post('/whatsapp/click', { id: waId.value }) } catch {}
  }
  if (waPhone.value) {
    const phone = waPhone.value.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }
  fetchWhatsApp()
}

watch(() => props.visible, (val) => {
  if (val) {
    activeImage.value = 0
    fetchWhatsApp()
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
              <button class="btn-whatsapp" @click="handleWhatsAppClick">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>Chat on WhatsApp</span>
              </button>
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

.btn-whatsapp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 44px;
  background: #25D366;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 4px;
}

.btn-whatsapp:hover {
  background: #1da851;
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
