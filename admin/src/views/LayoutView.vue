<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const allMenuItems = [
  { path: '/dashboard', title: '仪表板', icon: 'DataBoard' },
  { path: '/products', title: '产品管理', icon: 'Goods', adminOnly: true },
  { path: '/collections', title: '分类管理', icon: 'FolderOpened', adminOnly: true },
  { path: '/orders', title: '订单管理', icon: 'List' },
  { path: '/users', title: '会员管理', icon: 'User' },
  { path: '/admins', title: '管理员管理', icon: 'UserFilled', adminOnly: true },
  { path: '/agents', title: '代理管理', icon: 'Avatar', adminOnly: true },
  { path: '/scraper', title: '数据采集', icon: 'Download', adminOnly: true },
  { path: '/whatsapp', title: 'WhatsApp管理', icon: 'ChatDotRound' },
  { path: '/traffic', title: '流量统计', icon: 'TrendCharts' },
  { path: '/subscribers', title: '邮件订阅', icon: 'Message', adminOnly: true },
  { path: '/decoration', title: '页面装修', icon: 'Brush', adminOnly: true },
  { path: '/oauth', title: '登录配置', icon: 'Key', adminOnly: true },
  { path: '/site-config', title: '系统设置', icon: 'Setting', adminOnly: true },
]

const menuItems = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return allMenuItems
  return allMenuItems.filter(item => !item.adminOnly)
})

async function handleLogout() {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-logo">SellForMe</div>
      <el-menu :default-active="route.path" background-color="#1d1e1f" text-color="#bfcbd9" active-text-color="#5356EE" router>
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </aside>
    <div class="admin-main">
      <header class="admin-header">
        <span style="font-size:16px;font-weight:600;color:#303133">{{ route.meta.title || 'Admin' }}</span>
        <div style="display:flex;align-items:center;gap:16px">
          <span style="font-size:14px;color:#606266">{{ authStore.user?.email }}</span>
          <el-button text @click="handleLogout">退出</el-button>
        </div>
      </header>
      <div class="admin-content">
        <router-view />
      </div>
    </div>
  </div>
</template>
