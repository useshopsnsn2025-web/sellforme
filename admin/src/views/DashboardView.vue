<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const isAgent = authStore.user?.role === 'agent'

const stats = ref({})
const recentOrders = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get('/dashboard/stats')
    stats.value = res.data.stats
    recentOrders.value = res.data.recent_orders
  } catch {}
  loading.value = false
})
</script>

<template>
  <div v-loading="loading">
    <!-- Admin: 4 cards -->
    <el-row v-if="!isAgent" :gutter="20" style="margin-bottom:24px">
      <el-col :span="6">
        <el-card shadow="hover"><div class="stat-card"><div class="stat-value">{{ stats.products || 0 }}</div><div class="stat-label">产品总数</div></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><div class="stat-card"><div class="stat-value">{{ stats.collections || 0 }}</div><div class="stat-label">分类总数</div></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><div class="stat-card"><div class="stat-value">{{ stats.orders || 0 }}</div><div class="stat-label">订单总数</div></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><div class="stat-card"><div class="stat-value">{{ stats.users || 0 }}</div><div class="stat-label">用户总数</div></div></el-card>
      </el-col>
    </el-row>

    <!-- Agent: own stats -->
    <el-row v-else :gutter="20" style="margin-bottom:24px">
      <el-col :span="6">
        <el-card shadow="hover"><div class="stat-card"><div class="stat-value">{{ stats.users || 0 }}</div><div class="stat-label">我的会员</div></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><div class="stat-card"><div class="stat-value">{{ stats.orders || 0 }}</div><div class="stat-label">我的订单</div></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><div class="stat-card"><div class="stat-value">{{ stats.today_pv || 0 }}</div><div class="stat-label">今日PV</div></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><div class="stat-card"><div class="stat-value">{{ stats.today_uv || 0 }}</div><div class="stat-label">今日UV</div></div></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header><span style="font-weight:600">收入概览</span></template>
          <div style="text-align:center;padding:20px 0">
            <div style="font-size:36px;font-weight:700;color:#5356EE">${{ (stats.revenue || 0).toLocaleString() }}</div>
            <div style="color:#909399;margin-top:8px">已支付订单: {{ stats.paid_orders || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span style="font-weight:600">最近订单</span></template>
          <el-table :data="recentOrders" size="small" max-height="300">
            <el-table-column prop="order_number" label="订单号" width="130" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="total_price" label="金额" width="100">
              <template #default="{ row }">${{ row.total_price?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="financial_status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.financial_status === 'paid' ? 'success' : row.financial_status === 'pending' ? 'warning' : 'info'" size="small">{{ row.financial_status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
