<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')

const list = ref([])
const loading = ref(true)
const stats = ref({ total: 0, active: 0, banned: 0, disabled: 0, total_clicks: 0 })
const dialogVisible = ref(false)
const editingId = ref(null)
const form = ref({ phone: '', name: '', note: '', sort_weight: 0, agent_id: '' })
const agents = ref([])

async function fetchAgents() {
  if (!isAdmin.value) return
  try {
    const res = await api.get('/agents')
    agents.value = res.data.agents || []
  } catch {}
}

async function fetchList() {
  loading.value = true
  try {
    const res = await api.get('/whatsapp')
    list.value = res.data.list
  } catch {}
  loading.value = false
}

async function fetchStats() {
  try {
    const res = await api.get('/whatsapp/stats')
    stats.value = res.data
  } catch {}
}

function openDialog(item = null) {
  if (item) {
    editingId.value = item._id
    form.value = { phone: item.phone, name: item.name || '', note: item.note || '', sort_weight: item.sort_weight || 0, agent_id: item.agent_id?._id || item.agent_id || '' }
  } else {
    editingId.value = null
    form.value = { phone: '', name: '', note: '', sort_weight: 0, agent_id: '' }
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.phone) return ElMessage.warning('请输入WhatsApp号码')
  if (isAdmin.value && !editingId.value && !form.value.agent_id) return ElMessage.warning('请选择所属代理')
  try {
    if (editingId.value) {
      const { agent_id, ...update } = form.value
      await api.put(`/whatsapp/${editingId.value}`, update)
      ElMessage.success('更新成功')
    } else {
      await api.post('/whatsapp', form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchList()
    fetchStats()
  } catch {}
}

async function handleDelete(id) {
  await ElMessageBox.confirm('确定要删除该号码吗？', '提示', { type: 'warning' })
  await api.delete(`/whatsapp/${id}`)
  ElMessage.success('删除成功')
  fetchList()
  fetchStats()
}

async function toggleStatus(item) {
  if (item.status === 'active') {
    await api.put(`/whatsapp/${item._id}`, { status: 'disabled' })
  } else {
    await api.put(`/whatsapp/${item._id}/activate`)
  }
  fetchList()
  fetchStats()
}

async function markBanned(item) {
  await ElMessageBox.confirm(`确定将 ${item.phone} 标记为已封禁？`, '封禁号码', { type: 'warning' })
  await api.put(`/whatsapp/${item._id}/ban`)
  ElMessage.success('已标记为封禁')
  fetchList()
  fetchStats()
}

async function resetClicks(item) {
  await ElMessageBox.confirm(`确定重置 ${item.phone} 的点击统计？`, '提示', { type: 'warning' })
  await api.put(`/whatsapp/${item._id}/reset-clicks`)
  ElMessage.success('已重置')
  fetchList()
  fetchStats()
}

function getAgentName(row) {
  const a = row.agent_id
  if (!a || typeof a === 'string') return '-'
  return `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email || '-'
}

function statusType(status) {
  if (status === 'active') return 'success'
  if (status === 'banned') return 'danger'
  return 'info'
}

function statusLabel(status) {
  if (status === 'active') return '正常'
  if (status === 'banned') return '已封禁'
  return '已禁用'
}

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchList()
  fetchStats()
  fetchAgents()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">WhatsApp 管理</h2>
      <el-button type="primary" icon="Plus" @click="openDialog()">添加号码</el-button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <el-card class="stat-card" shadow="never">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-label">总数</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-num" style="color:#67c23a">{{ stats.active }}</div>
        <div class="stat-label">正常</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-num" style="color:#f56c6c">{{ stats.banned }}</div>
        <div class="stat-label">已封禁</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-num" style="color:#909399">{{ stats.disabled }}</div>
        <div class="stat-label">已禁用</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-num" style="color:#409eff">{{ stats.total_clicks }}</div>
        <div class="stat-label">总点击</div>
      </el-card>
    </div>

    <el-card v-loading="loading">
      <el-table :data="list">
        <el-table-column label="号码" min-width="160">
          <template #default="{ row }">
            <div style="font-weight:600;font-size:14px">{{ row.phone }}</div>
            <div v-if="row.name" style="color:#999;font-size:12px">{{ row.name }}</div>
          </template>
        </el-table-column>
        <el-table-column v-if="isAdmin" label="所属代理" width="150">
          <template #default="{ row }">
            <div>{{ getAgentName(row) }}</div>
            <div v-if="row.agent_id?.agent_code" style="color:#909399;font-size:12px">{{ row.agent_id.agent_code }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="click_count" label="点击次数" width="100" />
        <el-table-column label="最后点击" width="170">
          <template #default="{ row }">
            <span style="font-size:12px;color:#999">{{ formatTime(row.last_clicked_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="封禁时间" width="170">
          <template #default="{ row }">
            <span v-if="row.banned_at" style="font-size:12px;color:#f56c6c">{{ formatTime(row.banned_at) }}</span>
            <span v-else style="color:#ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="权重" width="70">
          <template #default="{ row }">
            <span style="color:#999">{{ row.sort_weight || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="120">
          <template #default="{ row }">
            <span style="font-size:12px;color:#999">{{ row.note || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button text :type="row.status === 'active' ? 'warning' : 'success'" size="small" @click="toggleStatus(row)">
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button v-if="row.status === 'active'" text type="danger" size="small" @click="markBanned(row)">标记封禁</el-button>
            <el-button text size="small" @click="resetClicks(row)">重置统计</el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row._id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑WhatsApp' : '添加WhatsApp'" width="480px">
      <el-form label-width="90px">
        <el-form-item v-if="isAdmin && !editingId" label="所属代理" required>
          <el-select v-model="form.agent_id" placeholder="选择代理" filterable style="width:100%">
            <el-option v-for="a in agents" :key="a._id" :value="a._id" :label="`${a.first_name || ''} ${a.last_name || ''} (${a.agent_code})`.trim()">
              <span>{{ a.first_name || '' }} {{ a.last_name || '' }}</span>
              <span style="color:#909399;font-size:12px;margin-left:8px">{{ a.agent_code }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="号码" required>
          <el-input v-model="form.phone" placeholder="含国际区号，如 +6281234567890" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="备注名称（可选）" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="form.sort_weight" :min="0" :max="9999" :step="1" />
          <span style="margin-left:8px;color:#999;font-size:12px">数值越大越优先</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="备注信息（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">{{ editingId ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  flex: 1;
  text-align: center;
}
.stat-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}
</style>
