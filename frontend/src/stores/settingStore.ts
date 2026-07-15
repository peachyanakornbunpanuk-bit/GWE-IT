import { defineStore } from 'pinia'
import axios from 'axios'

export interface Setting {
  id: number
  type: string
  value: string
}

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`

export const useSettingStore = defineStore('setting', {
  state: () => ({
    settings: [] as Setting[]
  }),
  
  getters: {
    categories: (state) => state.settings.filter(s => s.type.toLowerCase() === 'category').map(s => s.value),
    suppliers: (state) => state.settings.filter(s => s.type.toLowerCase() === 'supplier').map(s => s.value),
    departments: (state) => state.settings.filter(s => s.type.toLowerCase() === 'department').map(s => s.value),
    locations: (state) => state.settings.filter(s => s.type.toLowerCase() === 'location').map(s => s.value),
    
    // For the Settings page UI which needs the IDs for deletion
    rawCategories: (state) => state.settings.filter(s => s.type.toLowerCase() === 'category'),
    rawSuppliers: (state) => state.settings.filter(s => s.type.toLowerCase() === 'supplier'),
    rawDepartments: (state) => state.settings.filter(s => s.type.toLowerCase() === 'department'),
    rawLocations: (state) => state.settings.filter(s => s.type.toLowerCase() === 'location')
  },

  actions: {
    async fetchSettings() {
      try {
        const response = await axios.get(`${API_URL}/settings`)
        this.settings = response.data
        
        // Auto-seed if empty for the first time
        if (this.settings.length === 0) {
          await this.seedDefaultSettings()
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    },

    async seedDefaultSettings() {
      const defaults = [
        { type: 'category', value: 'Notebook' },
        { type: 'category', value: 'Monitor' },
        { type: 'category', value: 'Mouse' },
        { type: 'category', value: 'Keyboard' },
        { type: 'category', value: 'GPU' },
        { type: 'category', value: 'Network' },
        { type: 'category', value: 'Cable' },
        { type: 'supplier', value: 'Apple Store' },
        { type: 'supplier', value: 'IT City' },
        { type: 'supplier', value: 'JIB Computer' },
        { type: 'supplier', value: 'Banana IT' },
        { type: 'department', value: 'IT' },
        { type: 'department', value: 'HR' },
        { type: 'department', value: 'Accounting' },
        { type: 'department', value: 'Sales' },
        { type: 'location', value: 'IT Server Room' },
        { type: 'location', value: 'Storage Closet 1' },
        { type: 'location', value: 'Studio A' }
      ]
      
      for (const item of defaults) {
        await this.addSetting(item.type, item.value, false)
      }
      
      await this.fetchSettings()
    },

    async addSetting(type: string, value: string, refetch = true) {
      await axios.post(`${API_URL}/settings`, { type, value })
      if (refetch) {
        await this.fetchSettings()
      }
    },
    
    async editSetting(id: number, newValue: string) {
      await axios.put(`${API_URL}/settings/${id}`, { value: newValue })
      await this.fetchSettings()
    },
    
    async deleteSetting(id: number) {
      await axios.delete(`${API_URL}/settings/${id}`)
      await this.fetchSettings()
    }
  }
})
