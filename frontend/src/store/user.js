import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || '')
  const wishlist = ref(JSON.parse(localStorage.getItem('wishlist') || '[]'))

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function login(userData, authToken) {
    user.value = userData
    token.value = authToken
    wishlist.value = userData.wishlist || []
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('wishlist', JSON.stringify(wishlist.value))
  }

  function logout() {
    user.value = null
    token.value = ''
    wishlist.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('wishlist')
  }

  // Restore session on page refresh
  async function restoreSession() {
    if (!token.value) return
    try {
      const res = await api.get('/auth/me')
      user.value = res.data.user
      wishlist.value = res.data.user.wishlist || []
      localStorage.setItem('user', JSON.stringify(res.data.user))
      localStorage.setItem('wishlist', JSON.stringify(wishlist.value))
    } catch {
      logout()
    }
  }

  // Toggle wishlist - sync with server
  async function toggleWishlist(productId) {
    const index = wishlist.value.indexOf(productId)
    if (index > -1) {
      wishlist.value.splice(index, 1)
    } else {
      wishlist.value.push(productId)
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist.value))

    // Sync to server if logged in
    if (token.value) {
      try {
        await api.post('/auth/wishlist', { product_id: productId })
      } catch {}
    }
  }

  function isInWishlist(productId) {
    return wishlist.value.includes(productId)
  }

  return {
    user, token, wishlist, isLoggedIn,
    login, logout, restoreSession, toggleWishlist, isInWishlist,
  }
})
