import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { trackAddToCart } from '@/utils/tracker'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const isOpen = ref(false)
  const couponCode = ref('')
  const couponDiscount = ref(0)

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  const total = computed(() => {
    const discount = couponDiscount.value
    return Math.max(0, subtotal.value - discount)
  })

  function addItem(product, quantity = 1) {
    trackAddToCart(product)
    const existing = items.value.find(
      (item) => item.id === product.id && item.variant === product.variant
    )
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({ ...product, quantity })
    }
  }

  function removeItem(index) {
    items.value.splice(index, 1)
  }

  function updateQuantity(index, quantity) {
    if (quantity <= 0) {
      removeItem(index)
    } else {
      items.value[index].quantity = quantity
    }
  }

  function clearCart() {
    items.value = []
    couponCode.value = ''
    couponDiscount.value = 0
  }

  function toggleCart() {
    isOpen.value = !isOpen.value
  }

  function applyCoupon(code) {
    couponCode.value = code
    couponDiscount.value = subtotal.value * 0.1
  }

  return {
    items, isOpen, couponCode, couponDiscount,
    totalItems, subtotal, total,
    addItem, removeItem, updateQuantity, clearCart, toggleCart, applyCoupon,
  }
}, {
  persist: true,
})
