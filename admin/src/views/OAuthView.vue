<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { ElMessage } from 'element-plus'

const loading = ref(true)
const providers = ref([])
const activeTab = ref('google')
const saving = ref(false)

const providerMeta = {
  google: { label: 'Google', color: '#4285F4', docsUrl: 'https://console.cloud.google.com/apis/credentials' },
  facebook: { label: 'Facebook', color: '#1877F2', docsUrl: 'https://developers.facebook.com/apps/' },
  amazon: { label: 'Amazon', color: '#FF9900', docsUrl: 'https://developer.amazon.com/loginwithamazon/console/' },
  paypal: { label: 'PayPal', color: '#253B80', docsUrl: 'https://developer.paypal.com/dashboard/applications/' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', docsUrl: 'https://www.linkedin.com/developers/apps/' },
}

async function fetchProviders() {
  loading.value = true
  try {
    const res = await api.get('/oauth')
    providers.value = res.data.providers
    if (providers.value.length && !providers.value.find(p => p.provider === activeTab.value)) {
      activeTab.value = providers.value[0].provider
    }
  } catch {}
  loading.value = false
}

function getProvider(name) {
  return providers.value.find(p => p.provider === name) || {}
}

async function handleSave(providerName) {
  const p = getProvider(providerName)
  if (!p._id) return
  saving.value = true
  try {
    await api.put(`/oauth/${providerName}`, {
      enabled: p.enabled,
      client_id: p.client_id,
      client_secret: p.client_secret,
      redirect_uri: p.redirect_uri,
      scopes: p.scopes,
      note: p.note,
    })
    ElMessage.success(`${providerMeta[providerName].label} 配置已保存`)
  } catch {}
  saving.value = false
}

async function toggleEnabled(providerName) {
  const p = getProvider(providerName)
  if (!p._id) return
  try {
    await api.put(`/oauth/${providerName}`, { enabled: !p.enabled })
    p.enabled = !p.enabled
    ElMessage.success(p.enabled ? '已启用' : '已禁用')
  } catch {}
}

onMounted(fetchProviders)
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">登录方式配置</h2>
    </div>

    <el-card v-loading="loading">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane
          v-for="name in ['google', 'facebook', 'amazon', 'paypal', 'linkedin']"
          :key="name"
          :name="name"
        >
          <template #label>
            <div style="display:flex;align-items:center;gap:8px">
              <span :style="{ width: '8px', height: '8px', borderRadius: '50%', background: getProvider(name).enabled ? '#67c23a' : '#dcdfe6', flexShrink: 0 }"></span>
              <span>{{ providerMeta[name].label }}</span>
            </div>
          </template>

          <div v-if="getProvider(name)._id" style="max-width:640px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
              <div>
                <h3 style="font-size:18px;font-weight:600;margin-bottom:4px">{{ providerMeta[name].label }} Login</h3>
                <a :href="providerMeta[name].docsUrl" target="_blank" style="font-size:12px;color:#409eff">
                  Developer Console &rarr;
                </a>
              </div>
              <el-switch
                :model-value="getProvider(name).enabled"
                active-text="启用"
                inactive-text="禁用"
                @change="toggleEnabled(name)"
              />
            </div>

            <el-form label-width="120px" label-position="left">
              <el-form-item label="Client ID">
                <el-input v-model="getProvider(name).client_id" placeholder="OAuth Client ID" />
              </el-form-item>
              <el-form-item label="Client Secret">
                <el-input v-model="getProvider(name).client_secret" placeholder="OAuth Client Secret" show-password />
              </el-form-item>
              <el-form-item label="Redirect URI">
                <el-input v-model="getProvider(name).redirect_uri" placeholder="/api/auth/google/callback" />
              </el-form-item>
              <el-form-item label="Scopes">
                <el-input v-model="getProvider(name).scopes" placeholder="openid email profile" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="getProvider(name).note" type="textarea" :rows="2" placeholder="备注信息（可选）" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="saving" @click="handleSave(name)">保存配置</el-button>
              </el-form-item>
            </el-form>

            <el-alert
              v-if="getProvider(name).enabled && !getProvider(name).client_id"
              title="已启用但未填写 Client ID，登录功能将无法正常使用"
              type="warning"
              show-icon
              :closable="false"
              style="margin-top:16px"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
