<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'
import { ElMessage } from 'element-plus'

const activeTab = ref('general')
const loading = ref(true)
const saving = ref(false)
const configs = ref([])
const formData = ref({})

// Test email
const testEmail = ref('')
const testingSend = ref(false)

// Template preview
const previewVisible = ref(false)
const previewHtml = ref('')

async function fetchConfigs() {
  loading.value = true
  try {
    const res = await api.get('/site-config')
    configs.value = res.data.configs
    const data = {}
    for (const c of configs.value) {
      data[c.key] = c.value
    }
    formData.value = data
  } catch {}
  loading.value = false
}

// Filter configs by group
const generalConfigs = computed(() => configs.value.filter(c => c.group === 'general'))
const emailConfigs = computed(() => configs.value.filter(c => c.group === 'email'))
const templateConfigs = computed(() => configs.value.filter(c => c.group === 'email_template'))

async function handleSave() {
  saving.value = true
  try {
    await api.put('/site-config', { configs: formData.value })
    ElMessage.success('保存成功')
    fetchConfigs()
  } catch {}
  saving.value = false
}

async function handleTestEmail() {
  if (!testEmail.value) return ElMessage.warning('请输入收件邮箱')
  testingSend.value = true
  try {
    await api.post('/site-config/test-email', { to: testEmail.value })
    ElMessage.success('测试邮件发送成功，请检查收件箱')
  } catch {}
  testingSend.value = false
}

function handlePreview(key) {
  const tpl = formData.value[key] || ''
  previewHtml.value = tpl
    .replace(/\{\{name\}\}/g, 'John')
    .replace(/\{\{email\}\}/g, 'john@example.com')
    .replace(/\{\{site_name\}\}/g, formData.value.site_name || 'SellForMe')
    .replace(/\{\{site_url\}\}/g, formData.value.site_url || 'https://example.com')
    .replace(/\{\{order_number\}\}/g, '100001')
    .replace(/\{\{order_total\}\}/g, '$99.99')
    .replace(/\{\{order_items\}\}/g, '<tr><td style="padding:8px;border-bottom:1px solid #eee">Sample Product</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">1</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$99.99</td></tr>')
  previewVisible.value = true
}

// SMTP config field labels in Chinese
const smtpLabels = {
  smtp_host: 'SMTP服务器',
  smtp_port: 'SMTP端口',
  smtp_secure: 'SSL/TLS加密',
  smtp_user: 'SMTP用户名',
  smtp_pass: 'SMTP密码/授权码',
  email_from_name: '发件人名称',
  email_from_address: '发件人邮箱',
}

const smtpHints = {
  smtp_host: '例如：smtp.gmail.com, smtp.qq.com, smtp.163.com',
  smtp_port: '一般为 587 (TLS) 或 465 (SSL)',
  smtp_secure: '端口465时设为true，端口587时设为false',
  smtp_user: '通常是你的完整邮箱地址',
  smtp_pass: 'QQ邮箱/163邮箱请使用授权码，Gmail请使用应用专用密码',
  email_from_address: '必须与SMTP用户名一致或为其别名',
}

const templateLabels = {
  email_tpl_welcome: '注册欢迎邮件',
  email_tpl_order: '订单确认邮件',
}

const templateVars = {
  email_tpl_welcome: ['{{name}} - 用户名', '{{email}} - 邮箱', '{{site_name}} - 站点名称', '{{site_url}} - 站点链接'],
  email_tpl_order: ['{{name}} - 用户名', '{{email}} - 邮箱', '{{order_number}} - 订单号', '{{order_total}} - 订单总额', '{{order_items}} - 商品列表HTML', '{{site_name}} - 站点名称', '{{site_url}} - 站点链接'],
}

onMounted(fetchConfigs)
</script>

<template>
  <div class="site-config-view">
    <div class="page-header">
      <h2 class="page-title">系统设置</h2>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- General Settings Tab -->
      <el-tab-pane label="基本设置" name="general">
        <el-card v-loading="loading" shadow="never">
          <el-form label-width="140px" style="max-width:600px">
            <el-form-item v-for="c in generalConfigs" :key="c.key" :label="c.label || c.key">
              <template v-if="c.key === 'contact_method'">
                <el-select v-model="formData[c.key]" style="width:100%">
                  <el-option value="whatsapp" label="WhatsApp" />
                  <el-option value="line" label="LINE" />
                </el-select>
                <div class="form-hint">选择前端客户联系按钮显示的联系方式类型</div>
              </template>
              <template v-else>
                <el-input v-model="formData[c.key]" :placeholder="`请输入${c.label || c.key}`" />
                <div v-if="c.key === 'site_url'" class="form-hint">
                  客户前端的访问地址，用于生成代理推广链接。例如：https://www.example.com
                </div>
              </template>
            </el-form-item>
          </el-form>
          <div style="margin-top:24px;padding-left:140px">
            <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Email Config Tab -->
      <el-tab-pane label="邮件配置" name="email">
        <el-card v-loading="loading" shadow="never">
          <template #header>
            <div class="card-header">
              <span>SMTP 邮件服务配置</span>
              <el-tag type="info" size="small">配置后可发送注册欢迎邮件、订单确认邮件等</el-tag>
            </div>
          </template>
          <el-form label-width="140px" style="max-width:650px">
            <el-form-item v-for="c in emailConfigs" :key="c.key" :label="smtpLabels[c.key] || c.label">
              <el-input
                v-model="formData[c.key]"
                :placeholder="smtpHints[c.key] || `请输入${c.label}`"
                :type="c.key === 'smtp_pass' ? 'password' : 'text'"
                :show-password="c.key === 'smtp_pass'"
              />
              <div v-if="smtpHints[c.key]" class="form-hint">{{ smtpHints[c.key] }}</div>
            </el-form-item>
          </el-form>
          <div style="margin-top:24px;padding-left:140px">
            <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          </div>
        </el-card>

        <!-- Test Email -->
        <el-card shadow="never" style="margin-top:16px">
          <template #header><span>发送测试邮件</span></template>
          <el-form label-width="140px" style="max-width:650px">
            <el-form-item label="收件邮箱">
              <div style="display:flex;gap:12px;width:100%">
                <el-input v-model="testEmail" placeholder="输入测试收件邮箱" />
                <el-button type="success" :loading="testingSend" @click="handleTestEmail">
                  {{ testingSend ? '发送中...' : '发送测试' }}
                </el-button>
              </div>
              <div class="form-hint">保存SMTP配置后，输入邮箱地址发送一封测试邮件以验证配置是否正确</div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- Email Templates Tab -->
      <el-tab-pane label="邮件模板" name="templates">
        <div v-loading="loading">
          <el-card v-for="c in templateConfigs" :key="c.key" shadow="never" style="margin-bottom:16px">
            <template #header>
              <div class="card-header">
                <span>{{ templateLabels[c.key] || c.label }}</span>
                <el-button type="primary" size="small" plain @click="handlePreview(c.key)">预览效果</el-button>
              </div>
            </template>
            <div class="template-vars">
              <span class="vars-label">可用变量：</span>
              <el-tag v-for="v in (templateVars[c.key] || [])" :key="v" size="small" type="info" style="margin:2px 4px">
                {{ v }}
              </el-tag>
            </div>
            <el-input
              v-model="formData[c.key]"
              type="textarea"
              :rows="12"
              placeholder="输入HTML邮件模板"
              style="margin-top:12px;font-family:monospace"
            />
          </el-card>
          <div style="margin-top:16px">
            <el-button type="primary" :loading="saving" @click="handleSave">保存模板</el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Template Preview Dialog -->
    <el-dialog v-model="previewVisible" title="邮件模板预览" width="700px" top="5vh">
      <div class="preview-container" v-html="previewHtml"></div>
    </el-dialog>
  </div>
</template>

<style scoped>
.site-config-view { padding: 24px; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; }
.form-hint { color: #909399; font-size: 12px; margin-top: 4px; line-height: 1.5; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.template-vars { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.vars-label { font-size: 13px; color: #606266; margin-right: 4px; }
.preview-container { background: #f5f5f5; padding: 20px; border-radius: 8px; max-height: 70vh; overflow-y: auto; }
</style>
