<template>
  <q-page padding class="q-pa-lg fade-in">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-dark">Enterprise Audit Trail</div>
        <div class="text-subtitle1 text-grey-6">Immutable forensic log of all system actions, condition edits, scans, and user operations</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn color="positive" icon="table_view" label="Export Logs (Excel)" unelevated @click="exportLogsExcel" style="border-radius: 8px;" />
        <q-btn flat round dense icon="refresh" color="grey-7" @click="fetchLogs" />
      </div>
    </div>

    <!-- Filters Card -->
    <q-card class="clean-card shadow-sm q-mb-lg q-pa-md">
      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-md-4">
          <q-input outlined dense v-model="searchQuery" placeholder="Search asset ID, user, or description..." clearable @keyup.enter="fetchLogs">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-select 
            outlined dense 
            v-model="selectedAction" 
            :options="actionOptions" 
            label="Filter by Action Type" 
            clearable 
            emit-value 
            map-options 
            @update:model-value="fetchLogs"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-input outlined dense v-model="filterUser" placeholder="Filter by User..." clearable @keyup.enter="fetchLogs">
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-2">
          <q-btn color="primary" label="Filter" unelevated class="full-width" @click="fetchLogs" style="border-radius: 6px;" />
        </div>
      </div>
    </q-card>

    <!-- Audit Logs Table -->
    <q-card class="clean-card shadow-sm">
      <q-table
        flat
        class="bg-transparent"
        :rows="logs"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="{ rowsPerPage: 15 }"
      >
        <template v-slot:body-cell-timestamp="props">
          <q-td :props="props" class="text-caption text-grey-8">
            {{ formatTimestamp(props.row.timestamp) }}
          </q-td>
        </template>

        <template v-slot:body-cell-user="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar size="24px" color="primary" text-color="white" class="q-mr-xs text-weight-bold" style="font-size: 11px;">
                {{ props.row.user?.charAt(0).toUpperCase() || 'U' }}
              </q-avatar>
              <span class="text-weight-bold text-dark">{{ props.row.user }}</span>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props" align="center">
            <q-badge :color="getActionBadgeColor(props.row.action)" class="text-weight-bold q-px-sm">
              {{ props.row.action }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-asset_id="props">
          <q-td :props="props">
            <router-link v-if="props.row.asset_id && props.row.asset_id !== 'SYSTEM'" :to="`/asset/${props.row.asset_id}/scan`" class="text-primary text-weight-bold" style="text-decoration: none;">
              {{ props.row.asset_id }}
            </router-link>
            <span v-else class="text-grey-6">{{ props.row.asset_id }}</span>
          </q-td>
        </template>

        <template v-slot:body-cell-description="props">
          <q-td :props="props" style="white-space: normal; word-break: break-word;">
            {{ props.row.description }}
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const logs = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedAction = ref('')
const filterUser = ref('')

const actionOptions = [
  { label: 'All Actions', value: '' },
  { label: 'BORROW (Checkout)', value: 'BORROW' },
  { label: 'RETURN (Check-in)', value: 'RETURN' },
  { label: 'UPDATE_ASSET (Condition/Status)', value: 'UPDATE_ASSET' },
  { label: 'CREATE_ASSET', value: 'CREATE_ASSET' },
  { label: 'DELETE_ASSET', value: 'DELETE_ASSET' },
  { label: 'SENT_TO_REPAIR', value: 'SENT_TO_REPAIR' },
  { label: 'AUDIT_SCAN', value: 'AUDIT_SCAN' },
  { label: 'AUDIT_CLOSED', value: 'AUDIT_CLOSED' },
  { label: 'MARKED_LOST', value: 'MARKED_LOST' },
  { label: 'BACKUP_CREATED', value: 'BACKUP_CREATED' },
  { label: 'USER_CREATED', value: 'USER_CREATED' },
  { label: 'USER_ROLE_UPDATED', value: 'USER_ROLE_UPDATED' }
]

const fetchLogs = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchQuery.value) params.search = searchQuery.value
    if (selectedAction.value) params.action = selectedAction.value
    if (filterUser.value) params.user = filterUser.value
    params.limit = 200

    const res = await axios.get(`${API_URL}/audit-trail`, { params })
    logs.value = res.data
  } catch (err) {
    console.error('Failed to fetch audit logs:', err)
  } finally {
    loading.value = false
  }
}

const formatTimestamp = (ts: string) => {
  if (!ts) return '-'
  const d = new Date(ts)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const getActionBadgeColor = (action: string) => {
  switch (action) {
    case 'BORROW': return 'warning'
    case 'RETURN': return 'positive'
    case 'SENT_TO_REPAIR': return 'negative'
    case 'MARKED_LOST': return 'negative'
    case 'DELETE_ASSET': return 'red-10'
    case 'AUDIT_SCAN': return 'primary'
    case 'AUDIT_CLOSED': return 'deep-orange'
    case 'BACKUP_CREATED': return 'teal'
    default: return 'grey-8'
  }
}

const exportLogsExcel = () => {
  const data = logs.value.map(l => ({
    'ID': l.id,
    'Timestamp': l.timestamp,
    'User': l.user,
    'Action': l.action,
    'Asset ID': l.asset_id,
    'Description': l.description
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Audit_Trail")
  XLSX.writeFile(wb, `IAMS_Audit_Trail_${new Date().toISOString().slice(0,10)}.xlsx`)
}

const columns = [
  { name: 'timestamp', label: 'Timestamp', field: 'timestamp', align: 'left', sortable: true },
  { name: 'user', label: 'Actor / User', field: 'user', align: 'left', sortable: true },
  { name: 'action', label: 'Action Type', field: 'action', align: 'center', sortable: true },
  { name: 'asset_id', label: 'Asset Reference', field: 'asset_id', align: 'left', sortable: true },
  { name: 'description', label: 'Audit Log Details', field: 'description', align: 'left' }
] as any

onMounted(() => {
  fetchLogs()
})
</script>
