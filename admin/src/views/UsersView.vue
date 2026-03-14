<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const users = ref([])
const pagination = ref({ page: 1, limit: 20, total: 0 })
const search = ref('')
const filterStatus = ref('')
const filterDevice = ref('')
const filterSource = ref('')
const loading = ref(true)
const stats = ref({ total: 0, today: 0, pc: 0, mobile: 0 })

// Detail / Edit dialog
const detailVisible = ref(false)
const detailUser = ref(null)
const activeTab = ref('info')

// Edit form
const editForm = ref({
  email: '', first_name: '', last_name: '', phone: '', status: 'active', note: '', tags: '',
})
const editSaving = ref(false)

// Reset password form
const pwdForm = ref({ password: '', confirmPassword: '' })
const pwdSaving = ref(false)

async function fetchUsers() {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: search.value || undefined,
      status: filterStatus.value || undefined,
      device: filterDevice.value || undefined,
      source: filterSource.value || undefined,
    }
    const res = await api.get('/users', { params })
    users.value = res.data.users
    pagination.value = { ...pagination.value, ...res.data.pagination }
    if (res.data.stats) stats.value = res.data.stats
  } catch {}
  loading.value = false
}

function handleSearch() {
  pagination.value.page = 1
  fetchUsers()
}

function handleFilter() {
  pagination.value.page = 1
  fetchUsers()
}

async function toggleStatus(user) {
  const newStatus = user.status === 'active' ? 'disabled' : 'active'
  await api.put(`/users/${user._id}`, { status: newStatus })
  ElMessage.success(newStatus === 'active' ? '已启用' : '已禁用')
  fetchUsers()
}

async function handleDelete(id) {
  await ElMessageBox.confirm('确定要删除该用户吗？此操作不可撤销。', '提示', { type: 'warning' })
  await api.delete(`/users/${id}`)
  ElMessage.success('删除成功')
  fetchUsers()
}

function openDetail(user) {
  detailUser.value = user
  activeTab.value = 'info'
  // Populate edit form
  editForm.value = {
    email: user.email || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
    status: user.status || 'active',
    note: user.note || '',
    tags: (user.tags || []).join(', '),
  }
  // Reset password form
  pwdForm.value = { password: '', confirmPassword: '' }
  detailVisible.value = true
}

async function saveEdit() {
  if (!editForm.value.email) {
    ElMessage.warning('邮箱不能为空')
    return
  }
  editSaving.value = true
  try {
    const data = {
      email: editForm.value.email,
      first_name: editForm.value.first_name,
      last_name: editForm.value.last_name,
      phone: editForm.value.phone,
      status: editForm.value.status,
      note: editForm.value.note,
      tags: editForm.value.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    await api.put(`/users/${detailUser.value._id}`, data)
    ElMessage.success('保存成功')
    fetchUsers()
  } catch (err) {
    ElMessage.error(err.message || '保存失败')
  }
  editSaving.value = false
}

async function resetPassword() {
  const { password, confirmPassword } = pwdForm.value
  if (!password) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (password.length < 6 || password.length > 15) {
    ElMessage.warning('密码长度为6-15位')
    return
  }
  if (password !== confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }
  pwdSaving.value = true
  try {
    await api.put(`/users/${detailUser.value._id}/reset-password`, { password })
    ElMessage.success('密码已重置')
    pwdForm.value = { password: '', confirmPassword: '' }
  } catch (err) {
    ElMessage.error(err.message || '重置失败')
  }
  pwdSaving.value = false
}

function deviceIcon(d) {
  if (d === 'mobile') return '📱'
  if (d === 'tablet') return '📟'
  if (d === 'pc') return '💻'
  return '❓'
}

function sourceLabel(s) {
  const map = { direct: '直接访问', google: 'Google', facebook: 'Facebook', amazon: 'Amazon', paypal: 'PayPal', linkedin: 'LinkedIn' }
  return map[s] || s || '直接访问'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('zh-CN')
}

function timeSince(d) {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return formatDate(d)
}

onMounted(fetchUsers)
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">会员管理（客户端用户）</h2>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-label">总会员数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.today }}</div>
        <div class="stat-label">今日新增</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.pc }}</div>
        <div class="stat-label">PC端注册</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.mobile }}</div>
        <div class="stat-label">移动端注册</div>
      </div>
    </div>

    <el-card v-loading="loading">
      <!-- Filters -->
      <div class="filter-bar">
        <el-input v-model="search" placeholder="搜索邮箱 / 姓名" clearable style="width:240px" @keyup.enter="handleSearch" @clear="handleSearch">
          <template #append><el-button icon="Search" @click="handleSearch" /></template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width:110px" @change="handleFilter">
          <el-option label="正常" value="active" />
          <el-option label="禁用" value="disabled" />
        </el-select>
        <el-select v-model="filterDevice" placeholder="注册终端" clearable style="width:130px" @change="handleFilter">
          <el-option label="PC" value="pc" />
          <el-option label="手机" value="mobile" />
          <el-option label="平板" value="tablet" />
        </el-select>
        <el-select v-model="filterSource" placeholder="注册来源" clearable style="width:140px" @change="handleFilter">
          <el-option label="直接访问" value="direct" />
          <el-option label="Google" value="google" />
          <el-option label="Facebook" value="facebook" />
          <el-option label="Amazon" value="amazon" />
          <el-option label="PayPal" value="paypal" />
          <el-option label="LinkedIn" value="linkedin" />
        </el-select>
      </div>

      <!-- Table -->
      <el-table :data="users" @row-click="openDetail" style="cursor:pointer">
        <el-table-column prop="email" label="邮箱" min-width="200">
          <template #default="{ row }">
            <div>
              <div style="font-weight:600">{{ row.email }}</div>
              <div v-if="row.first_name || row.last_name" style="font-size:12px;color:#999">{{ row.first_name }} {{ row.last_name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="终端" width="70" align="center">
          <template #default="{ row }">
            <span :title="row.register_device">{{ deviceIcon(row.register_device) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="110">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ sourceLabel(row.register_source) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="渠道" width="130">
          <template #default="{ row }">
            <span v-if="row.register_channel" style="font-size:12px;color:#666">{{ row.register_channel }}</span>
            <span v-else style="color:#c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="浏览器 / 系统" width="150">
          <template #default="{ row }">
            <div style="font-size:12px">
              <div>{{ row.register_browser || '—' }}</div>
              <div style="color:#999">{{ row.register_os || '—' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="IP" width="130">
          <template #default="{ row }">
            <span style="font-size:12px;color:#666">{{ row.register_ip || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">{{ row.status === 'active' ? '正常' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单 / 消费" width="120">
          <template #default="{ row }">
            <div style="font-size:12px">
              <div>{{ row.orders_count || 0 }} 单</div>
              <div style="color:#e6a23c;font-weight:600">${{ (row.total_spent || 0).toFixed(2) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="登录次数" width="90" align="center">
          <template #default="{ row }">{{ row.login_count || 0 }}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="150">
          <template #default="{ row }">
            <span style="font-size:12px">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click.stop="openDetail(row)">编辑</el-button>
            <el-button text :type="row.status === 'active' ? 'warning' : 'success'" size="small" @click.stop="toggleStatus(row)">{{ row.status === 'active' ? '禁用' : '启用' }}</el-button>
            <el-button text type="danger" size="small" @click.stop="handleDelete(row._id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination :current-page="pagination.page" :page-size="pagination.limit" :total="pagination.total" layout="total, prev, pager, next" @current-change="p => { pagination.page = p; fetchUsers() }" />
      </div>
    </el-card>

    <!-- User Edit Dialog -->
    <el-dialog v-model="detailVisible" title="会员管理" width="750px" destroy-on-close v-if="detailUser">
      <el-tabs v-model="activeTab">
        <!-- Tab 1: Edit Basic Info -->
        <el-tab-pane label="基本信息" name="info">
          <div class="edit-form">
            <div class="form-row">
              <div class="form-item">
                <label>邮箱 <span class="required">*</span></label>
                <el-input v-model="editForm.email" placeholder="邮箱地址" />
              </div>
              <div class="form-item">
                <label>状态</label>
                <el-select v-model="editForm.status" style="width:100%">
                  <el-option label="正常" value="active" />
                  <el-option label="禁用" value="disabled" />
                </el-select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-item">
                <label>名</label>
                <el-input v-model="editForm.first_name" placeholder="First Name" />
              </div>
              <div class="form-item">
                <label>姓</label>
                <el-input v-model="editForm.last_name" placeholder="Last Name" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-item">
                <label>手机号</label>
                <el-input v-model="editForm.phone" placeholder="手机号码" />
              </div>
              <div class="form-item">
                <label>标签（逗号分隔）</label>
                <el-input v-model="editForm.tags" placeholder="VIP, 高价值, ..." />
              </div>
            </div>
            <div class="form-row">
              <div class="form-item full">
                <label>管理备注</label>
                <el-input v-model="editForm.note" type="textarea" :rows="3" placeholder="管理员备注..." />
              </div>
            </div>
            <div class="form-actions">
              <el-button type="primary" :loading="editSaving" @click="saveEdit">保存修改</el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 2: Reset Password -->
        <el-tab-pane label="重置密码" name="password">
          <div class="edit-form">
            <el-alert type="warning" :closable="false" style="margin-bottom:20px">
              重置后新密码会立即生效，用户需使用新密码登录。请及时通知用户。
            </el-alert>
            <div class="form-row">
              <div class="form-item">
                <label>新密码 <span class="required">*</span></label>
                <el-input v-model="pwdForm.password" type="password" show-password placeholder="输入新密码（6-15位）" />
              </div>
              <div class="form-item">
                <label>确认密码 <span class="required">*</span></label>
                <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
              </div>
            </div>
            <div class="form-actions">
              <el-button type="danger" :loading="pwdSaving" @click="resetPassword">确认重置密码</el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 3: Registration Tracking (read-only) -->
        <el-tab-pane label="注册追踪" name="tracking">
          <div class="detail-grid">
            <div class="detail-section">
              <h4 class="detail-section-title">注册信息</h4>
              <div class="detail-row"><span class="detail-label">注册来源</span><el-tag size="small" type="info">{{ sourceLabel(detailUser.register_source) }}</el-tag></div>
              <div class="detail-row"><span class="detail-label">注册渠道</span><span>{{ detailUser.register_channel || '—' }}</span></div>
              <div class="detail-row"><span class="detail-label">注册终端</span><span>{{ deviceIcon(detailUser.register_device) }} {{ detailUser.register_device || 'unknown' }}</span></div>
              <div class="detail-row"><span class="detail-label">注册 IP</span><span>{{ detailUser.register_ip || '—' }}</span></div>
              <div class="detail-row"><span class="detail-label">浏览器</span><span>{{ detailUser.register_browser || '—' }}</span></div>
              <div class="detail-row"><span class="detail-label">操作系统</span><span>{{ detailUser.register_os || '—' }}</span></div>
              <div class="detail-row"><span class="detail-label">语言</span><span>{{ detailUser.register_language || '—' }}</span></div>
              <div class="detail-row"><span class="detail-label">来源页面</span><span class="breakable">{{ detailUser.register_referrer || '—' }}</span></div>
              <div class="detail-row"><span class="detail-label">落地页</span><span class="breakable">{{ detailUser.register_landing_page || '—' }}</span></div>
              <div class="detail-row"><span class="detail-label">注册时间</span><span>{{ formatDate(detailUser.createdAt) }}</span></div>
            </div>

            <div class="detail-section">
              <h4 class="detail-section-title">活跃数据</h4>
              <div class="detail-row"><span class="detail-label">登录次数</span><span>{{ detailUser.login_count || 0 }}</span></div>
              <div class="detail-row"><span class="detail-label">最后登录</span><span>{{ timeSince(detailUser.last_login) }}</span></div>
              <div class="detail-row"><span class="detail-label">最后登录 IP</span><span>{{ detailUser.last_login_ip || '—' }}</span></div>
              <div class="detail-row"><span class="detail-label">最后登录终端</span><span>{{ detailUser.last_login_device || '—' }}</span></div>
              <div class="detail-row"><span class="detail-label">订单数</span><span>{{ detailUser.orders_count || 0 }}</span></div>
              <div class="detail-row"><span class="detail-label">消费总额</span><span style="color:#e6a23c;font-weight:600">${{ (detailUser.total_spent || 0).toFixed(2) }}</span></div>
            </div>

            <!-- UTM -->
            <div class="detail-section full-width" v-if="detailUser.register_utm?.source">
              <h4 class="detail-section-title">UTM 参数</h4>
              <div class="detail-row"><span class="detail-label">Source</span><span>{{ detailUser.register_utm.source }}</span></div>
              <div class="detail-row"><span class="detail-label">Medium</span><span>{{ detailUser.register_utm.medium || '—' }}</span></div>
              <div class="detail-row"><span class="detail-label">Campaign</span><span>{{ detailUser.register_utm.campaign || '—' }}</span></div>
              <div class="detail-row" v-if="detailUser.register_utm.term"><span class="detail-label">Term</span><span>{{ detailUser.register_utm.term }}</span></div>
              <div class="detail-row" v-if="detailUser.register_utm.content"><span class="detail-label">Content</span><span>{{ detailUser.register_utm.content }}</span></div>
            </div>

            <!-- User Agent -->
            <div class="detail-section full-width" v-if="detailUser.register_ua">
              <h4 class="detail-section-title">User-Agent</h4>
              <div style="font-size:11px;color:#999;word-break:break-all;line-height:1.6">{{ detailUser.register_ua }}</div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 1px solid #ebeef5;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* Edit form */
.edit-form {
  padding: 8px 0;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 18px;
}

.form-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item.full {
  flex: 1 1 100%;
}

.form-item label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.required {
  color: #f56c6c;
}

.form-actions {
  padding-top: 8px;
}

/* Detail grid (tracking tab) */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.detail-section.full-width {
  grid-column: 1 / -1;
}

.detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.detail-label {
  color: #909399;
  min-width: 80px;
  flex-shrink: 0;
}

.breakable {
  word-break: break-all;
  font-size: 12px;
}
</style>
