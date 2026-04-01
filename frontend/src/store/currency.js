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

// Browser language → currency mapping
const LANG_CURRENCY = {
  'zh-CN': 'CNY', 'zh-TW': 'TWD', 'zh-HK': 'HKD', zh: 'CNY',
  ja: 'JPY', ko: 'KRW', th: 'THB', vi: 'USD', id: 'USD', ms: 'MYR',
  fr: 'EUR', de: 'EUR', es: 'EUR', it: 'EUR', nl: 'EUR', pt: 'BRL',
  ru: 'USD', ar: 'AED', tr: 'USD', pl: 'EUR', sv: 'SEK', nb: 'NOK', no: 'NOK', da: 'DKK',
  en: 'USD', 'en-GB': 'GBP', 'en-AU': 'AUD', 'en-CA': 'CAD', 'en-NZ': 'NZD',
  'en-IN': 'INR', 'en-SG': 'SGD', 'en-PH': 'PHP', 'en-ZA': 'ZAR',
  'en-MY': 'MYR', 'en-HK': 'HKD',
  'fr-CA': 'CAD', 'fr-CH': 'CHF', 'de-CH': 'CHF', 'it-CH': 'CHF',
  'es-MX': 'MXN', 'pt-BR': 'BRL',
  hi: 'INR', tl: 'PHP', fil: 'PHP',
}

function detectCurrency() {
  const saved = localStorage.getItem('user_currency')
  if (saved && RATES[saved]) return saved

  const lang = navigator.language || navigator.userLanguage || 'en'
  // Try exact match first, then base language
  return LANG_CURRENCY[lang] || LANG_CURRENCY[lang.split('-')[0]] || 'USD'
}

export const useCurrencyStore = defineStore('currency', () => {
  const current = ref(detectCurrency())
  const currencies = Object.keys(RATES)

  const symbol = computed(() => SYMBOLS[current.value])

  function setCurrency(code) {
    if (RATES[code]) {
      current.value = code
      localStorage.setItem('user_currency', code)
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
