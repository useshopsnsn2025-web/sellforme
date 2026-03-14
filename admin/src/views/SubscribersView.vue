<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const activeTab = ref('subscribers')

// ===== Subscribers Tab =====
const loading = ref(false)
const list = ref([])
const total = ref(0)
const stats = ref({ total: 0, active: 0, unsubscribed: 0, recent: 0, campaignCount: 0 })
const query = ref({ page: 1, limit: 50, status: '', search: '' })

async function fetchStats() {
  try {
    const res = await api.get('/subscribers/stats')
    stats.value = res.data || {}
  } catch {}
}

async function fetchList() {
  loading.value = true
  try {
    const params = { ...query.value }
    if (!params.status) delete params.status
    if (!params.search) delete params.search
    const res = await api.get('/subscribers', { params })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`删除订阅者 ${row.email}？`, '确认', { type: 'warning' })
  await api.delete(`/subscribers/${row._id}`)
  ElMessage.success('已删除')
  fetchList()
  fetchStats()
}

function handleSearch() {
  query.value.page = 1
  fetchList()
}

function handlePageChange(p) {
  query.value.page = p
  fetchList()
}

// ===== Campaign Tab =====
const campaigns = ref([])
const campaignTotal = ref(0)
const campaignLoading = ref(false)

const composeVisible = ref(false)
const sending = ref(false)
const composeForm = ref({ subject: '', type: 'promotion', target: 'active_only', content: '' })

const previewVisible = ref(false)

const typeOptions = [
  { label: '促销活动', value: 'promotion' },
  { label: '新品推荐', value: 'new_product' },
  { label: '新闻通讯', value: 'newsletter' },
  { label: '自定义', value: 'custom' },
]
const typeLabels = { promotion: '促销活动', new_product: '新品推荐', newsletter: '新闻通讯', custom: '自定义' }
const typeTagTypes = { promotion: 'danger', new_product: 'success', newsletter: 'primary', custom: 'info' }

const templates = {
  promotion: {
    subject: 'Special Offer - Up to 50% Off!',
    content: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
  <div style="background:linear-gradient(135deg,#ff6b6b 0%,#ee5a24 100%);padding:40px 30px;text-align:center;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:32px">SPECIAL OFFER</h1>
    <p style="color:rgba(255,255,255,0.9);font-size:20px;margin:10px 0 0">Up to 50% Off Selected Items!</p>
  </div>
  <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none">
    <p style="font-size:16px;line-height:1.6">Hi there,</p>
    <p style="font-size:15px;line-height:1.6;color:#555">We have an exclusive deal just for you! For a limited time, enjoy huge discounts on our most popular products.</p>
    <div style="background:#fff3f3;border:2px dashed #ff6b6b;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
      <p style="font-size:14px;color:#666;margin:0 0 5px">Use code:</p>
      <p style="font-size:28px;font-weight:700;color:#ee5a24;margin:0;letter-spacing:3px">SAVE50</p>
    </div>
    <div style="text-align:center;margin:30px 0">
      <a href="{{site_url}}" style="background:linear-gradient(135deg,#ff6b6b 0%,#ee5a24 100%);color:#fff;padding:14px 40px;text-decoration:none;border-radius:25px;font-size:16px;font-weight:600;display:inline-block">Shop Now</a>
    </div>
    <p style="font-size:13px;color:#999;text-align:center">*Offer valid for a limited time only.</p>
  </div>
</div>`,
  },
  new_product: {
    subject: 'New Arrivals Just Dropped!',
    content: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
  <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:28px">NEW ARRIVALS</h1>
    <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:10px 0 0">Fresh Products Just for You</p>
  </div>
  <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none">
    <p style="font-size:16px;line-height:1.6">Hi there,</p>
    <p style="font-size:15px;line-height:1.6;color:#555">We're excited to announce our latest collection! Check out the newest additions to our store.</p>
    <ul style="font-size:14px;line-height:2;color:#555">
      <li>Premium quality products at great prices</li>
      <li>Trending styles and must-have items</li>
      <li>Free shipping on orders over $50</li>
    </ul>
    <div style="text-align:center;margin:30px 0">
      <a href="{{site_url}}/collections" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:14px 40px;text-decoration:none;border-radius:25px;font-size:16px;font-weight:600;display:inline-block">Explore Now</a>
    </div>
  </div>
</div>`,
  },
  newsletter: {
    subject: 'Your Weekly Update',
    content: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
  <div style="background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);padding:40px 30px;text-align:center;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:28px">Weekly Newsletter</h1>
  </div>
  <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none">
    <p style="font-size:16px;line-height:1.6">Hi there,</p>
    <p style="font-size:15px;line-height:1.6;color:#555">Here's what's new this week:</p>
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:15px 0">
      <h3 style="margin:0 0 10px;color:#333">What's New</h3>
      <p style="font-size:14px;color:#555;margin:0;line-height:1.8">We've added exciting new products to our catalog. Be the first to grab them!</p>
    </div>
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:15px 0">
      <h3 style="margin:0 0 10px;color:#333">Tip of the Week</h3>
      <p style="font-size:14px;color:#555;margin:0;line-height:1.8">Save items to your wishlist so you never miss a deal on your favorites!</p>
    </div>
    <div style="text-align:center;margin:30px 0">
      <a href="{{site_url}}" style="background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);color:#fff;padding:14px 40px;text-decoration:none;border-radius:25px;font-size:16px;font-weight:600;display:inline-block">Visit Store</a>
    </div>
  </div>
</div>`,
  },
  custom: { subject: '', content: '' },
}

async function fetchCampaigns() {
  campaignLoading.value = true
  try {
    const res = await api.get('/subscribers/campaigns', { params: { page: 1, limit: 20 } })
    campaigns.value = res.data?.list || []
    campaignTotal.value = res.data?.total || 0
  } catch {}
  campaignLoading.value = false
}

function openCompose() {
  composeForm.value = { subject: '', type: 'promotion', target: 'active_only', content: '' }
  applyTemplate('promotion')
  composeVisible.value = true
}

function applyTemplate(type) {
  const tpl = templates[type]
  if (tpl) {
    composeForm.value.subject = tpl.subject
    composeForm.value.content = tpl.content
  }
}

function handleTypeChange(type) {
  applyTemplate(type)
}

async function handleSend() {
  if (!composeForm.value.subject || !composeForm.value.content) {
    return ElMessage.warning('请填写邮件主题和内容')
  }
  const targetLabel = composeForm.value.target === 'active_only' ? '所有活跃订阅者' : '所有订阅者'
  await ElMessageBox.confirm(
    `确认向【${targetLabel}】发送邮件？\n主题：${composeForm.value.subject}`,
    '确认发送',
    { type: 'warning', confirmButtonText: '确认发送', cancelButtonText: '取消' }
  )
  sending.value = true
  try {
    const res = await api.post('/subscribers/campaigns', composeForm.value)
    ElMessage.success(res.msg || '邮件已开始发送')
    composeVisible.value = false
    fetchCampaigns()
    fetchStats()
  } catch {}
  sending.value = false
}

async function handleDeleteCampaign(row) {
  await ElMessageBox.confirm('删除该发送记录？', '确认', { type: 'warning' })
  await api.delete(`/subscribers/campaigns/${row._id}`)
  ElMessage.success('已删除')
  fetchCampaigns()
}

function formatTime(t) {
  return t ? new Date(t).toLocaleString() : '-'
}

onMounted(() => {
  fetchStats()
  fetchList()
  fetchCampaigns()
})
</script>

<template>
  <div class="subscribers-view">
    <div class="page-header">
      <h2>邮件订阅管理</h2>
    </div>

    <!-- Stats Cards -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总订阅数</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">{{ stats.active }}</div>
        <div class="stat-label">活跃订阅</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ stats.unsubscribed }}</div>
        <div class="stat-label">已退订</div>
      </div>
      <div class="stat-card info">
        <div class="stat-value">{{ stats.recent }}</div>
        <div class="stat-label">近30天新增</div>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- Subscribers List Tab -->
      <el-tab-pane label="订阅者列表" name="subscribers">
        <el-card shadow="never" style="margin-bottom:16px">
          <div class="filter-row">
            <el-input v-model="query.search" placeholder="搜索邮箱" clearable style="width:260px" @keyup.enter="handleSearch" @clear="handleSearch" />
            <el-select v-model="query.status" placeholder="全部状态" clearable style="width:140px" @change="handleSearch">
              <el-option label="活跃" value="active" />
              <el-option label="已退订" value="unsubscribed" />
            </el-select>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </el-card>

        <el-card shadow="never">
          <el-table :data="list" v-loading="loading" stripe size="small">
            <el-table-column prop="email" label="邮箱" min-width="240" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                  {{ row.status === 'active' ? '活跃' : '已退订' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="100">
              <template #default="{ row }">
                <el-tag type="primary" size="small">{{ row.source || 'footer' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="订阅时间" width="170">
              <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination :current-page="query.page" :page-size="query.limit" :total="total" layout="total, prev, pager, next" @current-change="handlePageChange" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Campaign Tab -->
      <el-tab-pane label="群发邮件" name="campaigns">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>邮件发送记录</span>
              <el-button type="primary" @click="openCompose">撰写群发邮件</el-button>
            </div>
          </template>

          <el-table :data="campaigns" v-loading="campaignLoading" stripe size="small">
            <el-table-column prop="subject" label="邮件主题" min-width="250" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="110">
              <template #default="{ row }">
                <el-tag :type="typeTagTypes[row.type] || 'info'" size="small">{{ typeLabels[row.type] || row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发送状态" width="120">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'sent'" type="success" size="small">已发送</el-tag>
                <el-tag v-else-if="row.status === 'sending'" type="warning" size="small">发送中...</el-tag>
                <el-tag v-else-if="row.status === 'failed'" type="danger" size="small">发送失败</el-tag>
                <el-tag v-else type="info" size="small">草稿</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发送进度" width="160">
              <template #default="{ row }">
                <span style="font-size:13px">
                  <span style="color:#22c55e">{{ row.sent_count }}</span> 成功
                  <span v-if="row.fail_count > 0" style="color:#ef4444;margin-left:8px">{{ row.fail_count }} 失败</span>
                  <span style="color:#999;margin-left:8px">/ {{ row.total_count }}</span>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="发送时间" width="170">
              <template #default="{ row }">{{ formatTime(row.sent_at || row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="handleDeleteCampaign(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="!campaigns.length && !campaignLoading" style="text-align:center;padding:40px;color:#999">
            还没有发送过群发邮件，点击上方「撰写群发邮件」开始
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- Compose Dialog -->
    <el-dialog v-model="composeVisible" title="撰写群发邮件" width="900px" top="3vh" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="邮件类型">
          <el-radio-group v-model="composeForm.type" @change="handleTypeChange">
            <el-radio-button v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发送对象">
          <el-radio-group v-model="composeForm.target">
            <el-radio value="active_only">仅活跃订阅者 ({{ stats.active }}人)</el-radio>
            <el-radio value="all_subscribers">全部订阅者 ({{ stats.total }}人)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="邮件主题">
          <el-input v-model="composeForm.subject" placeholder="输入邮件主题" />
        </el-form-item>
        <el-form-item label="邮件内容">
          <div style="width:100%">
            <div class="template-hint">
              支持HTML格式 | 可用变量：<code v-pre>{{site_url}}</code> <code v-pre>{{site_name}}</code> | 底部会自动添加退订链接
            </div>
            <el-input v-model="composeForm.content" type="textarea" :rows="16" placeholder="输入HTML邮件内容" style="font-family:monospace;font-size:13px" />
          </div>
        </el-form-item>
        <el-form-item label="效果预览">
          <el-button plain @click="previewVisible = true">预览邮件效果</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="composeVisible = false">取消</el-button>
        <el-button type="primary" :loading="sending" @click="handleSend">
          {{ sending ? '发送中...' : '确认发送' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog v-model="previewVisible" title="邮件预览" width="700px" top="5vh">
      <div class="preview-box" v-html="composeForm.content"></div>
    </el-dialog>
  </div>
</template>

<style scoped>
.subscribers-view { padding: 24px; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; }
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.stat-card.success .stat-value { color: #22c55e; }
.stat-card.warning .stat-value { color: #f59e0b; }
.stat-card.info .stat-value { color: #3b82f6; }
.stat-value { font-size: 28px; font-weight: 700; }
.stat-label { font-size: 13px; color: #888; margin-top: 4px; }
.filter-row { display: flex; gap: 12px; align-items: center; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.template-hint { font-size: 12px; color: #909399; margin-bottom: 8px; line-height: 1.6; }
.template-hint code { background: #f5f5f5; padding: 1px 6px; border-radius: 3px; font-size: 12px; color: #e6396a; }
.preview-box { background: #f5f5f5; padding: 20px; border-radius: 8px; max-height: 70vh; overflow-y: auto; }
</style>
