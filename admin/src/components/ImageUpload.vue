<script setup>
import { ref, computed } from 'vue'
import api from '@/utils/api'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const SERVER_BASE = import.meta.env.VITE_SERVER_BASE || ''
function fullUrl(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : SERVER_BASE + url
}

const imageUrl = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Dialog state
const dialogVisible = ref(false)
const activeMode = ref('library')
const loading = ref(false)
const images = ref([])
const groups = ref([])
const activeGroup = ref('')
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selected = ref(null)

// External URL
const externalUrl = ref('')
const externalGroup = ref('默认分组')

// Upload
const fileInput = ref(null)
const uploading = ref(false)

const totalAll = computed(() => groups.value.reduce((sum, g) => sum + g.count, 0))

function openDialog() {
  dialogVisible.value = true
  activeMode.value = 'library'
  selected.value = null
  searchText.value = ''
  activeGroup.value = ''
  currentPage.value = 1
  fetchImages()
}

async function fetchImages() {
  loading.value = true
  try {
    const params = { page: currentPage.value, limit: pageSize.value }
    if (activeGroup.value) params.group = activeGroup.value
    if (searchText.value) params.search = searchText.value
    const res = await api.get('/upload', { params })
    images.value = res.data.images
    groups.value = res.data.groups
    total.value = res.data.total
  } catch {}
  loading.value = false
}

function selectGroup(name) {
  activeGroup.value = name
  currentPage.value = 1
  fetchImages()
}

function onSearch() {
  currentPage.value = 1
  fetchImages()
}

function onPageChange(p) {
  currentPage.value = p
  fetchImages()
}

function selectImage(img) {
  selected.value = img
}

function confirmSelect() {
  if (activeMode.value === 'library') {
    if (!selected.value) return ElMessage.warning('请选择一张图片')
    imageUrl.value = selected.value.url
  }
  dialogVisible.value = false
}

function triggerUpload() {
  fileInput.value?.click()
}

async function onFileChange(e) {
  const files = e.target.files
  if (!files?.length) return
  uploading.value = true
  try {
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        ElMessage.warning(`${file.name} 超过 5MB，已跳过`)
        continue
      }
      const formData = new FormData()
      formData.append('image', file)
      formData.append('group', activeGroup.value || '默认分组')
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    ElMessage.success('上传成功')
    fetchImages()
  } catch {
    ElMessage.error('上传失败')
  }
  uploading.value = false
  e.target.value = ''
}

async function addExternalUrl() {
  if (!externalUrl.value) return ElMessage.warning('请输入图片 URL')
  try {
    await api.post('/upload/external', {
      url: externalUrl.value,
      group: externalGroup.value || '默认分组',
    })
    ElMessage.success('已添加到图片库')
    imageUrl.value = externalUrl.value
    externalUrl.value = ''
    dialogVisible.value = false
  } catch {}
}

function useExternalUrl() {
  if (!externalUrl.value) return ElMessage.warning('请输入图片 URL')
  imageUrl.value = externalUrl.value
  externalUrl.value = ''
  dialogVisible.value = false
}

function clearImage() {
  imageUrl.value = ''
}
</script>

<template>
  <div class="image-upload-wrap">
    <!-- Preview or trigger -->
    <div v-if="imageUrl" class="preview-box">
      <el-image :src="fullUrl(imageUrl)" fit="contain" class="preview-img" :preview-src-list="[fullUrl(imageUrl)]" />
      <div class="preview-actions">
        <el-button size="small" @click="openDialog">替换</el-button>
        <el-button size="small" type="danger" @click="clearImage">移除</el-button>
      </div>
    </div>
    <div v-else class="upload-trigger" @click="openDialog">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#c0c4cc">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span style="font-size:13px;color:#999;margin-top:6px">选择图片</span>
    </div>

    <input ref="fileInput" type="file" accept="image/*" multiple style="display:none" @change="onFileChange" />

    <!-- Image Library Dialog -->
    <el-dialog v-model="dialogVisible" title="选择图片" width="900px" top="5vh" :close-on-click-modal="false">
      <!-- Top bar -->
      <div class="picker-topbar">
        <div class="picker-modes">
          <el-button
            :type="activeMode === 'library' ? 'primary' : ''"
            size="small"
            @click="activeMode = 'library'; fetchImages()"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            上传图片
          </el-button>
          <el-button
            :type="activeMode === 'external' ? 'primary' : ''"
            size="small"
            @click="activeMode = 'external'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            外部链接
          </el-button>
        </div>
        <el-input
          v-if="activeMode === 'library'"
          v-model="searchText"
          placeholder="搜索"
          size="small"
          style="width:180px"
          clearable
          @clear="onSearch"
          @keyup.enter="onSearch"
        />
      </div>

      <!-- Library mode -->
      <div v-if="activeMode === 'library'" class="picker-body" v-loading="loading">
        <div class="picker-groups">
          <div class="group-item" :class="{ active: !activeGroup }" @click="selectGroup('')">
            <span>全部</span>
            <span class="group-count">{{ totalAll }}</span>
          </div>
          <div
            v-for="g in groups"
            :key="g.name"
            class="group-item"
            :class="{ active: activeGroup === g.name }"
            @click="selectGroup(g.name)"
          >
            <span>{{ g.name }}</span>
            <span class="group-count">{{ g.count }}</span>
          </div>
        </div>

        <div class="picker-grid-wrap">
          <div class="picker-grid">
            <div class="img-card upload-card" @click="triggerUpload">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#c0c4cc">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div
              v-for="img in images"
              :key="img._id"
              class="img-card"
              :class="{ selected: selected?._id === img._id }"
              @click="selectImage(img)"
            >
              <el-image :src="fullUrl(img.url)" fit="cover" class="img-thumb" lazy />
              <div v-if="img.is_external" class="img-badge">外链</div>
              <div v-if="selected?._id === img._id" class="img-check">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
          </div>

          <div v-if="!images.length && !loading" style="text-align:center;padding:60px 0;color:#c0c4cc;font-size:14px">
            暂无图片，点击左上角上传
          </div>

          <div class="picker-pagination" v-if="total > pageSize">
            <el-pagination
              :current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              layout="total, prev, pager, next"
              small
              @current-change="onPageChange"
            />
          </div>
        </div>
      </div>

      <!-- External mode -->
      <div v-else class="external-body">
        <el-form label-width="80px" style="max-width:480px;margin:40px auto">
          <el-form-item label="图片 URL">
            <el-input v-model="externalUrl" placeholder="https://example.com/image.jpg" clearable />
          </el-form-item>
          <el-form-item label="分组">
            <el-input v-model="externalGroup" placeholder="默认分组" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addExternalUrl">添加到图片库并使用</el-button>
            <el-button @click="useExternalUrl">直接使用</el-button>
          </el-form-item>
          <div v-if="externalUrl" style="margin-top:16px;text-align:center">
            <el-image :src="externalUrl" fit="contain" style="max-height:200px;border-radius:8px" />
          </div>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelect">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.image-upload-wrap { width: 100%; }

.preview-box {
  display: flex; align-items: center; gap: 12px;
  border: 1px solid #ebeef5; border-radius: 8px; padding: 8px 12px;
}
.preview-img { width: 120px; height: 80px; border-radius: 6px; flex-shrink: 0; }
.preview-actions { display: flex; flex-direction: column; gap: 6px; }

.upload-trigger {
  width: 120px; height: 80px;
  border: 2px dashed #dcdfe6; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; transition: border-color 0.2s;
}
.upload-trigger:hover { border-color: #409eff; }

/* Dialog */
.picker-topbar {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
}
.picker-modes { display: flex; gap: 8px; }

.picker-body { display: flex; gap: 16px; min-height: 420px; }

.picker-groups {
  width: 130px; flex-shrink: 0;
  border-right: 1px solid #ebeef5; padding-right: 12px;
  max-height: 420px; overflow-y: auto;
}
.group-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 6px; cursor: pointer;
  font-size: 13px; color: #606266; transition: all 0.15s; margin-bottom: 2px;
}
.group-item:hover { background: #f5f7fa; }
.group-item.active { background: #ecf5ff; color: #409eff; font-weight: 600; }
.group-count { font-size: 12px; color: #999; }
.group-item.active .group-count { color: #409eff; }

.picker-grid-wrap { flex: 1; display: flex; flex-direction: column; }

.picker-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; flex: 1; align-content: start;
}

.img-card {
  position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden;
  border: 2px solid transparent; cursor: pointer; transition: border-color 0.15s; background: #f5f7fa;
}
.img-card:hover { border-color: #c0c4cc; }
.img-card.selected { border-color: #409eff; }

.upload-card {
  display: flex; align-items: center; justify-content: center;
  border: 2px dashed #dcdfe6;
}
.upload-card:hover { border-color: #409eff; }

.img-thumb { width: 100%; height: 100%; display: block; }

.img-badge {
  position: absolute; top: 4px; right: 4px;
  background: #f56c6c; color: white; font-size: 10px;
  padding: 1px 6px; border-radius: 3px; line-height: 1.5;
}
.img-check {
  position: absolute; bottom: 4px; right: 4px;
  width: 22px; height: 22px; background: #409eff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

.picker-pagination { margin-top: 12px; display: flex; justify-content: flex-end; }

.external-body { min-height: 300px; }
</style>
