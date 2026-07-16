<template>
  <q-page padding class="q-pa-lg fade-in">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-dark">Asset Inventory</div>
        <div class="text-subtitle1 text-grey-6">Manage and track your IT hardware fleet</div>
      </div>
    </div>

    <!-- Summary Dashboard Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="clean-card shadow-sm">
          <q-card-section>
            <div class="text-subtitle2 text-grey-6 text-uppercase">Total Assets</div>
            <div class="text-h4 text-weight-bold text-primary q-mt-sm">{{ store.totalAssets }}</div>
            <q-icon name="devices" size="40px" class="absolute-right q-mr-md q-mt-md text-primary" style="opacity: 0.15" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="clean-card shadow-sm">
          <q-card-section>
            <div class="text-subtitle2 text-grey-6 text-uppercase">Available</div>
            <div class="text-h4 text-weight-bold text-green-7 q-mt-sm">{{ store.availableAssets }}</div>
            <q-icon name="check_circle" size="40px" class="absolute-right q-mr-md q-mt-md text-green-7" style="opacity: 0.15" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="clean-card shadow-sm">
          <q-card-section>
            <div class="text-subtitle2 text-grey-6 text-uppercase">Checked Out</div>
            <div class="text-h4 text-weight-bold text-orange-7 q-mt-sm">{{ store.borrowedAssets }}</div>
            <q-icon name="outbox" size="40px" class="absolute-right q-mr-md q-mt-md text-orange-7" style="opacity: 0.15" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="clean-card shadow-sm">
          <q-card-section>
            <div class="text-subtitle2 text-grey-6 text-uppercase">Repair / Damaged</div>
            <div class="text-h4 text-weight-bold text-red-6 q-mt-sm">{{ store.repairDamagedAssets }}</div>
            <q-icon name="build" size="40px" class="absolute-right q-mr-md q-mt-md text-red-6" style="opacity: 0.15" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Main Table Card -->
    <q-card class="clean-card shadow-sm">
      <q-card-section class="q-pa-md row items-center justify-between">
        <div class="text-h6 text-dark text-weight-bold">Hardware Catalog</div>
        
        <div class="row q-gutter-sm items-center">
          <q-input outlined dense v-model="filter" placeholder="Search assets..." class="bg-white" style="width: 250px">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          
          <q-btn color="secondary" unelevated icon="print" label="Print Visible Labels" @click="openBulkPrint" style="border-radius: 6px;" />
          <q-btn color="primary" unelevated icon="add" label="New Asset" @click="addDialog = true" style="border-radius: 6px;" />
          
          <q-btn color="secondary" unelevated icon="upload_file" label="Upload Excel" @click="triggerFileInput" style="border-radius: 6px;" />
          <input type="file" ref="fileInput" accept=".xlsx, .xls" style="display: none" @change="handleFileUpload" />
          <q-btn color="positive" unelevated icon="download" label="Export Excel" @click="exportExcel" style="border-radius: 6px;" />
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        flat class="bg-transparent"
        :rows="store.assets"
        :columns="columns"
        row-key="id"
        :filter="filter"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <span class="status-badge" :class="'status-' + props.row.status.toLowerCase().replace(' ', '')">
              {{ props.row.status }}
            </span>
          </q-td>
        </template>
        
        <template v-slot:body-cell-value="props">
          <q-td :props="props" class="text-weight-bold">
            ฿{{ props.row.value.toLocaleString() }}
          </q-td>
        </template>

        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <q-item dense class="q-pa-none">
              <q-item-section avatar v-if="props.row.image_url">
                <q-avatar rounded size="42px" color="white" style="border: 1px solid #e2e8f0;">
                  <img :src="`${backendBaseUrl}${props.row.image_url}`" style="object-fit: contain; padding: 2px;" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ props.row.name }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" align="right">
            <q-btn flat round dense color="secondary" icon="qr_code" @click="showQr(props.row)" class="q-mr-xs">
              <q-tooltip>Print QR Label</q-tooltip>
            </q-btn>
            <q-btn flat round dense color="info" icon="history" @click="$router.push(`/asset/${props.row.id}/scan`)" class="q-mr-xs">
              <q-tooltip>View Lifecycle Timeline</q-tooltip>
            </q-btn>
            <q-btn flat round dense color="primary" icon="edit" @click="openEdit(props.row)" />
            <q-btn flat round dense color="negative" icon="delete" @click="confirmDelete(props.row.id)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialogs remain unchanged, but styled cleanly -->
    <q-dialog v-model="addDialog">
      <q-card style="width: 400px; max-width: 90vw;" class="clean-card">
        <q-card-section class="bg-transparent text-dark">
          <div class="text-h6 text-weight-bold">Add New Asset</div>
        </q-card-section>
        <q-card-section class="q-pt-lg">
          <q-form @submit="onAdd" class="q-gutter-md">
            <q-input outlined v-model="form.name" label="Asset Name" required />
            <q-select outlined v-model="form.category" :options="settingStore.categories" label="Category" required />
            <q-select outlined v-model="form.location" :options="settingStore.locations" label="Location (Room/Area)" required />
            <q-select outlined v-model="form.status" :options="['Available', 'Borrowed', 'Repair', 'Damaged']" label="Status" required />
            <q-input outlined v-model.number="form.value" type="number" label="Value (฿)" required />
            <q-file outlined v-model="imageFile" label="Asset Photo (Optional)" accept="image/*" dense clearable>
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
            <div class="row justify-end q-mt-lg">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn unelevated label="Save" type="submit" color="primary" style="border-radius: 6px;" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="editDialog">
      <q-card style="width: 400px; max-width: 90vw;" class="clean-card">
        <q-card-section class="bg-transparent text-dark">
          <div class="text-h6 text-weight-bold">Edit Asset</div>
        </q-card-section>
        <q-card-section class="q-pt-lg">
          <q-form @submit="onEdit" class="q-gutter-md">
            <q-input outlined v-model="form.name" label="Asset Name" required />
            <q-select outlined v-model="form.category" :options="settingStore.categories" label="Category" required />
            <q-select outlined v-model="form.location" :options="settingStore.locations" label="Location (Room/Area)" required />
            <q-select outlined v-model="form.status" :options="['Available', 'Borrowed', 'Repair', 'Damaged']" label="Status" required />
            <q-input outlined v-model.number="form.value" type="number" label="Value (฿)" required />
            <q-file outlined v-model="imageFile" label="Update Photo (Optional)" accept="image/*" dense clearable>
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
            <div class="row justify-end q-mt-lg">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn unelevated label="Update" type="submit" color="primary" style="border-radius: 6px;" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="qrDialog">
      <q-card style="width: 450px; max-width: 95vw; border-radius: 12px" class="clean-card q-pa-md" id="qr-print-area">
        <div class="text-h6 text-weight-bold q-mb-md text-dark text-center hide-on-print">Print Asset Label</div>
        
        <!-- Printable Label -->
        <div class="row items-center bg-white q-pa-sm print-container" style="border: 2px solid #000; border-radius: 8px;">
          <!-- Left: QR Code -->
          <div class="col-auto q-mr-md" style="padding-left: 8px;">
            <qrcode-vue :value="qrInfoValue" :size="100" level="H" />
          </div>
          <!-- Right: Details -->
          <div class="col text-left text-black" style="line-height: 1.4;">
            <div style="font-size: 16px; font-weight: bold;">ID: {{ qrAssetId }}</div>
            <div style="font-size: 14px; font-weight: bold;">Type: {{ qrAssetType }}</div>
            <div style="font-size: 14px; font-weight: bold;">Name: {{ qrAssetName }}</div>
            <div style="font-size: 11px; margin-top: 4px;">Smart Scan Checkout</div>
          </div>
        </div>

        <div class="hide-on-print q-mt-lg">
          <q-btn color="primary" icon="print" label="Print Label" unelevated class="full-width q-mb-sm" @click="printQr" style="border-radius: 8px;" />
          <q-btn flat color="grey-7" label="Close" v-close-popup class="full-width" />
        </div>
      </q-card>
    </q-dialog>

    <q-dialog v-model="bulkPrintDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-white" id="bulk-print-area">
        <div class="row items-center justify-between q-pa-md hide-on-print bg-grey-2 shadow-2" style="position: sticky; top: 0; z-index: 10;">
          <div class="text-h6 text-weight-bold text-dark">Bulk Print Labels ({{ filteredAssets.length }} Items)</div>
          <div>
            <q-btn flat color="grey-7" label="Cancel" v-close-popup class="q-mr-sm" />
            <q-btn color="primary" icon="print" label="Print All" @click="printQr" />
          </div>
        </div>
        
        <div class="print-grid q-pa-lg">
          <div v-for="asset in filteredAssets" :key="asset.id" class="print-label row items-center">
            <!-- Left: QR Code -->
            <div class="col-auto q-mr-md" style="padding-left: 8px;">
              <qrcode-vue :value="`${baseUrl}/asset/${asset.id}/scan`" :size="100" level="H" />
            </div>
            <!-- Right: Details -->
            <div class="col text-left text-black" style="line-height: 1.4;">
              <div style="font-size: 16px; font-weight: bold;">ID: {{ asset.id }}</div>
              <div style="font-size: 14px; font-weight: bold;">Type: {{ asset.category }}</div>
              <div style="font-size: 14px; font-weight: bold;">Name: {{ asset.name }}</div>
              <div style="font-size: 11px; margin-top: 4px;">Smart Scan Checkout</div>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAssetStore } from '../stores/assetStore'
import { useSettingStore } from '../stores/settingStore'
import { useAuthStore } from '../stores/authStore'
import QrcodeVue from 'qrcode.vue'
import axios from 'axios'
import * as XLSX from 'xlsx'

const $q = useQuasar()
const store = useAssetStore()
const settingStore = useSettingStore()
const authStore = useAuthStore()
const API_URL = import.meta.env.VITE_API_URL || '/api'
const backendBaseUrl = API_URL.replace(/\/api$/, '')

const filter = ref('')
const bulkPrintDialog = ref(false)
const addDialog = ref(false)
const editDialog = ref(false)
const qrDialog = ref(false)

const baseUrl = window.location.origin

const filteredAssets = computed(() => {
  if (!filter.value) return store.assets
  const needle = filter.value.toLowerCase()
  return store.assets.filter(v => 
    v.name.toLowerCase().includes(needle) || 
    v.id.toLowerCase().includes(needle) || 
    v.category.toLowerCase().includes(needle) ||
    v.status.toLowerCase().includes(needle)
  )
})

const openBulkPrint = () => {
  if (filteredAssets.value.length === 0) {
    $q.notify({ color: 'warning', message: 'No assets visible to print.', position: 'top' })
    return
  }
  bulkPrintDialog.value = true
}

const qrAssetId = ref('')
const qrAssetType = ref('')
const qrAssetName = ref('')
const qrInfoValue = ref('')

const editingId = ref('')
const form = ref({ name: '', category: '', status: 'Available', value: 0, image_url: '', location: '' })
const imageFile = ref<File | null>(null)

watch(addDialog, (val) => {
  if (!val) {
    form.value = { name: '', category: '', status: 'Available', value: 0, image_url: '', location: '' }
    imageFile.value = null
  }
})

// Hidden file input ref
const fileInput = ref<HTMLInputElement | null>(null)

let pollInterval: any = null

onMounted(async () => {
  store.fetchAssets()
  
  // Real-time polling every 2.5 seconds
  pollInterval = setInterval(() => {
    store.fetchAssets()
  }, 2500)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

const columns = [
  { name: 'id', label: 'Asset ID', field: 'id', align: 'left', sortable: true },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'category', label: 'Category', field: 'category', align: 'left', sortable: true },
  { name: 'location', label: 'Location', field: 'location', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'holder', label: 'Holder', field: 'holder', align: 'left', sortable: true },
  { name: 'value', label: 'Value (฿)', field: 'value', align: 'right', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' }
] as any

const uploadImage = async (file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  const res = await axios.post(`${API_URL}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data.imageUrl
}

const onAdd = async () => {
  try {
    let imageUrl = ''
    if (imageFile.value) {
      imageUrl = await uploadImage(imageFile.value)
    }
    await store.addAsset({ ...form.value, image_url: imageUrl } as any)
    addDialog.value = false
    form.value = { name: '', category: '', status: 'Available', value: 0, image_url: '', location: '' }
    imageFile.value = null
    $q.notify({ color: 'positive', message: 'Asset added', position: 'top-right' })
  } catch (err: any) {
    $q.notify({ color: 'negative', message: 'Error uploading or adding asset', position: 'top' })
  }
}

const openEdit = (row: any) => {
  editingId.value = row.id
  form.value = { ...row }
  imageFile.value = null
  editDialog.value = true
}

const onEdit = async () => {
  try {
    let imageUrl = form.value.image_url || ''
    if (imageFile.value) {
      imageUrl = await uploadImage(imageFile.value)
    }
    await axios.put(`${API_URL}/assets/${editingId.value}`, {
      ...form.value,
      image_url: imageUrl,
      user: authStore.user?.username
    })
    editDialog.value = false
    await store.fetchAssets()
    $q.notify({ color: 'positive', message: 'Asset updated', position: 'top-right' })
  } catch (err: any) {
    $q.notify({ color: 'negative', message: 'Error updating asset', position: 'top' })
  }
}

const confirmDelete = (id: string) => {
  $q.dialog({
    title: 'Confirm',
    message: 'Delete this asset?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await axios.delete(`${API_URL}/assets/${id}?user=${authStore.user?.username}`)
    await store.fetchAssets()
    $q.notify({ color: 'negative', message: 'Asset deleted', position: 'top-right' })
  })
}

const showQr = (asset: any) => {
  qrAssetId.value = asset.id
  qrAssetType.value = asset.category
  qrAssetName.value = asset.name
  qrInfoValue.value = `${baseUrl}/asset/${asset.id}/scan`
  qrDialog.value = true
}

const printQr = () => {
  window.print()
}

// --- Excel Upload Logic ---
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const json = XLSX.utils.sheet_to_json(worksheet)
      
      const mappedAssets = json.map((row: any) => ({
        id: row['Asset ID'] || row['ID'] || '',
        name: row['Name'] || '',
        category: row['Category'] || '',
        status: row['Status'] || 'Available',
        value: Number(row['Value']) || 0,
        holder: row['Holder'] || null
      })).filter(a => a.id && a.name)

      if (mappedAssets.length === 0) {
        $q.notify({ color: 'warning', message: 'No valid assets found in Excel', position: 'top' })
        return
      }

      await store.bulkUploadAssets(mappedAssets as any)
      $q.notify({ color: 'positive', message: `${mappedAssets.length} assets uploaded!`, position: 'top-right' })
      store.fetchAssets()
    } catch (err) {
      console.error(err)
      $q.notify({ color: 'negative', message: 'Error parsing Excel file', position: 'top' })
    } finally {
      if (fileInput.value) fileInput.value.value = ''
    }
  }
  reader.readAsArrayBuffer(file)
}

const exportExcel = () => {
  if (filteredAssets.value.length === 0) {
    $q.notify({ color: 'warning', message: 'No data to export', position: 'top' })
    return
  }

  const exportData = filteredAssets.value.map(a => ({
    'Asset ID': a.id,
    'Name': a.name,
    'Category': a.category,
    'Status': a.status,
    'Holder': a.holder || 'None',
    'Value (THB)': a.value
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets')
  XLSX.writeFile(workbook, 'Asset_Inventory_Report.xlsx')
}
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #qr-print-area, #qr-print-area * {
    visibility: visible;
  }
  #qr-print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: auto !important;
  }
  
  #bulk-print-area, #bulk-print-area * {
    visibility: visible;
  }
  #bulk-print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
  }
  .print-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 15px !important;
    padding: 0 !important;
  }
  .print-label {
    border: 2px solid #000 !important;
    border-radius: 8px !important;
    padding: 8px !important;
    break-inside: avoid !important;
  }

  .hide-on-print {
    display: none !important;
  }
  .print-container {
    border: 2px solid #000 !important;
    box-shadow: none !important;
    display: flex !important;
    align-items: center !important;
  }
}
</style>
