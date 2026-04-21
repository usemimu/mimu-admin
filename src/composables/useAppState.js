import { ref, watch, computed } from 'vue'

const theme = ref(localStorage.getItem('mimu-admin-theme') || 'light')
const collapsed = ref(false)
const page = ref(localStorage.getItem('mimu-admin-page') || 'dashboard')
const showCmdk = ref(false)
const toasts = ref([])
const reviewCreative = ref(null)
const payoutDetail = ref(null)
const showTOTP = ref(false)
const authFlow = ref(null)

export function useAppState() {
  // Watch and persist theme
  watch(theme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('mimu-admin-theme', newTheme)
  }, { immediate: true })

  // Watch and persist page
  watch(page, (newPage) => {
    localStorage.setItem('mimu-admin-page', newPage)
  })

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  const toggleSidebar = () => {
    collapsed.value = !collapsed.value
  }

  const toast = (config) => {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, ...config })
    if (config.kind !== 'error') {
      setTimeout(() => {
        dismissToast(id)
      }, 4000)
    }
  }

  const dismissToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const openCmdk = () => {
    showCmdk.value = true
  }

  const closeCmdk = () => {
    showCmdk.value = false
  }

  return {
    theme,
    collapsed,
    page,
    showCmdk,
    toasts,
    reviewCreative,
    payoutDetail,
    showTOTP,
    authFlow,
    toggleTheme,
    toggleSidebar,
    toast,
    dismissToast,
    openCmdk,
    closeCmdk,
  }
}
