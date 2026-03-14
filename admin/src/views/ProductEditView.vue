<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/utils/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const collections = ref([])

const form = ref({
  title: '',
  body_html: '',
  product_type: '',
  vendor: 'SellForMe',
  tags: [],
  status: 'active',
  price: 0,
  compare_at_price: null,
  condition: 'good',
  condition_description: '',
  total_inventory: 0,
  in_stock: true,
  images: [],
  variants: [{ title: 'Default', price: 0, compare_at_price: null, inventory_quantity: 0, sku: '' }],
  collections: [],
  seo_title: '',
  seo_description: ''
})

const tagInput = ref('')

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  tagInput.value = ''
}

function removeTag(index) {
  form.value.tags.splice(index, 1)
}

function addImage() {
  form.value.images.push({ src: '', alt: '' })
}

function removeImage(index) {
  form.value.images.splice(index, 1)
}

async function handleUpload(file, index) {
  const fd = new FormData()
  fd.append('image', file.raw)
  try {
    const res = await api.post('/products/upload', fd)
    form.value.images[index].src = res.data.url
  } catch {}
  return false
}

async function fetchCollections() {
  try {
    const res = await api.get('/collections', { params: { limit: 200 } })
    collections.value = res.data.collections
  } catch {}
}

async function fetchProduct() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const res = await api.get(`/products/${route.params.id}`)
    const p = res.data.product
    form.value = {
      ...form.value,
      ...p,
      collections: p.collections?.map(c => c._id || c) || [],
      compare_at_price: p.compare_at_price || null
    }
  } catch {}
  loading.value = false
}

async function handleSubmit() {
  if (!form.value.title) return ElMessage.warning('请输入产品名称')
  if (!form.value.price && form.value.price !== 0) return ElMessage.warning('请输入价格')

  loading.value = true
  try {
    if (isEdit.value) {
      await api.put(`/products/${route.params.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/products', form.value)
      ElMessage.success('创建成功')
    }
    router.push('/products')
  } catch {}
  loading.value = false
}

onMounted(() => {
  fetchCollections()
  fetchProduct()
})
</script>

<template>
  <div v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑产品' : '添加产品' }}</h2>
      <el-button @click="router.back()">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card style="margin-bottom:20px">
          <template #header><span style="font-weight:600">基本信息</span></template>
          <el-form label-width="100px">
            <el-form-item label="产品名称" required>
              <el-input v-model="form.title" placeholder="输入产品名称" />
            </el-form-item>
            <el-form-item label="产品描述">
              <el-input v-model="form.body_html" type="textarea" :rows="6" placeholder="产品描述 (支持HTML)" />
            </el-form-item>
            <el-form-item label="产品类型">
              <el-input v-model="form.product_type" placeholder="如: Electronics, Phone" />
            </el-form-item>
            <el-form-item label="品牌">
              <el-input v-model="form.vendor" />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-bottom:20px">
          <template #header><span style="font-weight:600">图片</span></template>
          <div v-for="(img, i) in form.images" :key="i" style="display:flex;gap:12px;margin-bottom:12px;align-items:center">
            <el-image v-if="img.src" :src="img.src" style="width:60px;height:60px;border-radius:6px;flex-shrink:0" fit="cover" />
            <el-input v-model="img.src" placeholder="图片URL" style="flex:1" />
            <el-input v-model="img.alt" placeholder="Alt文本" style="width:200px" />
            <el-button type="danger" text icon="Delete" @click="removeImage(i)" />
          </div>
          <el-button type="primary" plain icon="Plus" @click="addImage">添加图片</el-button>
        </el-card>

        <el-card style="margin-bottom:20px">
          <template #header><span style="font-weight:600">价格与库存</span></template>
          <el-form label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="价格" required>
                  <el-input-number v-model="form.price" :min="0" :precision="2" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="原价">
                  <el-input-number v-model="form.compare_at_price" :min="0" :precision="2" style="width:100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="库存">
                  <el-input-number v-model="form.total_inventory" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="有货">
                  <el-switch v-model="form.in_stock" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card style="margin-bottom:20px">
          <template #header><span style="font-weight:600">状态</span></template>
          <el-select v-model="form.status" style="width:100%">
            <el-option label="上架" value="active" />
            <el-option label="草稿" value="draft" />
            <el-option label="归档" value="archived" />
          </el-select>
        </el-card>

        <el-card style="margin-bottom:20px">
          <template #header><span style="font-weight:600">成色</span></template>
          <el-select v-model="form.condition" style="width:100%">
            <el-option label="全新" value="new" />
            <el-option label="几乎全新" value="like-new" />
            <el-option label="良好" value="good" />
            <el-option label="一般" value="fair" />
            <el-option label="较差" value="poor" />
          </el-select>
          <el-input v-model="form.condition_description" type="textarea" :rows="2" placeholder="成色描述" style="margin-top:12px" />
        </el-card>

        <el-card style="margin-bottom:20px">
          <template #header><span style="font-weight:600">分类</span></template>
          <el-select v-model="form.collections" multiple placeholder="选择分类" style="width:100%">
            <el-option v-for="c in collections" :key="c._id" :label="c.title" :value="c._id" />
          </el-select>
        </el-card>

        <el-card style="margin-bottom:20px">
          <template #header><span style="font-weight:600">标签</span></template>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
            <el-tag v-for="(tag, i) in form.tags" :key="i" closable @close="removeTag(i)">{{ tag }}</el-tag>
          </div>
          <el-input v-model="tagInput" placeholder="输入标签后按回车" @keyup.enter="addTag">
            <template #append><el-button @click="addTag">添加</el-button></template>
          </el-input>
        </el-card>

        <el-card>
          <template #header><span style="font-weight:600">SEO</span></template>
          <el-input v-model="form.seo_title" placeholder="SEO标题" style="margin-bottom:12px" />
          <el-input v-model="form.seo_description" type="textarea" :rows="3" placeholder="SEO描述" />
        </el-card>
      </el-col>
    </el-row>

    <div style="margin-top:20px;text-align:right">
      <el-button @click="router.back()">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">{{ isEdit ? '保存修改' : '创建产品' }}</el-button>
    </div>
  </div>
</template>
