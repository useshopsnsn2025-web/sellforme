<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '@/utils/api'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')

const activeTab = ref('overview')
const loading = ref(false)
const days = ref(7)
const daysOptions = [
  { label: '最近7天', value: 7 },
  { label: '最近14天', value: 14 },
  { label: '最近30天', value: 30 },
  { label: '最近90天', value: 90 },
]

// ===== Overview =====
const overviewData = ref({ daily: [], summary: {}, today: {}, devices: {}, browsers: [], visitors: {}, hourly: [] })

async function fetchOverview() {
  loading.value = true
  try {
    const res = await api.get('/traffic/stats', { params: { days: days.value } })
    overviewData.value = res.data
  } catch {}
  loading.value = false
}

// ===== Pages =====
const pagesData = ref({ pages: [], page_type_summary: [], bounce_rate: 0, total_sessions: 0 })

async function fetchPages() {
  loading.value = true
  try {
    const res = await api.get('/traffic/pages', { params: { days: days.value } })
    pagesData.value = res.data
  } catch {}
  loading.value = false
}

// ===== Products =====
const productsData = ref({ products: [] })

async function fetchProducts() {
  loading.value = true
  try {
    const res = await api.get('/traffic/products', { params: { days: days.value } })
    productsData.value = res.data
  } catch {}
  loading.value = false
}

// ===== Funnel =====
const funnelData = ref({ event_funnel: [], page_funnel: [] })

async function fetchFunnel() {
  loading.value = true
  try {
    const res = await api.get('/traffic/funnel', { params: { days: days.value } })
    funnelData.value = res.data
  } catch {}
  loading.value = false
}

// ===== Behavior =====
const behaviorData = ref({ sources: [], top_referrers: [], os: [], languages: [], avg_pages_per_session: 0, avg_session_duration: 0, total_sessions: 0 })

async function fetchBehavior() {
  loading.value = true
  try {
    const res = await api.get('/traffic/behavior', { params: { days: days.value } })
    behaviorData.value = res.data
  } catch {}
  loading.value = false
}

// ===== Agent Ranking =====
const agentStats = ref([])

async function fetchAgentStats() {
  if (!isAdmin.value) return
  try {
    const res = await api.get('/traffic/agents', { params: { days: days.value } })
    agentStats.value = res.data.agents || []
  } catch {}
}

// Tab switch loader
const fetchMap = {
  overview: fetchOverview,
  pages: fetchPages,
  products: fetchProducts,
  funnel: fetchFunnel,
  behavior: fetchBehavior,
  agents: fetchAgentStats,
}

function loadTab() {
  const fn = fetchMap[activeTab.value]
  if (fn) fn()
}

watch(activeTab, loadTab)

function handleDaysChange() {
  loadTab()
}

// Page type labels
const pageTypeLabels = {
  home: '首页',
  products: '产品列表',
  product_detail: '产品详情',
  collections: '分类列表',
  collection_detail: '分类详情',
  cart: '购物车',
  checkout: '结算页',
  account: '用户中心',
  search: '搜索',
  blog: '博客',
  static_page: '静态页面',
  tracking: '物流追踪',
  other: '其他',
}

// Static page name mapping
const staticPageNames = {
  'buyer-protection': '买家保护',
  'terms-of-service': '服务条款',
  'privacy-policy': '隐私政策',
  'contact-us': '联系我们',
  'about-us': '关于我们',
  'shipping-policy': '配送政策',
  'returns-refunds': '退换政策',
  'faq': '常见问题',
}

// Event labels
const eventLabels = {
  page_view: '浏览页面',
  add_to_cart: '加入购物车',
  checkout: '进入结算',
  purchase: '完成购买',
}

// Page funnel labels
const pageFunnelLabels = {
  home: '首页',
  products: '产品列表',
  product_detail: '产品详情',
  cart: '购物车',
  checkout: '结算页',
}

// Source labels
const sourceLabels = {
  direct: '直接访问',
  search_engine: '搜索引擎',
  external: '外部链接',
}

function getPageName(url, pageType) {
  if (!url) return '未知页面'
  const path = url.split('?')[0]
  if (pageType === 'home' || path === '/') return '首页'
  if (pageType === 'product_detail') {
    const id = path.split('/products/')[1]
    return id ? `产品 #${id.slice(-6)}` : '产品详情'
  }
  if (pageType === 'collection_detail') {
    const slug = path.split('/collections/')[1]
    return slug ? `分类: ${slug}` : '分类详情'
  }
  if (pageType === 'products') return '产品列表'
  if (pageType === 'collections') return '分类列表'
  if (pageType === 'cart') return '购物车'
  if (pageType === 'checkout') return '结算页'
  if (pageType === 'search') return '搜索页'
  if (pageType === 'account') {
    if (path.includes('login')) return '登录页'
    if (path.includes('register')) return '注册页'
    if (path.includes('forgot')) return '忘记密码'
    if (path.includes('orders')) return '我的订单'
    if (path.includes('addresses')) return '地址管理'
    if (path.includes('wishlist')) return '收藏夹'
    return '用户中心'
  }
  if (pageType === 'blog') return '博客'
  if (pageType === 'tracking') return '物流追踪'
  if (pageType === 'static_page') {
    const slug = path.split('/pages/')[1]
    if (slug && staticPageNames[slug]) return staticPageNames[slug]
    if (slug) return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return '静态页面'
  }
  // For anything else, show the actual path as name
  return path
}

function getPageTagType(pageType) {
  const map = {
    home: '',
    product_detail: 'success',
    products: 'success',
    collection_detail: 'warning',
    collections: 'warning',
    cart: 'danger',
    checkout: 'danger',
    account: 'info',
    search: 'info',
    blog: '',
    static_page: '',
    tracking: 'info',
  }
  return map[pageType] || 'info'
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s'
  if (seconds < 60) return seconds + 's'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m + 'm ' + s + 's'
}

onMounted(fetchOverview)
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">流量统计</h2>
      <el-select v-model="days" @change="handleDaysChange" style="width:160px">
        <el-option v-for="opt in daysOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- ===== TAB 1: Overview ===== -->
      <el-tab-pane label="数据概览" name="overview">
        <div v-loading="loading">
          <!-- Summary Cards -->
          <el-row :gutter="16" style="margin-bottom:20px">
            <el-col :span="6">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">今日 PV</div><div class="stat-value">{{ overviewData.today?.pv || 0 }}</div></div></el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">今日 UV</div><div class="stat-value">{{ overviewData.today?.uv || 0 }}</div></div></el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">累计 PV</div><div class="stat-value">{{ overviewData.summary?.pv || 0 }}</div></div></el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">累计 UV</div><div class="stat-value">{{ overviewData.summary?.uv || 0 }}</div></div></el-card>
            </el-col>
          </el-row>

          <!-- Device & Visitor Cards -->
          <el-row :gutter="16" style="margin-bottom:20px">
            <el-col :span="6">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">PC 访问</div><div class="stat-value">{{ overviewData.devices?.pc || 0 }}</div></div></el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">移动端访问</div><div class="stat-value">{{ (overviewData.devices?.mobile || 0) + (overviewData.devices?.tablet || 0) }}</div></div></el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">新访客</div><div class="stat-value">{{ overviewData.visitors?.new || 0 }}</div></div></el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">回访用户</div><div class="stat-value">{{ overviewData.visitors?.returning || 0 }}</div></div></el-card>
            </el-col>
          </el-row>

          <!-- Daily Trend -->
          <el-card style="margin-bottom:20px">
            <template #header>每日流量趋势</template>
            <el-table :data="overviewData.daily" stripe max-height="400" size="small">
              <el-table-column prop="date" label="日期" width="140" />
              <el-table-column prop="pv" label="PV" width="100" align="center" />
              <el-table-column prop="uv" label="UV" width="100" align="center" />
              <el-table-column label="PV/UV" width="100" align="center">
                <template #default="{ row }">{{ row.uv ? (row.pv / row.uv).toFixed(1) : '—' }}</template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- Hourly & Browser -->
          <el-row :gutter="16">
            <el-col :span="12">
              <el-card>
                <template #header>今日时段分布</template>
                <el-table :data="overviewData.hourly" stripe size="small" max-height="300">
                  <el-table-column label="时段" width="100">
                    <template #default="{ row }">{{ String(row.hour).padStart(2, '0') }}:00</template>
                  </el-table-column>
                  <el-table-column prop="count" label="访问量" align="center" />
                </el-table>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>浏览器分布</template>
                <el-table :data="overviewData.browsers" stripe size="small" max-height="300">
                  <el-table-column prop="name" label="浏览器" />
                  <el-table-column prop="count" label="访问量" width="100" align="center" />
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- ===== TAB 2: Page Analysis ===== -->
      <el-tab-pane label="页面分析" name="pages">
        <div v-loading="loading">
          <!-- Summary -->
          <el-row :gutter="16" style="margin-bottom:20px">
            <el-col :span="8">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">总会话数</div><div class="stat-value">{{ pagesData.total_sessions || 0 }}</div></div></el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">跳出率</div><div class="stat-value">{{ pagesData.bounce_rate || 0 }}%</div></div></el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">页面总数</div><div class="stat-value">{{ pagesData.pages?.length || 0 }}</div></div></el-card>
            </el-col>
          </el-row>

          <!-- Page Type Summary -->
          <el-card style="margin-bottom:20px">
            <template #header>页面类型汇总</template>
            <el-table :data="pagesData.page_type_summary" stripe size="small">
              <el-table-column label="类型" width="140">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ pageTypeLabels[row.page_type] || row.page_type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="pv" label="PV" width="100" align="center" />
              <el-table-column prop="uv" label="UV" width="100" align="center" />
              <el-table-column label="占比" width="100" align="center">
                <template #default="{ row }">
                  {{ pagesData.page_type_summary?.reduce((s, r) => s + r.pv, 0) > 0
                    ? ((row.pv / pagesData.page_type_summary.reduce((s, r) => s + r.pv, 0)) * 100).toFixed(1) + '%'
                    : '—' }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- Detailed Page URLs -->
          <el-card>
            <template #header>页面明细（按URL）</template>
            <el-table :data="pagesData.pages" stripe size="small" max-height="600">
              <el-table-column label="页面" min-width="320">
                <template #default="{ row }">
                  <div>
                    <el-tag size="small" :type="getPageTagType(row.page_type)" effect="plain" style="margin-right:8px">{{ pageTypeLabels[row.page_type] || row.page_type }}</el-tag>
                    <span style="color:#303133">{{ getPageName(row.url, row.page_type) }}</span>
                  </div>
                  <div style="color:#909399;font-size:12px;margin-top:2px;word-break:break-all">{{ row.url }}</div>
                </template>
              </el-table-column>
              <el-table-column prop="pv" label="PV" width="80" align="center" />
              <el-table-column prop="uv" label="UV" width="80" align="center" />
              <el-table-column label="平均停留" width="100" align="center">
                <template #default="{ row }">{{ formatDuration(row.avg_duration) }}</template>
              </el-table-column>
              <el-table-column label="占比" width="80" align="center">
                <template #default="{ row }">
                  {{ pagesData.pages?.reduce((s, r) => s + r.pv, 0) > 0
                    ? ((row.pv / pagesData.pages.reduce((s, r) => s + r.pv, 0)) * 100).toFixed(1) + '%'
                    : '—' }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ===== TAB 3: Product Analysis ===== -->
      <el-tab-pane label="产品分析" name="products">
        <div v-loading="loading">
          <el-card>
            <template #header>产品流量排行</template>
            <el-table :data="productsData.products" stripe size="small">
              <el-table-column label="产品名称" min-width="280">
                <template #default="{ row }">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <img v-if="row.image" :src="row.image" style="width:40px;height:40px;border-radius:4px;flex-shrink:0;object-fit:cover;" referrerpolicy="no-referrer" @error="e => e.target.style.display='none'" />
                    <div style="min-width:0;">
                      <div style="font-size:12px;color:#909399;line-height:1.2;">[{{ row.handle }}]</div>
                      <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ row.title || '未知产品' }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="pv" label="PV" width="80" align="center" />
              <el-table-column prop="uv" label="UV" width="80" align="center" />
              <el-table-column prop="add_to_cart" label="加购次数" width="100" align="center" />
              <el-table-column label="加购率" width="90" align="center">
                <template #default="{ row }">{{ row.cart_rate }}%</template>
              </el-table-column>
              <el-table-column label="平均停留" width="100" align="center">
                <template #default="{ row }">{{ formatDuration(row.avg_duration) }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ===== TAB 4: Funnel ===== -->
      <el-tab-pane label="转化漏斗" name="funnel">
        <div v-loading="loading">
          <!-- Event Funnel -->
          <el-card style="margin-bottom:20px">
            <template #header>事件转化漏斗</template>
            <div class="funnel-container">
              <div v-for="(item, idx) in funnelData.event_funnel" :key="item.step" class="funnel-step">
                <div class="funnel-bar" :style="{ width: item.rate + '%', minWidth: '60px' }">
                  <span class="funnel-label">{{ eventLabels[item.step] || item.step }}</span>
                  <span class="funnel-count">{{ item.sessions }} 会话</span>
                </div>
                <div class="funnel-rates">
                  <span>总转化: {{ item.rate }}%</span>
                  <span v-if="idx > 0" style="margin-left:12px;color:#E6A23C">步转化: {{ item.step_rate }}%</span>
                </div>
              </div>
            </div>
          </el-card>

          <!-- Page Funnel -->
          <el-card>
            <template #header>页面浏览漏斗</template>
            <div class="funnel-container">
              <div v-for="(item, idx) in funnelData.page_funnel" :key="item.page_type" class="funnel-step">
                <div class="funnel-bar" :style="{ width: item.rate + '%', minWidth: '60px' }">
                  <span class="funnel-label">{{ pageFunnelLabels[item.page_type] || item.page_type }}</span>
                  <span class="funnel-count">{{ item.sessions }} 会话</span>
                </div>
                <div class="funnel-rates">
                  <span>总转化: {{ item.rate }}%</span>
                  <span v-if="idx > 0" style="margin-left:12px;color:#E6A23C">步转化: {{ item.step_rate }}%</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ===== TAB 5: User Behavior ===== -->
      <el-tab-pane label="用户行为" name="behavior">
        <div v-loading="loading">
          <!-- Summary Cards -->
          <el-row :gutter="16" style="margin-bottom:20px">
            <el-col :span="8">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">总会话数</div><div class="stat-value">{{ behaviorData.total_sessions || 0 }}</div></div></el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">平均浏览页数</div><div class="stat-value">{{ behaviorData.avg_pages_per_session || 0 }}</div></div></el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover"><div class="stat-item"><div class="stat-label">平均停留时长</div><div class="stat-value">{{ formatDuration(behaviorData.avg_session_duration) }}</div></div></el-card>
            </el-col>
          </el-row>

          <el-row :gutter="16" style="margin-bottom:20px">
            <!-- Sources -->
            <el-col :span="12">
              <el-card>
                <template #header>访问来源</template>
                <el-table :data="behaviorData.sources" stripe size="small">
                  <el-table-column label="来源" width="160">
                    <template #default="{ row }">{{ sourceLabels[row.source] || row.source }}</template>
                  </el-table-column>
                  <el-table-column prop="count" label="访问量" align="center" />
                  <el-table-column label="占比" width="100" align="center">
                    <template #default="{ row }">
                      {{ behaviorData.sources?.reduce((s, r) => s + r.count, 0) > 0
                        ? ((row.count / behaviorData.sources.reduce((s, r) => s + r.count, 0)) * 100).toFixed(1) + '%'
                        : '—' }}
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
            <!-- Top Referrers -->
            <el-col :span="12">
              <el-card>
                <template #header>来源域名 TOP 10</template>
                <el-table :data="behaviorData.top_referrers" stripe size="small">
                  <el-table-column prop="domain" label="域名" show-overflow-tooltip />
                  <el-table-column prop="count" label="访问量" width="100" align="center" />
                </el-table>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <!-- OS -->
            <el-col :span="12">
              <el-card>
                <template #header>操作系统分布</template>
                <el-table :data="behaviorData.os" stripe size="small">
                  <el-table-column prop="os" label="操作系统" />
                  <el-table-column prop="count" label="访问量" width="100" align="center" />
                </el-table>
              </el-card>
            </el-col>
            <!-- Language -->
            <el-col :span="12">
              <el-card>
                <template #header>语言分布</template>
                <el-table :data="behaviorData.languages" stripe size="small">
                  <el-table-column prop="language" label="语言" />
                  <el-table-column prop="count" label="访问量" width="100" align="center" />
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- ===== TAB 6: Agent Ranking (admin only) ===== -->
      <el-tab-pane v-if="isAdmin" label="代理排行" name="agents">
        <el-card>
          <el-table :data="agentStats" stripe size="small">
            <el-table-column label="代理" min-width="200">
              <template #default="{ row }">
                <div>{{ row.agent?.email || '—' }}</div>
                <div style="color:#909399;font-size:12px">推广码: {{ row.agent?.agent_code || '—' }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="pv" label="PV" width="100" align="center" />
            <el-table-column prop="uv" label="UV" width="100" align="center" />
            <el-table-column prop="registrations" label="注册数" width="100" align="center" />
            <el-table-column label="转化率" width="100" align="center">
              <template #default="{ row }">{{ row.uv ? ((row.registrations / row.uv) * 100).toFixed(1) + '%' : '—' }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.stat-item {
  text-align: center;
  padding: 8px 0;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

/* Funnel styles */
.funnel-container {
  padding: 8px 0;
}
.funnel-step {
  margin-bottom: 16px;
}
.funnel-bar {
  background: linear-gradient(90deg, #5356EE, #409EFF);
  color: #fff;
  padding: 10px 16px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: width 0.3s;
}
.funnel-label {
  font-weight: 600;
  font-size: 14px;
}
.funnel-count {
  font-size: 13px;
  opacity: 0.9;
}
.funnel-rates {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  padding-left: 4px;
}
</style>
