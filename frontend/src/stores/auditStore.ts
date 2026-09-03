import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface AuditSession {
  id: number
  title: string
  month: string
  status: 'Active' | 'Closed'
  opened_by: string
  opened_at: string
  closed_by?: string
  closed_at?: string
  total_expected: number
  total_scanned: number
  total_missing: number
  notes?: string
}

export interface AuditSnapshot {
  id: number
  session_id: number
  asset_id: string
  asset_name: string
  category: string
  location: string
  expected_status: string
  is_scanned: number
  scanned_at?: string
  scanned_by?: string
  condition?: string
  notes?: string
}

export interface AuditStats {
  totalExpected: number
  totalScanned: number
  remaining: number
  percentage: number
}

export const useAuditStore = defineStore('audit', {
  state: () => ({
    sessions: [] as AuditSession[],
    currentSession: null as AuditSession | null,
    stats: {
      totalExpected: 0,
      totalScanned: 0,
      remaining: 0,
      percentage: 0
    } as AuditStats,
    zones: {} as Record<string, AuditSnapshot[]>,
    snapshots: [] as AuditSnapshot[],
    discrepancyData: null as any,
    loading: false
  }),

  getters: {
    activeSession: (state) => state.sessions.find(s => s.status === 'Active') || null,
    hasActiveSession: (state) => !!state.sessions.find(s => s.status === 'Active')
  },

  actions: {
    async fetchSessions() {
      try {
        const res = await axios.get(`${API_URL}/audit/sessions`)
        this.sessions = res.data
      } catch (err) {
        console.error('Error fetching audit sessions:', err)
      }
    },

    async openSession(title: string, month: string, notes: string = '') {
      try {
        const res = await axios.post(`${API_URL}/audit/sessions`, { title, month, notes })
        await this.fetchSessions()
        if (res.data.id) {
          await this.fetchSessionDetails(res.data.id)
        }
        return res.data
      } catch (err) {
        console.error('Error opening audit session:', err)
        throw err
      }
    },

    async fetchSessionDetails(id: number) {
      this.loading = true
      try {
        const res = await axios.get(`${API_URL}/audit/sessions/${id}`)
        this.currentSession = res.data.session
        this.stats = res.data.stats
        this.zones = res.data.zones
        this.snapshots = res.data.snapshots
      } catch (err) {
        console.error(`Error fetching audit session #${id}:`, err)
      } finally {
        this.loading = false
      }
    },

    async scanAsset(sessionId: number, assetId: string, condition: string = 'Good', notes: string = '') {
      try {
        const res = await axios.post(`${API_URL}/audit/sessions/${sessionId}/scan`, {
          asset_id: assetId,
          condition,
          notes
        })
        await this.fetchSessionDetails(sessionId)
        return res.data
      } catch (err) {
        console.error('Error recording audit scan:', err)
        throw err
      }
    },

    async closeSession(sessionId: number, notes: string = '') {
      try {
        const res = await axios.post(`${API_URL}/audit/sessions/${sessionId}/close`, { notes })
        await this.fetchSessions()
        await this.fetchSessionDetails(sessionId)
        await this.fetchDiscrepancy(sessionId)
        return res.data
      } catch (err) {
        console.error('Error closing audit session:', err)
        throw err
      }
    },

    async fetchDiscrepancy(sessionId: number) {
      try {
        const res = await axios.get(`${API_URL}/audit/sessions/${sessionId}/discrepancy`)
        this.discrepancyData = res.data
        return res.data
      } catch (err) {
        console.error('Error fetching discrepancy report:', err)
      }
    }
  }
})
