import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    component: () => import('../views/LayoutView.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: '仪表板' } },
      { path: 'products', name: 'Products', component: () => import('../views/ProductsView.vue'), meta: { title: '产品管理' } },
      { path: 'products/add', name: 'ProductAdd', component: () => import('../views/ProductEditView.vue'), meta: { title: '添加产品' } },
      { path: 'products/edit/:id', name: 'ProductEdit', component: () => import('../views/ProductEditView.vue'), meta: { title: '编辑产品' } },
      { path: 'collections', name: 'Collections', component: () => import('../views/CollectionsView.vue'), meta: { title: '分类管理' } },
      { path: 'orders', name: 'Orders', component: () => import('../views/OrdersView.vue'), meta: { title: '订单管理' } },
      { path: 'orders/:id', name: 'OrderDetail', component: () => import('../views/OrderDetailView.vue'), meta: { title: '订单详情' } },
      { path: 'users', name: 'Users', component: () => import('../views/UsersView.vue'), meta: { title: '会员管理' } },
      { path: 'admins', name: 'Admins', component: () => import('../views/AdminsView.vue'), meta: { title: '管理员管理', adminOnly: true } },
      { path: 'agents', name: 'Agents', component: () => import('../views/AgentsView.vue'), meta: { title: '代理管理', adminOnly: true } },
      { path: 'scraper', name: 'Scraper', component: () => import('../views/ScraperView.vue'), meta: { title: '数据采集', adminOnly: true } },
      { path: 'whatsapp', name: 'WhatsApp', component: () => import('../views/WhatsAppView.vue'), meta: { title: 'WhatsApp管理' } },
      { path: 'line', name: 'Line', component: () => import('../views/LineView.vue'), meta: { title: 'LINE管理' } },
      { path: 'traffic', name: 'Traffic', component: () => import('../views/TrafficView.vue'), meta: { title: '流量统计' } },
      { path: 'subscribers', name: 'Subscribers', component: () => import('../views/SubscribersView.vue'), meta: { title: '邮件订阅', adminOnly: true } },
      { path: 'decoration', name: 'Decoration', component: () => import('../views/DecorationView.vue'), meta: { title: '页面装修', adminOnly: true } },
      { path: 'oauth', name: 'OAuth', component: () => import('../views/OAuthView.vue'), meta: { title: '登录配置', adminOnly: true } },
      { path: 'site-config', name: 'SiteConfig', component: () => import('../views/SiteConfigView.vue'), meta: { title: '系统设置', adminOnly: true } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.requiresAuth && !token) return next('/login')
  if (to.meta.guest && token) return next('/')
  // Block agent from admin-only pages
  if (to.meta.adminOnly) {
    const user = JSON.parse(localStorage.getItem('admin_user') || 'null')
    if (user?.role === 'agent') return next('/dashboard')
  }
  next()
})

export default router
