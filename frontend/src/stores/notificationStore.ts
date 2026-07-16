import { defineStore } from 'pinia'
import axios from 'axios'

export interface Notification {
  id: number
  user: string
  title: string
  message: string
  link: string
  is_read: number
  timestamp: string
  icon: string
  color: string
}

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notification[],
    pollingInterval: null as any
  }),
  
  getters: {
    unreadCount: (state) => state.notifications.filter(n => n.is_read === 0).length,
    unreadNotifications: (state) => state.notifications.filter(n => n.is_read === 0)
  },

  actions: {
    async fetchNotifications(username: string, role: string) {
      try {
        const response = await axios.get(`${API_URL}/notifications`, {
          params: { user: username, role: role }
        })
        this.notifications = response.data
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    },

    async markAsRead(id: number) {
      try {
        await axios.put(`${API_URL}/notifications/${id}/read`)
        const notif = this.notifications.find(n => n.id === id)
        if (notif) notif.is_read = 1
      } catch (error) {
        console.error('Error marking as read:', error)
      }
    },

    async markAllAsRead(username: string, role: string) {
      try {
        await axios.put(`${API_URL}/notifications/read-all`, { user: username, role: role })
        this.notifications.forEach(n => n.is_read = 1)
      } catch (error) {
        console.error('Error marking all as read:', error)
      }
    },

    startPolling(username: string, role: string) {
      this.fetchNotifications(username, role)
      if (this.pollingInterval) clearInterval(this.pollingInterval)
      this.pollingInterval = setInterval(() => {
        this.fetchNotifications(username, role)
      }, 5000)
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
      }
    }
  }
})
