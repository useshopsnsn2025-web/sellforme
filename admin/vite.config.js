import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/admin/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3200,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3100',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:3100',
        changeOrigin: true
      }
    }
  }
})
