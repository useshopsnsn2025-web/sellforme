import { ref } from 'vue'
import api from '@/utils/api'

// Shared contact method
const contactMethod = ref('whatsapp')

export function useContact() {
  const contactId = ref('')
  const contactValue = ref('') // phone for whatsapp, line_url for line
  const contactName = ref('')

  async function fetchContactMethod() {
    try {
      const agentRef = localStorage.getItem('agent_ref') || ''
      const res = await api.get('/contact-method', { params: { agent_code: agentRef } })
      contactMethod.value = res.data.method || 'whatsapp'
    } catch {}
  }

  async function fetchContact() {
    await fetchContactMethod()
    const agentRef = localStorage.getItem('agent_ref') || ''
    try {
      if (contactMethod.value === 'line') {
        const res = await api.get('/line/next', { params: { agent_code: agentRef } })
        contactValue.value = res.data.line_url
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
        window.open(contactValue.value, '_blank')
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
