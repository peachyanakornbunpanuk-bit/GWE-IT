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
    dark: false,
    brand: {
      primary: '#b16a48',   // Terracotta
      secondary: '#8a9a87', // Sage
      accent: '#d4a5a0',    // Dusk Pink
      dark: '#2c2620',      // Ink
      'dark-page': '#4a4036',// Ink soft
      positive: '#5d6e5a',  // Sage Deep
      negative: '#8e4f33',  // Terracotta Deep
      info: '#e3d5c1',      // Sand
      warning: '#c9b89e'    // Sand Deep
    }
  }
})

app.mount('#app')
