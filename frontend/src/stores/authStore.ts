import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const useAuthStore = defineStore('auth', {
  state: () => {
    const authData = JSON.parse(localStorage.getItem('auth') || 'null')
    return {
      user: authData?.user as { id: number, username: string, role: string } | null,
      token: authData?.token as string | null,
      isAuthenticated: !!authData?.token
    }
  },
  
  actions: {
    async login(username: string, password: string): Promise<boolean> {
      try {
        const response = await axios.post(`${API_URL}/login`, { username, password })
        this.user = response.data.user
        this.token = response.data.token
        this.isAuthenticated = true
        localStorage.setItem('auth', JSON.stringify({ user: this.user, token: this.token }))
        return true
      } catch (err) {
        console.error('Login failed', err)
        return false
      }
    },
    
    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('auth')
    }
  }
})
