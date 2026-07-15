import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog, Loading } from 'quasar'
import { router } from './router'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import './style.css'
import App from './App.vue'
import axios from 'axios'

const app = createApp(App)
const pinia = createPinia()

// Global Axios Configuration
axios.defaults.baseURL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`
axios.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('auth') || 'null')
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

app.use(pinia)
app.use(router)

app.use(Quasar, {
  plugins: { Notify, Dialog, Loading },
  config: {
    brand: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      dark: '#111827',
      'dark-page': '#1F2937',
      positive: '#10B981',
      negative: '#EF4444',
      info: '#3B82F6',
      warning: '#F59E0B'
    }
  }
})

app.mount('#app')
