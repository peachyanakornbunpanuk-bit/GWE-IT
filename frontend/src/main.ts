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
    dark: true,
    brand: {
      primary: '#00F0FF',   // Neon Cyan
      secondary: '#BF00FF', // Neon Purple
      accent: '#FF003C',    // Neon Pink/Red
      dark: '#0A0A0A',
      'dark-page': '#050505',
      positive: '#00FF66',
      negative: '#FF003C',
      info: '#00F0FF',
      warning: '#FFE600'
    }
  }
})

app.mount('#app')
