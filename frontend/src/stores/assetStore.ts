import { defineStore } from 'pinia'
import axios from 'axios'

export interface Asset {
  id: string
  name: string
  category: string
  status: 'Available' | 'Borrowed' | 'Repair' | 'Damaged'
  holder: string
  value: number
  image_url?: string
  location?: string
}

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`

export const useAssetStore = defineStore('asset', {
  state: () => ({
    assets: [] as Asset[]
  }),
  
  getters: {
    totalAssets: (state) => state.assets.length,
    availableAssets: (state) => state.assets.filter(a => a.status === 'Available').length,
    borrowedAssets: (state) => state.assets.filter(a => a.status === 'Borrowed').length,
    repairDamagedAssets: (state) => state.assets.filter(a => ['Repair', 'Damaged'].includes(a.status)).length,
    totalValue: (state) => state.assets.reduce((sum, a) => sum + (a.value || 0), 0)
  },

  actions: {
    async fetchAssets() {
      try {
        const response = await axios.get(`${API_URL}/assets`)
        this.assets = response.data
      } catch (error) {
        console.error('Error fetching assets:', error)
      }
    },

    async bulkUploadAssets(assets: Asset[]) {
      try {
        await axios.post(`${API_URL}/assets/bulk`, { assets })
        await this.fetchAssets()
      } catch (error) {
        console.error('Error in bulk upload:', error)
        throw error
      }
    },

    async addAsset(asset: Omit<Asset, 'id'>) {
      try {
        await axios.post(`${API_URL}/assets`, asset)
        await this.fetchAssets()
      } catch (error) {
        console.error('Error adding asset:', error)
      }
    },

    async updateAsset(id: string, updatedAsset: Partial<Asset>) {
      try {
        await axios.put(`${API_URL}/assets/${id}`, updatedAsset)
        const index = this.assets.findIndex(a => a.id === id)
        if (index !== -1) {
          this.assets[index] = { ...this.assets[index], ...updatedAsset }
        }
      } catch (error) {
        console.error('Error updating asset:', error)
      }
    },

    async deleteAsset(id: string) {
      try {
        await axios.delete(`${API_URL}/assets/${id}`)
        this.assets = this.assets.filter(a => a.id !== id)
      } catch (error) {
        console.error('Error deleting asset:', error)
      }
    }
  }
})
