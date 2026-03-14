<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import ImageUpload from '@/components/ImageUpload.vue'

const loading = ref(true)
const pages = ref([])
const configs = ref([])
const activeTab = ref('home')

// Banner dialog
const bannerDialogVisible = ref(false)
const editingBannerId = ref(null)
const currentPage = ref('')
const bannerForm = ref({
  image: '', title: '', subtitle: '', description: '',
  link: '', button_text: '', sort_weight: 0, enabled: true
})

async function fetchConfigs() {
  loading.value = true
  try {
    const res = await api.get('/page-config')
    pages.value = res.data.pages
    configs.value = res.data.configs
    if (pages.value.length && !pages.value.find(p => p.key === activeTab.value)) {
      activeTab.value = pages.value[0].key
    }
  } catch {}
  loading.value = false
}

function getConfig(pageKey) {
  return configs.value.find(c => c.page === pageKey) || { banners: [], config: {} }
}

function getPageLabel(pageKey) {
  const p = pages.value.find(p => p.key === pageKey)
  return p ? p.label : pageKey
}

function openBannerDialog(pageKey, banner = null) {
  currentPage.value = pageKey
  if (banner) {
    editingBannerId.value = banner._id
    bannerForm.value = {
      image: banner.image || '',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      link: banner.link || '',
      button_text: banner.button_text || '',
      sort_weight: banner.sort_weight || 0,
      enabled: banner.enabled !== false,
    }
  } else {
    editingBannerId.value = null
    bannerForm.value = {
      image: '', title: '', subtitle: '', description: '',
      link: '', button_text: '', sort_weight: 0, enabled: true
    }
  }
  bannerDialogVisible.value = true
}

async function handleBannerSubmit() {
  if (!bannerForm.value.image) return ElMessage.warning('请输入图片地址')
  try {
    if (editingBannerId.value) {
      await api.put(`/page-config/${currentPage.value}/banners/${editingBannerId.value}`, bannerForm.value)
      ElMessage.success('更新成功')
    } else {
      await api.post(`/page-config/${currentPage.value}/banners`, bannerForm.value)
      ElMessage.success('添加成功')
    }
    bannerDialogVisible.value = false
    fetchConfigs()
  } catch {}
}

async function handleDeleteBanner(pageKey, bannerId) {
  await ElMessageBox.confirm('确定删除该广告图？', '提示', { type: 'warning' })
  try {
    await api.delete(`/page-config/${pageKey}/banners/${bannerId}`)
    ElMessage.success('删除成功')
    fetchConfigs()
  } catch {}
}

async function toggleBannerEnabled(pageKey, banner) {
  try {
    await api.put(`/page-config/${pageKey}/banners/${banner._id}`, { enabled: !banner.enabled })
    banner.enabled = !banner.enabled
    ElMessage.success(banner.enabled ? '已启用' : '已禁用')
  } catch {}
}

const SERVER_BASE = import.meta.env.VITE_SERVER_BASE || ''
function fullUrl(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : SERVER_BASE + url
}

const sortedBanners = computed(() => {
  return (pageKey) => {
    const cfg = getConfig(pageKey)
    return [...(cfg.banners || [])].sort((a, b) => (b.sort_weight || 0) - (a.sort_weight || 0))
  }
})

onMounted(fetchConfigs)
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">页面装修</h2>
    </div>

    <el-card v-loading="loading">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane
          v-for="p in pages"
          :key="p.key"
          :name="p.key"
          :label="p.label"
        >
          <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
            <h3 style="font-size:16px;font-weight:600">{{ p.label }} - 广告图管理</h3>
            <el-button type="primary" icon="Plus" @click="openBannerDialog(p.key)">添加广告图</el-button>
          </div>

          <el-table :data="sortedBanners(p.key)" style="width:100%">
            <el-table-column label="预览" width="120">
              <template #default="{ row }">
                <el-image
                  v-if="row.image"
                  :src="fullUrl(row.image)"
                  :preview-src-list="[fullUrl(row.image)]"
                  style="width:100px;height:56px;border-radius:6px"
                  fit="cover"
                />
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="140">
              <template #default="{ row }">
                <div>
                  <div style="font-weight:600">{{ row.title || '—' }}</div>
                  <div v-if="row.subtitle" style="font-size:12px;color:#999">{{ row.subtitle }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="link" label="链接" min-width="160">
              <template #default="{ row }">
                <span v-if="row.link" style="font-size:12px;color:#409eff">{{ row.link }}</span>
                <span v-else style="color:#c0c4cc">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="button_text" label="按钮文字" width="120">
              <template #default="{ row }">
                {{ row.button_text || '—' }}
              </template>
            </el-table-column>
            <el-table-column label="权重" width="80">
              <template #default="{ row }">
                <span style="color:#999">{{ row.sort_weight || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="toggleBannerEnabled(p.key, row)">{{ row.enabled ? '禁用' : '启用' }}</el-button>
                <el-button text type="primary" size="small" @click="openBannerDialog(p.key, row)">编辑</el-button>
                <el-button text type="danger" size="small" @click="handleDeleteBanner(p.key, row._id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!sortedBanners(p.key).length" description="暂无广告图，点击上方按钮添加" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Banner Dialog -->
    <el-dialog v-model="bannerDialogVisible" :title="editingBannerId ? '编辑广告图' : '添加广告图'" width="600px">
      <el-form label-width="90px">
        <el-form-item label="图片" required>
          <ImageUpload v-model="bannerForm.image" placeholder="输入图片 URL 或点击上传" />
          <div style="color:#999;font-size:12px;margin-top:4px;line-height:1.6">
            建议尺寸：1920 × 500 像素，移动端自动适配裁剪至 750 × 350。<br/>
            支持 JPG / PNG / WebP 格式，文件大小不超过 5MB。
          </div>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="bannerForm.title" placeholder="广告标题（可选）" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="bannerForm.subtitle" placeholder="副标题（可选）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="bannerForm.description" type="textarea" :rows="2" placeholder="描述文字（可选）" />
        </el-form-item>
        <el-form-item label="链接地址">
          <el-input v-model="bannerForm.link" placeholder="点击跳转地址，如 /collections/iphone16" />
        </el-form-item>
        <el-form-item label="按钮文字">
          <el-input v-model="bannerForm.button_text" placeholder="按钮文字，如 Shop Now" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="bannerForm.sort_weight" :min="0" :max="9999" :step="1" />
          <span style="margin-left:8px;color:#999;font-size:12px">数值越大越靠前</span>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="bannerForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bannerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBannerSubmit">{{ editingBannerId ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
