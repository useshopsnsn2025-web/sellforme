<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/store/cart'
import { useCurrencyStore } from '@/store/currency'
import { useUserStore } from '@/store/user'
import { navMenus } from '@/utils/mockData'

const { t } = useI18n()
const router = useRouter()
const cartStore = useCartStore()
const currencyStore = useCurrencyStore()
const userStore = useUserStore()

const searchQuery = ref('')
const searchOpen = ref(false)
const activeMenu = ref(null)
const mobileMenuOpen = ref(false)
const currencyDropdownOpen = ref(false)
const langDropdownOpen = ref(false)

const languages = [
  { code: 'en', label: 'English', flag: 'us' },
  { code: 'zh-CN', label: '简体中文', flag: 'cn' },
  { code: 'zh-TW', label: '繁體中文', flag: 'tw' },
  { code: 'ja', label: '日本語', flag: 'jp' },
  { code: 'ko', label: '한국어', flag: 'kr' },
  { code: 'fr', label: 'Français', flag: 'fr' },
  { code: 'de', label: 'Deutsch', flag: 'de' },
  { code: 'es', label: 'Español', flag: 'es' },
  { code: 'pt', label: 'Português', flag: 'pt' },
  { code: 'ru', label: 'Русский', flag: 'ru' },
  { code: 'ar', label: 'العربية', flag: 'sa' },
  { code: 'it', label: 'Italiano', flag: 'it' },
  { code: 'nl', label: 'Nederlands', flag: 'nl' },
  { code: 'th', label: 'ไทย', flag: 'th' },
  { code: 'vi', label: 'Tiếng Việt', flag: 'vn' },
  { code: 'id', label: 'Bahasa Indonesia', flag: 'id' },
  { code: 'ms', label: 'Bahasa Melayu', flag: 'my' },
  { code: 'tr', label: 'Türkçe', flag: 'tr' },
  { code: 'pl', label: 'Polski', flag: 'pl' },
  { code: 'sv', label: 'Svenska', flag: 'se' },
]

const currentLang = ref(languages[0])

function initCurrentLang() {
  const cookie = document.cookie.match(/googtrans=\/en\/([^;]+)/)
  if (cookie) {
    const found = languages.find(l => l.code === cookie[1])
    if (found) currentLang.value = found
    return
  }

  // First visit: auto-detect browser language (only once)
  if (sessionStorage.getItem('lang_detected')) return
  sessionStorage.setItem('lang_detected', '1')

  const browserLang = navigator.language || navigator.userLanguage || 'en'
  // Try exact match first (e.g. zh-CN, zh-TW), then prefix match (e.g. zh -> zh-CN, th -> th)
  const exact = languages.find(l => l.code.toLowerCase() === browserLang.toLowerCase())
  const prefix = !exact && languages.find(l => l.code.toLowerCase().startsWith(browserLang.split('-')[0].toLowerCase()))
  const match = exact || prefix
  if (match && match.code !== 'en') {
    currentLang.value = match
    document.cookie = 'googtrans=/en/' + match.code + '; path=/'
    document.cookie = 'googtrans=/en/' + match.code + '; path=/; domain=' + location.hostname
    location.reload()
  }
}
initCurrentLang()

function selectLanguage(lang) {
  langDropdownOpen.value = false
  currentLang.value = lang

  if (lang.code === 'en') {
    // Reset to original
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
    document.cookie = 'googtrans=; path=/; domain=' + location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 UTC'
    location.reload()
    return
  }

  document.cookie = 'googtrans=/en/' + lang.code + '; path=/'
  document.cookie = 'googtrans=/en/' + lang.code + '; path=/; domain=' + location.hostname

  // Trigger Google Translate
  const sel = document.querySelector('#google_translate_element select')
  if (sel) {
    sel.value = lang.code
    sel.dispatchEvent(new Event('change'))
  } else {
    location.reload()
  }
}

function langFlagUrl(flag) { return `https://flagcdn.com/w40/${flag}.png` }

function handleDocClick(e) {
  if (!e.target.closest('.notranslate')) langDropdownOpen.value = false
}
onMounted(() => document.addEventListener('click', handleDocClick))
onUnmounted(() => document.removeEventListener('click', handleDocClick))

const totalItems = computed(() => cartStore.totalItems)

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
    searchQuery.value = ''
    searchOpen.value = false
  }
}

function toggleCurrencyDropdown() {
  currencyDropdownOpen.value = !currencyDropdownOpen.value
}

function selectCurrency(code) {
  currencyStore.setCurrency(code)
  currencyDropdownOpen.value = false
}

const currencyFlags = {
  USD: 'us', EUR: 'eu', GBP: 'gb', CAD: 'ca', AUD: 'au',
  JPY: 'jp', KRW: 'kr', CNY: 'cn', HKD: 'hk', TWD: 'tw',
  SGD: 'sg', MYR: 'my', THB: 'th', PHP: 'ph', INR: 'in',
  AED: 'ae', SAR: 'sa', BRL: 'br', MXN: 'mx', CHF: 'ch',
  SEK: 'se', NOK: 'no', DKK: 'dk', NZD: 'nz', ZAR: 'za',
}
function flagUrl(code) { return `https://flagcdn.com/w40/${currencyFlags[code]}.png` }

</script>

<template>
  <!-- Announcement Bar -->
  <div class="announcement-bar">
    <div class="container">
      <p>{{ t('announcement.freeShipping') }}</p>
    </div>
  </div>

  <!-- Main Header -->
  <header class="header" :class="{ 'menu-open': mobileMenuOpen }">
    <div class="container header-inner">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <span class="logo-text">SellForMe</span>
      </router-link>

      <!-- Search Bar (Desktop) -->
      <div class="search-bar" :class="{ active: searchOpen }">
        <form @submit.prevent="handleSearch" class="search-form">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('header.searchPlaceholder')"
            class="search-input"
          />
          <button type="submit" class="search-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>
      </div>

      <!-- Header Actions -->
      <div class="header-actions">
        <!-- Language Selector -->
        <div class="currency-selector notranslate" @click.stop="langDropdownOpen = !langDropdownOpen">
          <img class="currency-flag" :src="langFlagUrl(currentLang.flag)" :alt="currentLang.label" />
          <span>{{ currentLang.label }}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
          <div class="currency-dropdown lang-dropdown" v-show="langDropdownOpen">
            <div
              v-for="lang in languages"
              :key="lang.code"
              class="currency-option"
              :class="{ active: lang.code === currentLang.code }"
              @click.stop="selectLanguage(lang)"
            >
              <img class="currency-flag" :src="langFlagUrl(lang.flag)" :alt="lang.label" />
              {{ lang.label }}
            </div>
          </div>
        </div>

        <!-- Currency Selector -->
        <div class="currency-selector" @click="toggleCurrencyDropdown">
          <img class="currency-flag" :src="flagUrl(currencyStore.current)" :alt="currencyStore.current" />
          <span>{{ currencyStore.current }}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
          <div class="currency-dropdown" v-show="currencyDropdownOpen">
            <div
              v-for="c in currencyStore.currencies"
              :key="c"
              class="currency-option"
              :class="{ active: c === currencyStore.current }"
              @click.stop="selectCurrency(c)"
            >
              <img class="currency-flag" :src="flagUrl(c)" :alt="c" />
              {{ c }}
            </div>
          </div>
        </div>

        <!-- Search Toggle (Mobile) -->
        <button class="icon-btn search-toggle" @click="searchOpen = !searchOpen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </button>

        <!-- Account -->
        <router-link :to="userStore.isLoggedIn ? '/account' : '/account/login'" class="icon-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="icon-label">{{ userStore.isLoggedIn ? (userStore.user?.first_name || t('common.account')) : t('common.account') }}</span>
        </router-link>

        <!-- Cart -->
        <button class="icon-btn cart-btn" @click="cartStore.toggleCart()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span class="cart-count" v-if="totalItems > 0">{{ totalItems }}</span>
        </button>

        <!-- Mobile Menu Toggle -->
        <button class="icon-btn hamburger" @click="mobileMenuOpen = !mobileMenuOpen">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="main-nav" :class="{ open: mobileMenuOpen }">
      <div class="container">
        <ul class="nav-list">
          <li
            v-for="(menu, index) in navMenus"
            :key="index"
            class="nav-item"
            :class="{ 'has-children': menu.children }"
            @mouseenter="activeMenu = index"
            @mouseleave="activeMenu = null"
          >
            <router-link v-if="menu.path" :to="menu.path" class="nav-link" @click="mobileMenuOpen = false">
              {{ menu.title }}
            </router-link>
            <span v-else class="nav-link">
              {{ menu.title }}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </span>

            <!-- Dropdown -->
            <ul v-if="menu.children" class="dropdown" :class="{ active: activeMenu === index }">
              <li v-for="child in menu.children" :key="child.path">
                <router-link :to="child.path" class="dropdown-link" @click="mobileMenuOpen = false; activeMenu = null">
                  {{ child.title }}
                </router-link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.announcement-bar {
  background-color: var(--color-secondary);
  color: var(--color-text-white);
  text-align: center;
  padding: 10px 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  height: var(--announcement-height);
  display: flex;
  align-items: center;
}

.header {
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  gap: 24px;
}

.logo { flex-shrink: 0; }
.logo-text { font-size: 24px; font-weight: 700; color: var(--color-primary); letter-spacing: -0.5px; }

.search-bar { flex: 1; max-width: 500px; }
.search-form { display: flex; align-items: center; background: var(--color-bg-gray); border-radius: var(--radius-full); padding: 0 4px 0 16px; height: 42px; border: 2px solid transparent; transition: border-color var(--transition-fast); }
.search-form:focus-within { border-color: var(--color-primary); }
.search-input { flex: 1; border: none; background: none; height: 100%; font-size: var(--font-size-sm); color: var(--color-text); }
.search-input::placeholder { color: var(--color-text-lighter); }
.search-btn { width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; transition: background var(--transition-fast); }
.search-btn:hover { background: var(--color-primary-hover); }

.header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.icon-btn { display: flex; align-items: center; gap: 6px; padding: 8px; background: none; color: var(--color-text); border-radius: var(--radius-md); transition: background var(--transition-fast); position: relative; }
.icon-btn:hover { background: var(--color-bg-gray); color: var(--color-text); }
.icon-label { font-size: var(--font-size-sm); font-weight: 500; }

.cart-btn { position: relative; }
.cart-count { position: absolute; top: 0; right: 0; background: var(--color-primary); color: white; width: 18px; height: 18px; border-radius: 50%; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; }

/* Currency Selector */
.currency-selector { display: flex; align-items: center; gap: 4px; padding: 8px 12px; cursor: pointer; font-size: var(--font-size-sm); font-weight: 500; position: relative; border-radius: var(--radius-md); transition: background var(--transition-fast); }
.currency-selector:hover { background: var(--color-bg-gray); }
.currency-dropdown { position: absolute; top: 100%; right: 0; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); min-width: 100px; z-index: 10; overflow-y: auto; max-height: 360px; }
.currency-flag { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; }
.currency-option { padding: 8px 16px; cursor: pointer; font-size: var(--font-size-sm); transition: background var(--transition-fast); display: flex; align-items: center; gap: 6px; }
.currency-option:hover, .currency-option.active { background: var(--color-bg-gray); color: var(--color-primary); }
.lang-dropdown { max-height: 320px; overflow-y: auto; min-width: 160px; }

.search-toggle { display: none; }
.hamburger { display: none; flex-direction: column; gap: 5px; padding: 10px 8px; }
.hamburger span { width: 20px; height: 2px; background: var(--color-text); transition: all var(--transition-fast); }

/* Navigation */
.main-nav { background: var(--color-bg); border-bottom: 1px solid var(--color-border-light); }
.nav-list { display: flex; align-items: center; gap: 0; }
.nav-item { position: relative; }
.nav-link { display: flex; align-items: center; gap: 4px; padding: 14px 18px; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text); cursor: pointer; transition: color var(--transition-fast); white-space: nowrap; }
.nav-link:hover { color: var(--color-primary); }
.dropdown { position: absolute; top: 100%; left: 0; background: white; border: 1px solid var(--color-border-light); border-radius: 0 0 var(--radius-md) var(--radius-md); box-shadow: var(--shadow-md); min-width: 220px; opacity: 0; visibility: hidden; transform: translateY(5px); transition: all var(--transition-fast); z-index: 50; }
.dropdown.active { opacity: 1; visibility: visible; transform: translateY(0); }
.dropdown-link { display: block; padding: 10px 20px; font-size: var(--font-size-sm); color: var(--color-text); transition: all var(--transition-fast); }
.dropdown-link:hover { background: var(--color-bg-gray); color: var(--color-primary); padding-left: 24px; }

/* Responsive */
@media (max-width: 768px) {
  .search-bar { display: none; }
  .search-bar.active { display: block; position: absolute; top: var(--header-height); left: 0; right: 0; max-width: none; padding: 12px 20px; background: white; border-bottom: 1px solid var(--color-border); z-index: 50; }
  .search-toggle { display: flex; }
  .icon-label { display: none; }
  .hamburger { display: flex; }
  .main-nav { display: none; }
  .main-nav.open { display: block; position: absolute; top: 100%; left: 0; right: 0; background: white; box-shadow: var(--shadow-lg); z-index: 50; max-height: 70vh; overflow-y: auto; }
  .nav-list { flex-direction: column; align-items: stretch; }
  .dropdown { position: static; opacity: 1; visibility: visible; transform: none; box-shadow: none; border: none; background: var(--color-bg-light); }
}
</style>
