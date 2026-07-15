import { defineStore } from 'pinia'
import axios from 'axios'
import { useAssetStore } from './assetStore'

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    borrows: [] as any[],
    repairs: [] as any[],
    purchases: [] as any[]
  }),

  actions: {
    async fetchAllTransactions() {
      try {
        const [b, r, p] = await Promise.all([
          axios.get(`${API_URL}/borrow`),
          axios.get(`${API_URL}/repair`),
          axios.get(`${API_URL}/purchase`)
        ])
        this.borrows = b.data
        this.repairs = r.data
        this.purchases = p.data
      } catch (e) {
        console.error(e)
      }
    },

    // MODIFIED: Accepts array of asset_ids, dates, and reason
    async borrowAsset(asset_ids: string[], employee_id: string, borrow_date: string, expected_return_date: string, reason: string) {
      await axios.post(`${API_URL}/borrow`, {
        asset_ids, employee_id, borrow_date, expected_return_date, reason
      })
      await this.fetchAllTransactions()
      useAssetStore().fetchAssets()
    },

    async returnAsset(borrow_id: number, asset_id: string) {
      // Use full ISO string with time
      const return_date = new Date().toISOString().slice(0, 16).replace('T', ' ')
      await axios.post(`${API_URL}/return`, {
        borrow_id, asset_id, return_date
      })
      await this.fetchAllTransactions()
      useAssetStore().fetchAssets()
    },

    async sendToRepair(asset_id: string, issue: string, vendor: string, cost: number) {
      await axios.post(`${API_URL}/repair`, {
        asset_id, issue, vendor, cost
      })
      await this.fetchAllTransactions()
      useAssetStore().fetchAssets()
    },

    async finishRepair(repair_id: number, asset_id: string) {
      await axios.post(`${API_URL}/repair/finish`, { repair_id, asset_id })
      await this.fetchAllTransactions()
      useAssetStore().fetchAssets()
    },

    async recordPurchase(item_name: string, category: string, supplier: string, unit_cost: number, quantity: number = 1, purchase_date: string, location: string) {
      await axios.post(`${API_URL}/purchase`, {
        item_name, category, supplier, unit_cost, purchase_date, quantity, location
      })
      await this.fetchAllTransactions()
      useAssetStore().fetchAssets()
    }
  }
})
