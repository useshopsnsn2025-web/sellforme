<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)

async function fetchOrder() {
  loading.value = true
  try {
    const res = await api.get(`/orders/${route.params.id}`)
    order.value = res.data.order
  } catch {}
  loading.value = false
}

async function updateStatus(field, value) {
  try {
    await api.put(`/orders/${route.params.id}`, { [field]: value })
    ElMessage.success('更新成功')
    fetchOrder()
  } catch {}
}

async function cancelOrder() {
  await ElMessageBox.confirm('确定要取消该订单吗？', '提示', { type: 'warning' })
  await api.post(`/orders/${route.params.id}/cancel`)
  ElMessage.success('订单已取消')
  fetchOrder()
}

onMounted(fetchOrder)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">订单详情 {{ order?.order_number }}</h2>
      <el-button @click="router.back()">返回</el-button>
    </div>

    <template v-if="order">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card style="margin-bottom:20px">
            <template #header><span style="font-weight:600">商品明细</span></template>
            <el-table :data="order.line_items">
              <el-table-column label="图片" width="70">
                <template #default="{ row }">
                  <el-image :src="row.image" style="width:40px;height:40px;border-radius:4px" fit="cover" />
                </template>
              </el-table-column>
              <el-table-column prop="title" label="名称" />
              <el-table-column prop="variant_title" label="规格" width="120" />
              <el-table-column prop="quantity" label="数量" width="80" />
              <el-table-column prop="price" label="单价" width="100">
                <template #default="{ row }">${{ row.price?.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="小计" width="100">
                <template #default="{ row }">${{ (row.price * row.quantity).toFixed(2) }}</template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card v-if="order.shipping_address">
            <template #header><span style="font-weight:600">收货地址</span></template>
            <p>{{ order.shipping_address.first_name }} {{ order.shipping_address.last_name }}</p>
            <p>{{ order.shipping_address.address1 }} {{ order.shipping_address.address2 }}</p>
            <p>{{ order.shipping_address.city }}, {{ order.shipping_address.province }} {{ order.shipping_address.zip }}</p>
            <p>{{ order.shipping_address.country }}</p>
            <p v-if="order.shipping_address.phone">电话: {{ order.shipping_address.phone }}</p>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card style="margin-bottom:20px">
            <template #header><span style="font-weight:600">订单信息</span></template>
            <div style="display:flex;flex-direction:column;gap:12px;font-size:14px">
              <div><span style="color:#909399">邮箱:</span> {{ order.email }}</div>
              <div><span style="color:#909399">创建时间:</span> {{ new Date(order.createdAt).toLocaleString() }}</div>
              <div><span style="color:#909399">小计:</span> ${{ order.subtotal_price?.toFixed(2) }}</div>
              <div><span style="color:#909399">运费:</span> ${{ order.total_shipping?.toFixed(2) }}</div>
              <div v-if="order.total_discounts"><span style="color:#909399">折扣:</span> -${{ order.total_discounts?.toFixed(2) }}</div>
              <div style="font-weight:600;font-size:16px"><span style="color:#909399">总计:</span> ${{ order.total_price?.toFixed(2) }}</div>
            </div>
          </el-card>

          <el-card style="margin-bottom:20px">
            <template #header><span style="font-weight:600">状态管理</span></template>
            <el-form label-width="80px">
              <el-form-item label="支付状态">
                <el-select :model-value="order.financial_status" style="width:100%" @change="v => updateStatus('financial_status', v)">
                  <el-option label="待支付" value="pending" />
                  <el-option label="已支付" value="paid" />
                  <el-option label="已退款" value="refunded" />
                </el-select>
              </el-form-item>
              <el-form-item label="物流状态">
                <el-select :model-value="order.fulfillment_status" style="width:100%" @change="v => updateStatus('fulfillment_status', v)">
                  <el-option label="未发货" value="unfulfilled" />
                  <el-option label="部分发货" value="partial" />
                  <el-option label="已发货" value="fulfilled" />
                </el-select>
              </el-form-item>
              <el-form-item label="物流单号">
                <el-input :model-value="order.tracking_number" placeholder="输入后按回车" @change="v => updateStatus('tracking_number', v)" />
              </el-form-item>
            </el-form>
            <el-button type="danger" plain style="width:100%" @click="cancelOrder" :disabled="order.financial_status === 'voided'">取消订单</el-button>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>
