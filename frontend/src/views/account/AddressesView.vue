<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const addresses = ref([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref(null)
const saving = ref(false)

const emptyForm = { first_name: '', last_name: '', company: '', address1: '', address2: '', city: '', province: '', country: '', zip: '', phone: '', is_default: false }
const form = ref({ ...emptyForm })

async function fetchAddresses() {
  try {
    const res = await api.get('/auth/addresses')
    addresses.value = res.data.addresses || []
  } catch {} finally {
    loading.value = false
  }
}

function openAdd() {
  editingId.value = null
  form.value = { ...emptyForm }
  showForm.value = true
}

function openEdit(addr) {
  editingId.value = addr._id
  form.value = {
    first_name: addr.first_name || '',
    last_name: addr.last_name || '',
    company: addr.company || '',
    address1: addr.address1 || '',
    address2: addr.address2 || '',
    city: addr.city || '',
    province: addr.province || '',
    country: addr.country || '',
    zip: addr.zip || '',
    phone: addr.phone || '',
    is_default: addr.is_default || false,
  }
  showForm.value = true
}

async function saveAddress() {
  if (!form.value.address1 || !form.value.city || !form.value.country) return
  saving.value = true
  try {
    if (editingId.value) {
      const res = await api.put(`/auth/addresses/${editingId.value}`, form.value)
      addresses.value = res.data.addresses || []
    } else {
      const res = await api.post('/auth/addresses', form.value)
      addresses.value = res.data.addresses || []
    }
    showForm.value = false
  } catch {} finally {
    saving.value = false
  }
}

async function deleteAddress(id) {
  if (!confirm('Are you sure you want to delete this address?')) return
  try {
    const res = await api.delete(`/auth/addresses/${id}`)
    addresses.value = res.data.addresses || []
  } catch {}
}

function formatAddr(addr) {
  const parts = [addr.address1, addr.address2, addr.city, addr.province, addr.zip, addr.country].filter(Boolean)
  return parts.join(', ')
}

onMounted(fetchAddresses)
</script>

<template>
  <div>
    <div class="section-header">
      <h2 class="section-title">My Addresses</h2>
      <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Address</button>
    </div>

    <div v-if="showForm" class="address-form">
      <h3 class="form-title">{{ editingId ? 'Edit Address' : 'New Address' }}</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>First Name</label>
          <input v-model="form.first_name" type="text" placeholder="First name" />
        </div>
        <div class="form-group">
          <label>Last Name</label>
          <input v-model="form.last_name" type="text" placeholder="Last name" />
        </div>
        <div class="form-group full">
          <label>Company (optional)</label>
          <input v-model="form.company" type="text" placeholder="Company" />
        </div>
        <div class="form-group full">
          <label>Address *</label>
          <input v-model="form.address1" type="text" placeholder="Street address" />
        </div>
        <div class="form-group full">
          <label>Apartment, suite, etc.</label>
          <input v-model="form.address2" type="text" placeholder="Apt, suite, unit" />
        </div>
        <div class="form-group">
          <label>City *</label>
          <input v-model="form.city" type="text" placeholder="City" />
        </div>
        <div class="form-group">
          <label>State / Province</label>
          <input v-model="form.province" type="text" placeholder="State" />
        </div>
        <div class="form-group">
          <label>ZIP Code</label>
          <input v-model="form.zip" type="text" placeholder="ZIP" />
        </div>
        <div class="form-group">
          <label>Country *</label>
          <input v-model="form.country" type="text" placeholder="Country" />
        </div>
        <div class="form-group full">
          <label>Phone</label>
          <input v-model="form.phone" type="tel" placeholder="Phone number" />
        </div>
        <div class="form-group full checkbox-group">
          <label><input type="checkbox" v-model="form.is_default" /> Set as default address</label>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveAddress">
          {{ saving ? 'Saving...' : 'Save Address' }}
        </button>
        <button class="btn btn-outline btn-sm" @click="showForm = false">Cancel</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Loading...</div>

    <div v-else-if="addresses.length" class="addresses-grid">
      <div v-for="addr in addresses" :key="addr._id" class="address-card">
        <span v-if="addr.is_default" class="default-badge">Default</span>
        <p class="addr-name">{{ [addr.first_name, addr.last_name].filter(Boolean).join(' ') }}</p>
        <p v-if="addr.company">{{ addr.company }}</p>
        <p>{{ formatAddr(addr) }}</p>
        <p v-if="addr.phone">{{ addr.phone }}</p>
        <div class="addr-actions">
          <button class="btn btn-outline btn-sm" @click="openEdit(addr)">Edit</button>
          <button class="btn btn-outline btn-sm btn-danger" @click="deleteAddress(addr._id)">Delete</button>
        </div>
      </div>
    </div>

    <div v-else-if="!showForm" class="empty-state">
      <p>No addresses saved yet.</p>
    </div>
  </div>
</template>

<style scoped>
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.section-title { font-size: var(--font-size-xl); font-weight: 700; }
.form-title { font-size: var(--font-size-base); font-weight: 600; margin-bottom: 16px; }
.address-form { padding: 24px; background: var(--color-bg-light); border-radius: var(--radius-md); margin-bottom: 24px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.form-group.full { grid-column: 1 / -1; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; }
.form-group input[type="text"],
.form-group input[type="tel"] { padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
.checkbox-group label { display: flex; align-items: center; gap: 8px; font-size: var(--font-size-sm); cursor: pointer; }
.form-actions { display: flex; gap: 8px; }
.addresses-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.address-card { padding: 20px; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); font-size: var(--font-size-sm); line-height: 1.8; position: relative; }
.default-badge { position: absolute; top: 12px; right: 12px; background: var(--color-primary-light); color: var(--color-primary); padding: 2px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.addr-name { font-weight: 600; font-size: var(--font-size-base); }
.addr-actions { display: flex; gap: 8px; margin-top: 12px; }
.btn-danger { color: var(--color-danger); border-color: var(--color-danger); }
.btn-danger:hover { background: #fee2e2; }
.loading-state { padding: 40px; text-align: center; color: var(--color-text-light); }
.empty-state { padding: 60px; text-align: center; background: var(--color-bg-light); border-radius: var(--radius-md); color: var(--color-text-light); font-size: var(--font-size-sm); }
</style>
