<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import ImageUpload from '@/components/ImageUpload.vue'

const collections = ref([])
const loading = ref(true)
const dialogVisible = ref(false)
const editingId = ref(null)
const form = ref({ title: '', handle: '', description: '', ad_title: '', image: { src: '', alt: '' }, published: true, sort_weight: 0 })

async function fetchCollections() {
  loading.value = true
  try {
    const res = await api.get('/collections')
    collections.value = res.data.collections
  } catch {}
  loading.value = false
}

function openDialog(item = null) {
  if (item) {
    editingId.value = item._id
    form.value = { title: item.title, handle: item.handle, description: item.description, ad_title: item.ad_title || '', image: item.image || { src: '', alt: '' }, published: item.published, sort_weight: item.sort_weight || 0 }
  } else {
    editingId.value = null
    form.value = { title: '', handle: '', description: '', ad_title: '', image: { src: '', alt: '' }, published: true, sort_weight: 0 }
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.title) return ElMessage.warning('请输入分类名称')
  try {
    if (editingId.value) {
      await api.put(`/collections/${editingId.value}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/collections', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchCollections()
  } catch {}
}

async function handleDelete(id) {
  await ElMessageBox.confirm('确定要删除该分类吗？', '提示', { type: 'warning' })
  await api.delete(`/collections/${id}`)
  ElMessage.success('删除成功')
  fetchCollections()
}

function moveUp(index) {
  if (index === 0) return
  const list = [...collections.value]
  // Swap sort_weight with the item above
  const curWeight = list[index].sort_weight || 0
  const prevWeight = list[index - 1].sort_weight || 0
  list[index].sort_weight = prevWeight
  list[index - 1].sort_weight = curWeight
  // If weights are equal, bump the one moving up
  if (curWeight === prevWeight) {
    list[index - 1].sort_weight = curWeight + 1
  }
  saveSortOrder([
    { id: list[index]._id, sort_weight: list[index].sort_weight },
    { id: list[index - 1]._id, sort_weight: list[index - 1].sort_weight }
  ])
}

function moveDown(index) {
  if (index >= collections.value.length - 1) return
  const list = [...collections.value]
  const curWeight = list[index].sort_weight || 0
  const nextWeight = list[index + 1].sort_weight || 0
  list[index].sort_weight = nextWeight
  list[index + 1].sort_weight = curWeight
  if (curWeight === nextWeight) {
    list[index].sort_weight = curWeight - 1
  }
  saveSortOrder([
    { id: list[index]._id, sort_weight: list[index].sort_weight },
    { id: list[index + 1]._id, sort_weight: list[index + 1].sort_weight }
  ])
}

async function saveSortOrder(items) {
  try {
    await api.put('/collections/batch/sort', { items })
    fetchCollections()
  } catch {
    ElMessage.error('排序保存失败')
  }
}

onMounted(fetchCollections)
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">分类管理</h2>
      <el-button type="primary" icon="Plus" @click="openDialog()">添加分类</el-button>
    </div>

    <el-card v-loading="loading">
      <el-table :data="collections">
        <el-table-column label="排序" width="100">
          <template #default="{ $index }">
            <div style="display:flex;align-items:center;gap:4px">
              <el-button :icon="'Top'" size="small" :disabled="$index === 0" @click="moveUp($index)" circle plain />
              <el-button :icon="'Bottom'" size="small" :disabled="$index === collections.length - 1" @click="moveDown($index)" circle plain />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image v-if="row.image?.src" :src="row.image.src" style="width:50px;height:50px;border-radius:6px" fit="cover" />
            <div v-else style="width:50px;height:50px;background:#f5f7fa;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#c0c4cc;font-size:12px">无图</div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="名称" min-width="160" />
        <el-table-column prop="ad_title" label="广告名称" min-width="160">
          <template #default="{ row }">
            <span v-if="row.ad_title">{{ row.ad_title }}</span>
            <span v-else style="color:#c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="handle" label="Handle" width="200" />
        <el-table-column prop="products_count" label="产品数" width="100" />
        <el-table-column label="权重" width="80">
          <template #default="{ row }">
            <span style="color:#999">{{ row.sort_weight || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="published" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.published ? 'success' : 'info'" size="small">{{ row.published ? '已发布' : '未发布' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="80">
          <template #default="{ row }">
            <el-tag :type="row.source === 'scraped' ? 'warning' : ''" size="small">{{ row.source === 'scraped' ? '采集' : '手动' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="handleDelete(row._id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑分类' : '添加分类'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.title" placeholder="分类名称" />
        </el-form-item>
        <el-form-item label="Handle">
          <el-input v-model="form.handle" placeholder="URL标识 (自动生成)" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="广告名称">
          <el-input v-model="form.ad_title" placeholder="前端展示的广告标题（可选）" />
        </el-form-item>
        <el-form-item label="图片">
          <ImageUpload v-model="form.image.src" placeholder="输入图片 URL 或点击上传" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="form.sort_weight" :min="0" :max="9999" :step="1" />
          <span style="margin-left:8px;color:#999;font-size:12px">数值越大越靠前</span>
        </el-form-item>
        <el-form-item label="已发布">
          <el-switch v-model="form.published" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">{{ editingId ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
