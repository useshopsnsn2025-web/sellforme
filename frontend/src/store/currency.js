import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const RATES = {
  USD: 1,
  CAD: 1.36,
  AUD: 1.53,
  EUR: 0.92,
  GBP: 0.79,
}

const SYMBOLS = {
  USD: '$',
  CAD: 'CA$',
  AUD: 'AU$',
  EUR: '€',
  GBP: '£',
}

export const useCurrencyStore = defineStore('currency', () => {
  const current = ref('USD')
  const currencies = Object.keys(RATES)

  const symbol = computed(() => SYMBOLS[current.value])

  function setCurrency(code) {
    if (RATES[code]) {
      current.value = code
    }
  }

  function convert(usdAmount) {
    return (usdAmount * RATES[current.value]).toFixed(2)
  }

  function format(usdAmount) {
    return `${SYMBOLS[current.value]}${convert(usdAmount)}`
  }

  return { current, currencies, symbol, setCurrency, convert, format }
})
