<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const agents = ref([])
const loading = ref(true)

// Frontend site URL from system config
const siteUrl = ref('')

async function fetchSiteUrl() {
  try {
    const res = await api.get('/site-config')
    const cfg = res.data.configs?.find(c => c.key === 'site_url')
    siteUrl.value = cfg?.value || window.location.origin
  } catch {
    siteUrl.value = window.location.origin
  }
}

// Add / Edit dialog
const dialogVisible = ref(false)
const dialogTitle = ref('添加代理')
const editingId = ref(null)
const form = ref({ email: '', password: '', first_name: '', last_name: '', agent_code: '', agent_weight: 0, note: '' })

// Created link dialog
const createdLinkVisible = ref(false)
const createdLink = ref('')

// Reset password dialog
const resetPwdVisible = ref(false)
const resetPwdForm = ref({ id: '', password: '' })

async function fetchAgents() {
  loading.value = true
  try {
    const res = await api.get('/agents')
    agents.value = res.data.agents
  } catch {}
  loading.value = false
}

function openAddDialog() {
  editingId.value = null
  dialogTitle.value = '添加代理'
  form.value = { email: '', password: '', first_name: '', last_name: '', agent_code: '', agent_weight: 0, note: '' }
  dialogVisible.value = true
}

function openEditDialog(row) {
  editingId.value = row._id
  dialogTitle.value = '编辑代理'
  form.value = {
    email: row.email,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    agent_code: row.agent_code || '',
    agent_weight: row.agent_weight || 0,
    note: row.note || '',
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.email) return ElMessage.warning('请输入邮箱')
  if (!form.value.agent_code) return ElMessage.warning('请输入推广码')

  if (editingId.value) {
    // Update
    const { password, ...update } = form.value
    await api.put(`/agents/${editingId.value}`, update)
    ElMessage.success('更新成功')
  } else {
    // Create
    if (!form.value.password || form.value.password.length < 6) return ElMessage.warning('密码最少6位')
    await api.post('/agents', form.value)
    // Show the generated referral link
    const link = `${siteUrl.value}?ref=${form.value.agent_code.toLowerCase()}`
    createdLink.value = link
    createdLinkVisible.value = true
  }
  dialogVisible.value = false
  fetchAgents()
}

async function toggleStatus(row) {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  await api.put(`/agents/${row._id}`, { status: newStatus })
  ElMessage.success(newStatus === 'active' ? '已启用' : '已禁用')
  fetchAgents()
}

function openResetPwd(row) {
  resetPwdForm.value = { id: row._id, password: '' }
  resetPwdVisible.value = true
}

async function handleResetPwd() {
  if (!resetPwdForm.value.password || resetPwdForm.value.password.length < 6 || resetPwdForm.value.password.length > 15) {
    return ElMessage.warning('密码长度为6-15位')
  }
  await api.put(`/agents/${resetPwdForm.value.id}/reset-password`, { password: resetPwdForm.value.password })
  ElMessage.success('密码已重置')
  resetPwdVisible.value = false
}

async function handleDelete(id) {
  await ElMessageBox.confirm('删除代理将同时清除其所有WhatsApp号码，确定要删除吗？', '提示', { type: 'warning' })
  await api.delete(`/agents/${id}`)
  ElMessage.success('删除成功')
  fetchAgents()
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('zh-CN')
}

function getLink(code) {
  return `${siteUrl.value}?ref=${code}`
}

function copyLink(code) {
  navigator.clipboard.writeText(getLink(code)).then(() => ElMessage.success('推广链接已复制'))
}

function copyCreatedLink() {
  navigator.clipboard.writeText(createdLink.value).then(() => ElMessage.success('推广链接已复制'))
}

onMounted(() => { fetchSiteUrl(); fetchAgents() })
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">代理管理</h2>
    </div>

    <el-card v-loading="loading">
      <div style="margin-bottom:16px;display:flex;justify-content:flex-end">
        <el-button type="primary" icon="Plus" @click="openAddDialog">添加代理</el-button>
      </div>

      <el-table :data="agents" stripe>
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column label="姓名" width="140">
          <template #default="{ row }">{{ row.first_name || '' }} {{ row.last_name || '' }}</template>
        </el-table-column>
        <el-table-column label="推广码 / 链接" min-width="260">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.agent_code }}</el-tag>
            <div style="color:#909399;font-size:12px;margin-top:4px;word-break:break-all">{{ getLink(row.agent_code) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="agent_weight" label="权重" width="80" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">{{ row.status === 'active' ? '正常' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="会员数" width="80" align="center">
          <template #default="{ row }">{{ row.customers_count || 0 }}</template>
        </el-table-column>
        <el-table-column label="WhatsApp" width="90" align="center">
          <template #default="{ row }">{{ row.whatsapp_count || 0 }}</template>
        </el-table-column>
        <el-table-column label="今日流量" width="90" align="center">
          <template #default="{ row }">{{ row.today_traffic || 0 }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="copyLink(row.agent_code)">复制链接</el-button>
            <el-button text type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button text type="warning" size="small" @click="openResetPwd(row)">重置密码</el-button>
            <el-button text :type="row.status === 'active' ? 'warning' : 'success'" size="small" @click="toggleStatus(row)">{{ row.status === 'active' ? '禁用' : '启用' }}</el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row._id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add / Edit Agent Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form label-width="80px">
        <el-form-item label="邮箱" required>
          <el-input v-model="form.email" placeholder="agent@example.com" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item v-if="!editingId" label="密码" required>
          <el-input v-model="form.password" type="password" placeholder="至少6位" show-password />
        </el-form-item>
        <el-form-item label="推广码" required>
          <el-input v-model="form.agent_code" placeholder="唯一推广码，如 agent01" />
        </el-form-item>
        <el-form-item label="名">
          <el-input v-model="form.first_name" placeholder="可选" />
        </el-form-item>
        <el-form-item label="姓">
          <el-input v-model="form.last_name" placeholder="可选" />
        </el-form-item>
        <el-form-item label="权重">
          <el-input-number v-model="form.agent_weight" :min="0" :max="9999" />
          <span style="margin-left:8px;color:#909399;font-size:12px">权重越高，无推广码时优先显示</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">{{ editingId ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- Reset Password Dialog -->
    <el-dialog v-model="resetPwdVisible" title="重置代理密码" width="400px">
      <el-form label-width="80px">
        <el-form-item label="新密码" required>
          <el-input v-model="resetPwdForm.password" type="password" placeholder="6-15位密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResetPwd">确认重置</el-button>
      </template>
    </el-dialog>
    <!-- Created Link Dialog -->
    <el-dialog v-model="createdLinkVisible" title="代理创建成功" width="520px">
      <div style="text-align:center;padding:12px 0">
        <div style="font-size:14px;color:#606266;margin-bottom:16px">推广链接已生成，请复制分享给代理：</div>
        <el-input :model-value="createdLink" readonly style="margin-bottom:16px">
          <template #append>
            <el-button @click="copyCreatedLink">复制</el-button>
          </template>
        </el-input>
      </div>
      <template #footer>
        <el-button type="primary" @click="createdLinkVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
