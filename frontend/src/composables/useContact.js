import { ref } from 'vue'
import api from '@/utils/api'

// Cached contact method - shared across components
const contactMethod = ref('whatsapp')
let methodFetched = false

export function useContact() {
  const contactId = ref('')
  const contactValue = ref('') // phone for whatsapp, line_id for line
  const contactName = ref('')

  async function fetchContactMethod() {
    if (methodFetched) return
    try {
      const res = await api.get('/contact-method')
      contactMethod.value = res.data.method || 'whatsapp'
    } catch {}
    methodFetched = true
  }

  async function fetchContact() {
    await fetchContactMethod()
    const agentRef = localStorage.getItem('agent_ref') || ''
    try {
      if (contactMethod.value === 'line') {
        const res = await api.get('/line/next', { params: { agent_code: agentRef } })
        contactValue.value = res.data.line_id
        contactId.value = res.data.id
        contactName.value = res.data.name
      } else {
        const res = await api.get('/whatsapp/next', { params: { agent_code: agentRef } })
        contactValue.value = res.data.phone
        contactId.value = res.data.id
        contactName.value = res.data.name
      }
    } catch {}
  }

  async function handleContactClick() {
    if (contactId.value) {
      try {
        const endpoint = contactMethod.value === 'line' ? '/line/click' : '/whatsapp/click'
        await api.post(endpoint, { id: contactId.value })
      } catch {}
    }
    if (contactValue.value) {
      if (contactMethod.value === 'line') {
        const lineId = contactValue.value.replace(/^@/, '')
        window.open(`https://line.me/ti/p/~${lineId}`, '_blank')
      } else {
        const phone = contactValue.value.replace(/[^0-9]/g, '')
        window.open(`https://wa.me/${phone}`, '_blank')
      }
    }
    // Fetch next for rotation
    fetchContact()
  }

  return {
    contactMethod,
    contactId,
    contactValue,
    contactName,
    fetchContact,
    handleContactClick,
  }
}
