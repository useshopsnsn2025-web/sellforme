import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.50,
  KRW: 1320.00,
  CNY: 7.24,
  HKD: 7.82,
  TWD: 31.50,
  SGD: 1.34,
  MYR: 4.47,
  THB: 35.20,
  PHP: 56.10,
  INR: 83.10,
  AED: 3.67,
  SAR: 3.75,
  BRL: 4.97,
  MXN: 17.15,
  CHF: 0.88,
  SEK: 10.45,
  NOK: 10.55,
  DKK: 6.88,
  NZD: 1.63,
  ZAR: 18.60,
}

const SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  JPY: '¥',
  KRW: '₩',
  CNY: '¥',
  HKD: 'HK$',
  TWD: 'NT$',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
  PHP: '₱',
  INR: '₹',
  AED: 'د.إ',
  SAR: '﷼',
  BRL: 'R$',
  MXN: 'MX$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  NZD: 'NZ$',
  ZAR: 'R',
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
