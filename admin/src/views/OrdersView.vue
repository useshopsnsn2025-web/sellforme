<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

const router = useRouter()
const orders = ref([])
const pagination = ref({ page: 1, limit: 20, total: 0 })
const search = ref('')
const statusFilter = ref('')
const loading = ref(true)

async function fetchOrders() {
  loading.value = true
  try {
    const res = await api.get('/orders', {
      params: { page: pagination.value.page, limit: pagination.value.limit, search: search.value || undefined, financial_status: statusFilter.value || undefined }
    })
    orders.value = res.data.orders
    pagination.value = { ...pagination.value, ...res.data.pagination }
  } catch {}
  loading.value = false
}

function handleSearch() {
  pagination.value.page = 1
  fetchOrders()
}

function handlePageChange(page) {
  pagination.value.page = page
  fetchOrders()
}

const statusMap = {
  pending: { label: '待支付', type: 'warning' },
  paid: { label: '已支付', type: 'success' },
  refunded: { label: '已退款', type: 'info' },
  partially_refunded: { label: '部分退款', type: 'info' },
  voided: { label: '已取消', type: 'danger' }
}

onMounted(fetchOrders)
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">订单管理</h2>
    </div>

    <el-card v-loading="loading">
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <el-input v-model="search" placeholder="搜索订单号/邮箱" clearable style="width:280px" @keyup.enter="handleSearch" @clear="handleSearch">
          <template #append><el-button icon="Search" @click="handleSearch" /></template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="支付状态" clearable style="width:140px" @change="handleSearch">
          <el-option label="待支付" value="pending" />
          <el-option label="已支付" value="paid" />
          <el-option label="已退款" value="refunded" />
          <el-option label="已取消" value="voided" />
        </el-select>
      </div>

      <el-table :data="orders">
        <el-table-column prop="order_number" label="订单号" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column label="商品数" width="80">
          <template #default="{ row }">{{ row.line_items?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="total_price" label="总额" width="100">
          <template #default="{ row }">${{ row.total_price?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="financial_status" label="支付状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.financial_status]?.type || 'info'" size="small">{{ statusMap[row.financial_status]?.label || row.financial_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fulfillment_status" label="物流状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.fulfillment_status === 'fulfilled' ? 'success' : 'warning'" size="small">{{ row.fulfillment_status === 'fulfilled' ? '已发货' : row.fulfillment_status === 'partial' ? '部分发货' : '未发货' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="router.push(`/orders/${row._id}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination v-model:current-page="pagination.page" :page-size="pagination.limit" :total="pagination.total" layout="total, prev, pager, next" @current-change="handlePageChange" />
      </div>
    </el-card>
  </div>
</template>
