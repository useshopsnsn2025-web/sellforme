<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import api from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const products = ref([])
const pagination = ref({ page: 1, limit: 20, total: 0 })
const search = ref('')
const statusFilter = ref('')
const collectionFilter = ref('')
const collections = ref([])
const loading = ref(true)
const selectedIds = ref([])

// Download related
const isAdmin = computed(() => authStore.user?.role === 'admin')
const downloadDialogVisible = ref(false)
const downloadCollectionId = ref('')
const downloadAgentId = ref('')
const agents = ref([])
const downloading = ref(false)

async function fetchCollections() {
  try {
    const res = await api.get('/collections', { params: { limit: 100 } })
    collections.value = res.data.collections || []
  } catch {}
}

async function fetchProducts() {
  loading.value = true
  try {
    const res = await api.get('/products', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit,
        search: search.value || undefined,
        status: statusFilter.value || undefined,
        collection: collectionFilter.value || undefined,
      }
    })
    products.value = res.data.products
    pagination.value = { ...pagination.value, ...res.data.pagination }
  } catch {}
  loading.value = false
}

async function fetchAgents() {
  if (!isAdmin.value) return
  try {
    const res = await api.get('/agents')
    agents.value = res.data.agents || []
  } catch {}
}

function handleSearch() {
  pagination.value.page = 1
  fetchProducts()
}

function handlePageChange(page) {
  pagination.value.page = page
  fetchProducts()
}

async function handleDelete(id) {
  await ElMessageBox.confirm('确定要删除该产品吗？', '提示', { type: 'warning' })
  await api.delete(`/products/${id}`)
  ElMessage.success('删除成功')
  fetchProducts()
}

async function handleBatchDelete() {
  if (!selectedIds.value.length) return ElMessage.warning('请选择要删除的产品')
  await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个产品吗？`, '提示', { type: 'warning' })
  await api.post('/products/batch-delete', { ids: selectedIds.value })
  ElMessage.success('删除成功')
  selectedIds.value = []
  fetchProducts()
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map(r => r._id)
}

// Download product data
function handleDownload() {
  downloadCollectionId.value = ''
  downloadAgentId.value = ''
  downloadDialogVisible.value = true
}

const downloadProgress = ref('')

async function doDownload() {
  if (!downloadCollectionId.value) return ElMessage.warning('请选择要下载的分类')
  downloading.value = true
  downloadProgress.value = '正在连接服务器...'
  try {
    const res = await api.post('/products/download', {
      collection: downloadCollectionId.value,
      agent_id: isAdmin.value ? (downloadAgentId.value || undefined) : undefined,
    }, {
      responseType: 'blob',
      timeout: 0,
      onDownloadProgress(e) {
        if (e.loaded) {
          const mb = (e.loaded / 1024 / 1024).toFixed(1)
          downloadProgress.value = `正在下载数据... 已接收 ${mb} MB`
        }
      }
    })

    // Check if server returned JSON error (blob will be small)
    if (res.data.size < 500 && res.data.type?.includes('json')) {
      const text = await res.data.text()
      const json = JSON.parse(text)
      ElMessage.error(json.msg || '下载失败')
      downloading.value = false
      downloadProgress.value = ''
      return
    }

    const col = collections.value.find(c => c._id === downloadCollectionId.value)
    const filename = col ? `${col.title}.zip` : 'products.zip'

    const blob = new Blob([res.data], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    downloadDialogVisible.value = false
    ElMessage.success('下载成功')
  } catch {
    ElMessage.error('下载失败，请重试')
  }
  downloading.value = false
  downloadProgress.value = ''
}

onMounted(() => {
  fetchCollections()
  fetchProducts()
  fetchAgents()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">产品管理</h2>
      <div style="display:flex;gap:8px">
        <el-button type="success" plain icon="Download" @click="handleDownload">下载产品数据</el-button>
        <el-button type="primary" icon="Plus" @click="router.push('/products/add')">添加产品</el-button>
      </div>
    </div>

    <el-card>
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <el-input v-model="search" placeholder="搜索产品名称/ID" clearable style="width:280px" @keyup.enter="handleSearch" @clear="handleSearch">
          <template #append><el-button icon="Search" @click="handleSearch" /></template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width:140px" @change="handleSearch">
          <el-option label="上架" value="active" />
          <el-option label="草稿" value="draft" />
          <el-option label="已归档" value="archived" />
        </el-select>
        <el-select v-model="collectionFilter" placeholder="分类筛选" clearable filterable style="width:200px" @change="handleSearch">
          <el-option v-for="col in collections" :key="col._id" :label="col.title" :value="col._id" />
        </el-select>
        <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleBatchDelete">批量删除 ({{ selectedIds.length }})</el-button>
      </div>

      <el-table :data="products" v-loading="loading" @selection-change="handleSelectionChange" row-key="_id">
        <el-table-column type="selection" width="40" />
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image :src="row.featured_image || row.images?.[0]?.src" style="width:50px;height:50px;border-radius:6px" fit="cover">
              <template #error><div style="width:50px;height:50px;background:#f5f7fa;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#c0c4cc;font-size:12px">无图</div></template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="product_id" label="产品ID" width="160" show-overflow-tooltip />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">${{ row.price?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="total_inventory" label="库存" width="80" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'draft' ? 'info' : 'warning'" size="small">{{ row.status === 'active' ? '上架' : row.status === 'draft' ? '草稿' : '归档' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="80">
          <template #default="{ row }">
            <el-tag :type="row.source === 'scraped' ? 'warning' : ''" size="small">{{ row.source === 'scraped' ? '采集' : '手动' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="router.push(`/products/edit/${row._id}`)">编辑</el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row._id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination :current-page="pagination.page" :page-size="pagination.limit" :total="pagination.total" layout="total, prev, pager, next" @current-change="handlePageChange" />
      </div>
    </el-card>

    <!-- Download dialog -->
    <el-dialog v-model="downloadDialogVisible" title="下载产品数据" width="480px" :close-on-click-modal="false" :close-on-press-escape="!downloading" :show-close="!downloading">
      <!-- Progress view -->
      <div v-if="downloading" style="text-align:center;padding:20px 0">
        <el-icon class="is-loading" style="font-size:32px;color:#409eff;margin-bottom:16px"><Loading /></el-icon>
        <p style="font-size:15px;color:#303133;margin-bottom:8px">{{ downloadProgress }}</p>
        <p style="font-size:12px;color:#909399">服务器正在打包图片和产品数据，请勿关闭页面</p>
      </div>
      <!-- Form view -->
      <el-form v-else label-width="80px">
        <el-form-item label="选择分类" required>
          <el-select v-model="downloadCollectionId" placeholder="请选择要下载的产品分类" filterable style="width:100%">
            <el-option v-for="col in collections" :key="col._id" :label="col.title" :value="col._id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isAdmin" label="选择代理">
          <el-select v-model="downloadAgentId" placeholder="不选择（链接不带推广码）" clearable filterable style="width:100%">
            <el-option v-for="agent in agents" :key="agent._id" :label="`${agent.first_name || ''} ${agent.last_name || ''} (${agent.agent_code})`.trim()" :value="agent._id" />
          </el-select>
          <div style="color:#909399;font-size:12px;margin-top:4px">选择代理后，链接将自动拼接该代理的推广码</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <template v-if="!downloading">
          <el-button @click="downloadDialogVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!downloadCollectionId" @click="doDownload()">确认下载</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>
