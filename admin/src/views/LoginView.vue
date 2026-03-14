<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const form = ref({ email: '', password: '' })
const loading = ref(false)

async function handleLogin() {
  if (!form.value.email || !form.value.password) {
    return ElMessage.warning('请输入邮箱和密码')
  }
  loading.value = true
  try {
    await authStore.login(form.value.email, form.value.password)
    ElMessage.success('登录成功')
    router.push('/')
  } catch {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">SellForMe Admin</h1>
      <el-form @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.email" placeholder="邮箱" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" :loading="loading" @click="handleLogin">登 录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
