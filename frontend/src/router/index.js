import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/ProductsView.vue'),
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('@/views/ProductDetailView.vue'),
  },
  {
    path: '/collections',
    name: 'Collections',
    component: () => import('@/views/CollectionsView.vue'),
  },
  {
    path: '/collections/:slug',
    name: 'CollectionDetail',
    component: () => import('@/views/CollectionDetailView.vue'),
  },
  {
    path: '/blogs',
    name: 'Blogs',
    component: () => import('@/views/BlogsView.vue'),
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/CartView.vue'),
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/views/CheckoutView.vue'),
  },
  {
    path: '/account/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/account/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
  },
  {
    path: '/account/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPasswordView.vue'),
  },
  {
    path: '/account',
    name: 'Account',
    component: () => import('@/views/AccountView.vue'),
    children: [
      {
        path: '',
        name: 'AccountDashboard',
        component: () => import('@/views/account/DashboardView.vue'),
      },
      {
        path: 'orders',
        name: 'AccountOrders',
        component: () => import('@/views/account/OrdersView.vue'),
      },
      {
        path: 'addresses',
        name: 'AccountAddresses',
        component: () => import('@/views/account/AddressesView.vue'),
      },
      {
        path: 'wishlist',
        name: 'AccountWishlist',
        component: () => import('@/views/account/WishlistView.vue'),
      },
    ],
  },
  {
    path: '/tracking',
    name: 'Tracking',
    component: () => import('@/views/TrackingView.vue'),
  },
  {
    path: '/pages/:slug',
    name: 'StaticPage',
    component: () => import('@/views/StaticPageView.vue'),
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/SearchView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
