<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const admins = ref([])
const loading = ref(true)

// Add dialog
const dialogVisible = ref(false)
const form = ref({ email: '', password: '', first_name: '', last_name: '' })

async function fetchAdmins() {
  loading.value = true
  try {
    const res = await api.get('/users', { params: { role: 'admin', limit: 100 } })
    admins.value = res.data.users
  } catch {}
  loading.value = false
}

function openAddDialog() {
  form.value = { email: '', password: '', first_name: '', last_name: '' }
  dialogVisible.value = true
}

async function handleAdd() {
  if (!form.value.email || !form.value.password) return ElMessage.warning('请输入邮箱和密码')
  if (form.value.password.length < 6) return ElMessage.warning('密码最少6位')
  try {
    await api.post('/users/admin', form.value)
    ElMessage.success('管理员已添加')
    dialogVisible.value = false
    fetchAdmins()
  } catch {}
}

async function toggleStatus(admin) {
  if (admin._id === authStore.user?._id) return ElMessage.warning('不能禁用自己')
  const newStatus = admin.status === 'active' ? 'disabled' : 'active'
  await api.put(`/users/${admin._id}`, { status: newStatus })
  ElMessage.success(newStatus === 'active' ? '已启用' : '已禁用')
  fetchAdmins()
}

async function handleDelete(id) {
  if (id === authStore.user?._id) return ElMessage.warning('不能删除自己')
  await ElMessageBox.confirm('确定要删除该管理员吗？', '提示', { type: 'warning' })
  await api.delete(`/users/${id}`)
  ElMessage.success('删除成功')
  fetchAdmins()
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('zh-CN')
}

onMounted(fetchAdmins)
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">管理员管理</h2>
    </div>

    <el-card v-loading="loading">
      <div style="margin-bottom:16px;display:flex;justify-content:flex-end">
        <el-button type="primary" icon="Plus" @click="openAddDialog">添加管理员</el-button>
      </div>

      <el-table :data="admins">
        <el-table-column prop="email" label="邮箱" min-width="220" />
        <el-table-column label="姓名" width="160">
          <template #default="{ row }">{{ row.first_name || '' }} {{ row.last_name || '' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">{{ row.status === 'active' ? '正常' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="180">
          <template #default="{ row }">{{ formatDate(row.last_login) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button text :type="row.status === 'active' ? 'warning' : 'success'" size="small" @click="toggleStatus(row)" :disabled="row._id === authStore.user?._id">{{ row.status === 'active' ? '禁用' : '启用' }}</el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row._id)" :disabled="row._id === authStore.user?._id">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add Admin Dialog -->
    <el-dialog v-model="dialogVisible" title="添加管理员" width="480px">
      <el-form label-width="80px">
        <el-form-item label="邮箱" required>
          <el-input v-model="form.email" placeholder="admin@example.com" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="form.password" type="password" placeholder="至少6位" show-password />
        </el-form-item>
        <el-form-item label="名">
          <el-input v-model="form.first_name" placeholder="可选" />
        </el-form-item>
        <el-form-item label="姓">
          <el-input v-model="form.last_name" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>
