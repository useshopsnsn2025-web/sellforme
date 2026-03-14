<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const stats = ref({})
const loading = ref(false)
const importLoading = ref(false)
const importResult = ref(null)

// One-click scrape state
const scraping = ref(false)
const progress = ref({ step: '', current: 0, total: 0, message: '' })
const scrapeResult = ref(null)
const logs = ref([])
let pollTimer = null

const maxPages = ref(50)
const productJson = ref('')
const collectionJson = ref('')
const activeTab = ref('auto')

async function fetchStats() {
  try {
    const res = await api.get('/scraper/stats')
    stats.value = res.data
    if (res.data.running) {
      scraping.value = true
      startPolling()
    }
  } catch {}
}

// ======= One-click scrape =======
async function startScrape() {
  await ElMessageBox.confirm(
    `将采集 pypipi.com 的分类和产品数据（最多 ${maxPages.value} 页，约 ${maxPages.value * 12} 个产品），过程可能需要几分钟。确定开始？`,
    '一键采集',
    { type: 'info', confirmButtonText: '开始采集', cancelButtonText: '取消' }
  )

  scraping.value = true
  scrapeResult.value = null
  logs.value = []
  progress.value = { step: 'init', current: 0, total: 1, message: '正在启动...' }

  try {
    await api.post('/scraper/start', { maxPages: maxPages.value })
    ElMessage.success('采集任务已启动')
    startPolling()
  } catch {
    scraping.value = false
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(pollProgress, 2000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function pollProgress() {
  try {
    const res = await api.get('/scraper/progress')
    progress.value = res.data.progress
    logs.value = res.data.logs || []
    scraping.value = res.data.running

    if (!res.data.running) {
      stopPolling()
      scrapeResult.value = res.data.result
      if (res.data.result?.error) {
        ElMessage.error('采集失败: ' + res.data.result.error)
      } else if (res.data.result) {
        if (res.data.result.enriched !== undefined) {
          ElMessage.success(`补充完成！更新: ${res.data.result.enriched}, 失败: ${res.data.result.failed || 0}`)
        } else {
          ElMessage.success(`采集完成！分类: ${res.data.result.collections?.imported || 0}, 产品: ${res.data.result.products?.imported || 0}`)
        }
      }
      fetchStats()
    }
  } catch {}
}

// Progress percentage
function progressPercent() {
  if (!progress.value.total) return 0
  if (progress.value.step === 'done') return 100
  if (progress.value.step === 'error') return 0
  return Math.round((progress.value.current / progress.value.total) * 100)
}

function progressStatus() {
  if (progress.value.step === 'done') return 'success'
  if (progress.value.step === 'error') return 'exception'
  return ''
}

// ======= Stop task =======
async function stopTask() {
  try {
    await api.post('/scraper/stop')
    ElMessage.warning('正在停止采集任务...')
  } catch {}
}

// ======= Clear data =======
async function clearData() {
  await ElMessageBox.confirm(
    '将删除所有采集的产品和分类数据，此操作不可恢复！确定清空？',
    '清空采集数据',
    { type: 'error', confirmButtonText: '确定清空', cancelButtonText: '取消' }
  )
  try {
    const res = await api.post('/scraper/clear')
    ElMessage.success(`已清空: ${res.data.deleted_products} 个产品, ${res.data.deleted_collections} 个分类`)
    fetchStats()
  } catch {}
}

// ======= Enrich existing products =======
async function startEnrich() {
  await ElMessageBox.confirm(
    '将为已采集的产品补充分类关联和产品描述（需要逐个访问产品详情页），过程可能较长。确定开始？',
    '补充采集',
    { type: 'info', confirmButtonText: '开始补充', cancelButtonText: '取消' }
  )

  scraping.value = true
  scrapeResult.value = null
  logs.value = []
  progress.value = { step: 'init', current: 0, total: 1, message: '正在启动补充采集...' }

  try {
    await api.post('/scraper/enrich')
    ElMessage.success('补充采集任务已启动')
    startPolling()
  } catch {
    scraping.value = false
  }
}

// ======= Manual import =======
async function importProducts() {
  if (!productJson.value.trim()) return ElMessage.warning('请输入产品数据')
  importLoading.value = true
  importResult.value = null
  try {
    const products = JSON.parse(productJson.value)
    const data = Array.isArray(products) ? products : [products]
    const res = await api.post('/scraper/import-products', { products: data })
    importResult.value = res.data
    ElMessage.success(`导入成功: ${res.data.imported} 个, 跳过: ${res.data.skipped} 个`)
    productJson.value = ''
    fetchStats()
  } catch (err) {
    if (err instanceof SyntaxError) ElMessage.error('JSON格式错误，请检查数据格式')
  }
  importLoading.value = false
}

async function importCollections() {
  if (!collectionJson.value.trim()) return ElMessage.warning('请输入分类数据')
  importLoading.value = true
  importResult.value = null
  try {
    const collections = JSON.parse(collectionJson.value)
    const data = Array.isArray(collections) ? collections : [collections]
    const res = await api.post('/scraper/import-collections', { collections: data })
    importResult.value = res.data
    ElMessage.success(`导入成功: ${res.data.imported} 个, 跳过: ${res.data.skipped} 个`)
    collectionJson.value = ''
    fetchStats()
  } catch (err) {
    if (err instanceof SyntaxError) ElMessage.error('JSON格式错误，请检查数据格式')
  }
  importLoading.value = false
}

onMounted(fetchStats)
onUnmounted(stopPolling)
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">数据采集</h2>
    </div>

    <!-- Stats -->
    <el-row :gutter="16" style="margin-bottom:24px">
      <el-col :span="5">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.scraped_products || 0 }}</div>
            <div class="stat-label">采集产品</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.scraped_collections || 0 }}</div>
            <div class="stat-label">采集分类</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.scraped_sellers || 0 }}</div>
            <div class="stat-label">采集卖家</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.manual_products || 0 }}</div>
            <div class="stat-label">手动产品</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" :style="{ color: stats.running ? '#e6a23c' : '#67c23a' }">{{ stats.running ? '运行中' : '空闲' }}</div>
            <div class="stat-label">采集状态</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <el-tabs v-model="activeTab">
        <!-- ===== Auto Scrape Tab ===== -->
        <el-tab-pane label="一键采集" name="auto">
          <el-alert type="warning" style="margin-bottom:20px" :closable="false">
            <template #title>
              <strong>一键采集 pypipi.com</strong>：自动解析目标网站页面数据，提取分类和产品信息（包含图片、价格、规格、描述等）。支持自动分页，每页12个产品，总计约7742个。采集过程可能需要几分钟。
            </template>
          </el-alert>

          <div style="margin-bottom:24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <el-button type="primary" size="large" icon="Download" :loading="scraping" :disabled="scraping" @click="startScrape">
              {{ scraping ? '采集中...' : '开始一键采集' }}
            </el-button>
            <el-button type="warning" size="large" icon="Refresh" :loading="scraping" :disabled="scraping" @click="startEnrich">
              补充采集（描述+分类）
            </el-button>
            <el-button v-if="scraping" type="danger" size="large" icon="Close" @click="stopTask">
              停止采集
            </el-button>
            <el-button v-if="!scraping" type="danger" size="large" icon="Delete" plain @click="clearData">
              清空采集数据
            </el-button>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:14px;color:#606266">采集页数:</span>
              <el-input-number v-model="maxPages" :min="1" :max="650" :step="10" size="default" :disabled="scraping" style="width:150px" />
              <span style="font-size:13px;color:#909399">（每页12个，共约646页）</span>
            </div>
          </div>

          <!-- Progress -->
          <div v-if="scraping || scrapeResult" style="margin-bottom:20px">
            <div style="margin-bottom:12px">
              <el-progress :percentage="progressPercent()" :status="progressStatus()" :stroke-width="20" :text-inside="true" />
            </div>
            <p style="font-size:14px;color:#606266">
              <el-icon v-if="scraping" class="is-loading"><Loading /></el-icon>
              {{ progress.message }}
            </p>
          </div>

          <!-- Scrape Result -->
          <el-card v-if="scrapeResult && !scrapeResult.error" style="margin-bottom:20px" shadow="never">
            <template #header><span style="font-weight:600;color:#67c23a">{{ scrapeResult.enriched !== undefined ? '补充采集结果' : '采集结果' }}</span></template>
            <!-- Enrich result -->
            <el-descriptions v-if="scrapeResult.enriched !== undefined" :column="3" border>
              <el-descriptions-item label="已更新">
                <el-tag type="success">{{ scrapeResult.enriched }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="获取失败">
                <el-tag :type="scrapeResult.failed ? 'danger' : 'info'">{{ scrapeResult.failed || 0 }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="处理总数">
                <el-tag>{{ scrapeResult.total || 0 }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
            <!-- Normal scrape result -->
            <el-descriptions v-else :column="2" border>
              <el-descriptions-item label="分类导入">
                <el-tag type="success">{{ scrapeResult.collections?.imported || 0 }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="分类跳过">
                <el-tag type="info">{{ scrapeResult.collections?.skipped || 0 }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="产品导入">
                <el-tag type="success">{{ scrapeResult.products?.imported || 0 }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="产品跳过">
                <el-tag type="info">{{ scrapeResult.products?.skipped || 0 }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="采集产品总数">
                <el-tag>{{ scrapeResult.products?.total || 0 }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="产品错误">
                <el-tag :type="scrapeResult.products?.errors ? 'danger' : 'info'">{{ scrapeResult.products?.errors || 0 }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-alert v-if="scrapeResult?.error" type="error" style="margin-bottom:20px" :closable="false">
            <template #title>采集失败: {{ scrapeResult.error }}</template>
          </el-alert>

          <!-- Logs -->
          <el-card v-if="logs.length" shadow="never">
            <template #header>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span style="font-weight:600">采集日志</span>
                <el-tag size="small">{{ logs.length }} 条</el-tag>
              </div>
            </template>
            <div class="log-container">
              <div v-for="(log, i) in logs" :key="i" class="log-line" :class="{ 'log-error': log.includes('失败'), 'log-success': log.includes('完成') || log.includes('成功') }">
                {{ log }}
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- ===== Manual Import Tabs ===== -->
        <el-tab-pane label="手动导入产品" name="products">
          <el-alert type="info" style="margin-bottom:16px" :closable="false">
            <template #title>
              支持导入JSON格式产品数据。字段：product_id, title, price, compare_at_price, images, body_html, tags, condition 等。
            </template>
          </el-alert>
          <el-input v-model="productJson" type="textarea" :rows="12" placeholder='[{"product_id":"m40016936905","title":"iPhone 14 Pro","price":899.99,"compare_at_price":1099.99,"images":["https://cdn.example.com/1.jpg"],"tags":["iPhone","Apple"],"condition":"like-new"}]' />
          <div style="margin-top:16px">
            <el-button type="primary" :loading="importLoading" @click="importProducts">导入产品</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="手动导入分类" name="collections">
          <el-alert type="info" style="margin-bottom:16px" :closable="false">
            <template #title>
              支持导入JSON格式分类数据。字段：title, handle, description, image 等。
            </template>
          </el-alert>
          <el-input v-model="collectionJson" type="textarea" :rows="12" placeholder='[{"title":"Apple iPhones","handle":"apple-iphones","description":"Pre-owned Apple iPhones","image":{"src":"https://cdn.example.com/cat.jpg"}}]' />
          <div style="margin-top:16px">
            <el-button type="primary" :loading="importLoading" @click="importCollections">导入分类</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- Manual import result -->
      <el-card v-if="importResult" style="margin-top:20px" shadow="never">
        <template #header><span style="font-weight:600">导入结果</span></template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="成功导入">{{ importResult.imported }}</el-descriptions-item>
          <el-descriptions-item label="跳过(已存在)">{{ importResult.skipped }}</el-descriptions-item>
          <el-descriptions-item v-if="importResult.errors !== undefined" label="错误数">{{ importResult.errors }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="importResult.error_details?.length" style="margin-top:12px">
          <p style="font-size:13px;color:#f56c6c;font-weight:600">错误详情:</p>
          <pre style="font-size:12px;background:#fef0f0;padding:12px;border-radius:6px;max-height:200px;overflow:auto">{{ JSON.stringify(importResult.error_details, null, 2) }}</pre>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<style scoped>
.log-container {
  max-height: 400px;
  overflow-y: auto;
  background: #1d1e1f;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.8;
}
.log-line {
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-all;
}
.log-error {
  color: #f56c6c;
}
.log-success {
  color: #67c23a;
}
</style>
