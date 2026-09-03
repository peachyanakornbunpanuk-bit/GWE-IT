<template>
  <q-page padding class="q-pa-lg fade-in">
    <!-- Header Banner -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-dark">Executive Dashboard</div>
        <div class="text-subtitle1 text-grey-6">Real-time enterprise hardware and stock intelligence</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn 
          color="primary" 
          icon="qr_code_scanner" 
          label="Smart Scanner" 
          unelevated 
          class="q-px-md shadow-2" 
          style="border-radius: 8px;"
          @click="showScanner = true"
        />
        <q-btn 
          flat 
          round 
          dense 
          icon="refresh" 
          color="grey-7" 
          @click="fetchDashboardData"
        >
          <q-tooltip>Refresh Dashboard</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- 1. Real-Time Status KPI Cards (5 Core States) -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Total -->
      <div class="col-12 col-sm-6 col-md-2">
        <q-card class="clean-card tilt-card h-full" style="border-left: 4px solid var(--q-primary);">
          <q-card-section class="q-pa-md">
            <div class="text-caption text-grey-6 text-uppercase text-weight-bold tracking-wider">Total Items</div>
            <div class="text-h4 text-weight-bold q-mt-xs text-dark">{{ summary.totalAssets }}</div>
            <div class="text-caption text-grey-6 q-mt-xs">฿{{ summary.totalValue.toLocaleString() }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- In Stock -->
      <div class="col-12 col-sm-6 col-md-2">
        <q-card class="clean-card tilt-card h-full" style="border-left: 4px solid #16a34a;">
          <q-card-section class="q-pa-md">
            <div class="text-caption text-green-8 text-uppercase text-weight-bold tracking-wider">In Stock</div>
            <div class="text-h4 text-weight-bold q-mt-xs text-green-7">{{ summary.availableAssets }}</div>
            <div class="text-caption text-grey-6 q-mt-xs">{{ getPercentage(summary.availableAssets) }}% of total</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Borrowed -->
      <div class="col-12 col-sm-6 col-md-2">
        <q-card class="clean-card tilt-card h-full" style="border-left: 4px solid #f59e0b;">
          <q-card-section class="q-pa-md">
            <div class="text-caption text-amber-9 text-uppercase text-weight-bold tracking-wider">Borrowed</div>
            <div class="text-h4 text-weight-bold q-mt-xs text-amber-8">{{ summary.borrowedAssets }}</div>
            <div class="text-caption text-grey-6 q-mt-xs">{{ getPercentage(summary.borrowedAssets) }}% of total</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Damaged / In Repair -->
      <div class="col-12 col-sm-6 col-md-2">
        <q-card class="clean-card tilt-card h-full" style="border-left: 4px solid #ef4444;">
          <q-card-section class="q-pa-md">
            <div class="text-caption text-red-8 text-uppercase text-weight-bold tracking-wider">Damaged</div>
            <div class="text-h4 text-weight-bold q-mt-xs text-red-7">{{ summary.damagedAssets }}</div>
            <div class="text-caption text-grey-6 q-mt-xs">{{ getPercentage(summary.damagedAssets) }}% of total</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Lost -->
      <div class="col-12 col-sm-6 col-md-2">
        <q-card class="clean-card tilt-card h-full" style="border-left: 4px solid #64748b;">
          <q-card-section class="q-pa-md">
            <div class="text-caption text-blue-grey-8 text-uppercase text-weight-bold tracking-wider">Lost</div>
            <div class="text-h4 text-weight-bold q-mt-xs text-blue-grey-7">{{ summary.lostAssets }}</div>
            <div class="text-caption text-grey-6 q-mt-xs">{{ getPercentage(summary.lostAssets) }}% of total</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Active Overdue Counter -->
      <div class="col-12 col-sm-6 col-md-2">
        <q-card class="clean-card tilt-card h-full" style="border-left: 4px solid #dc2626; background: rgba(254, 226, 226, 0.4);">
          <q-card-section class="q-pa-md">
            <div class="text-caption text-red-9 text-uppercase text-weight-bold tracking-wider">Overdue Items</div>
            <div class="text-h4 text-weight-bold q-mt-xs text-red-9">{{ summary.overdueItems.length }}</div>
            <div class="text-caption text-red-8 q-mt-xs">Require urgent return</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 2. CRITICAL ALERTS BARS -->
    <!-- Red Bar: Overdue Items Alert -->
    <q-card v-if="summary.overdueItems.length > 0" class="q-mb-lg bg-red-1 shadow-sm" style="border: 1px solid #fca5a5; border-left: 6px solid #dc2626; border-radius: 8px;">
      <q-card-section class="q-pa-md">
        <div class="row items-center justify-between">
          <div class="row items-center">
            <q-avatar icon="error" color="negative" text-color="white" size="36px" class="q-mr-md shadow-1" />
            <div>
              <div class="text-subtitle1 text-weight-bold text-red-10 flex items-center">
                Critical Alert: {{ summary.overdueItems.length }} Overdue Hardware Asset(s)
              </div>
              <div class="text-caption text-red-9">
                Items borrowed past the scheduled return date without check-in.
              </div>
            </div>
          </div>
          <q-btn 
            color="negative" 
            label="Send Overdue Notifications" 
            icon="send" 
            unelevated 
            dense 
            class="q-px-md q-py-xs" 
            style="border-radius: 6px; font-weight: 600;" 
            :loading="notifyingOverdue"
            @click="triggerOverdueNotification"
          />
        </div>

        <div class="q-mt-sm row q-col-gutter-sm">
          <div v-for="item in summary.overdueItems.slice(0, 4)" :key="item.id" class="col-12 col-md-3 col-sm-6">
            <div class="q-pa-sm bg-white rounded-borders shadow-1 row items-center justify-between" style="border: 1px solid #fecaca;">
              <div>
                <div class="text-weight-bold text-dark text-caption">{{ item.asset_id }} - {{ item.asset_name || 'Equipment' }}</div>
                <div class="text-caption text-grey-7">{{ item.employee_name || item.employee_id }} ({{ item.department || 'N/A' }})</div>
              </div>
              <q-badge color="negative" class="text-weight-bold">
                {{ item.days_overdue }}d late
              </q-badge>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Yellow Bar: Low Stock Levels Alert -->
    <q-card v-if="summary.lowStockItems.length > 0" class="q-mb-lg bg-amber-1 shadow-sm" style="border: 1px solid #fde68a; border-left: 6px solid #d97706; border-radius: 8px;">
      <q-card-section class="q-pa-md">
        <div class="row items-center justify-between">
          <div class="row items-center">
            <q-avatar icon="warning" color="warning" text-color="dark" size="36px" class="q-mr-md shadow-1" />
            <div>
              <div class="text-subtitle1 text-weight-bold text-amber-10 flex items-center">
                Low Stock Alert: {{ summary.lowStockItems.length }} Item Category(ies) Running Low
              </div>
              <div class="text-caption text-amber-9">
                Equipment inventory has fallen below the safety threshold of 5 units.
              </div>
            </div>
          </div>
          <q-btn 
            outline 
            color="amber-10" 
            label="Procure Items" 
            icon="shopping_cart" 
            dense 
            class="q-px-md q-py-xs bg-white" 
            style="border-radius: 6px; font-weight: 600;" 
            to="/purchase"
          />
        </div>

        <div class="q-mt-sm row q-col-gutter-sm">
          <div v-for="item in summary.lowStockItems.slice(0, 4)" :key="item.name" class="col-12 col-md-3 col-sm-6">
            <div class="q-pa-sm bg-white rounded-borders shadow-1 row items-center justify-between" style="border: 1px solid #fef3c7;">
              <div class="ellipsis">
                <div class="text-weight-bold text-dark text-caption">{{ item.name }}</div>
                <div class="text-caption text-grey-6">{{ item.category }}</div>
              </div>
              <span v-if="item.available === 0" class="status-badge status-outofstock q-px-sm">
                Out of Stock
              </span>
              <span v-else class="status-badge status-borrowed q-px-sm">
                {{ item.available }} Left
              </span>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 3. Charts & Analytics Section -->
    <div class="row q-col-gutter-md">
      <!-- Status Donut Chart (5 states) -->
      <div class="col-12 col-lg-5">
        <q-card class="clean-card shadow-sm h-full">
          <q-card-section class="q-pb-none">
            <div class="text-h6 text-dark text-weight-bold flex items-center">
              <q-icon name="pie_chart" color="primary" class="q-mr-sm" size="24px" />
              Real-Time Inventory Status
            </div>
            <div class="text-caption text-grey-6">5-Status asset distribution breakdown</div>
          </q-card-section>
          <q-card-section class="flex flex-center q-pt-sm">
            <VueApexCharts 
              type="donut" 
              width="100%" 
              height="290" 
              :options="donutOptions" 
              :series="donutSeries" 
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- Financial Value by Category Bar Chart -->
      <div class="col-12 col-lg-7">
        <q-card class="clean-card shadow-sm h-full">
          <q-card-section class="q-pb-none">
            <div class="text-h6 text-dark text-weight-bold flex items-center">
              <q-icon name="bar_chart" color="secondary" class="q-mr-sm" size="24px" />
              Capital Asset Value by Category
            </div>
            <div class="text-caption text-grey-6">Monetary value of registered hardware assets</div>
          </q-card-section>
          <q-card-section class="q-pt-sm">
            <VueApexCharts 
              type="bar" 
              width="100%" 
              height="290" 
              :options="barOptions" 
              :series="barSeries" 
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 4. Recent Activities Live Feed & Fast Inventory Table -->
    <div class="row q-col-gutter-md q-mt-md">
      <!-- Live Feed: Recent Activities -->
      <div class="col-12 col-lg-5">
        <q-card class="clean-card shadow-sm h-full">
          <q-card-section class="q-pb-sm">
            <div class="row items-center justify-between">
              <div class="text-h6 text-dark text-weight-bold flex items-center">
                <q-icon name="rss_feed" color="primary" class="q-mr-sm" size="24px" />
                Recent Activities
              </div>
              <q-badge color="positive" class="text-weight-bold pulse">LIVE</q-badge>
            </div>
            <div class="text-caption text-grey-6">Audit log of checkouts, returns, conditions, and scans</div>
          </q-card-section>

          <div style="max-height: 420px; overflow-y: auto;" class="custom-scroll q-px-md">
            <q-list separator>
              <q-item v-for="act in summary.recentActivities" :key="act.id" class="q-py-md">
                <q-item-section avatar>
                  <q-avatar size="36px" :color="getActivityColor(act.action)" text-color="white" class="shadow-1">
                    <q-icon :name="getActivityIcon(act.action)" size="20px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-dark text-caption">
                    {{ act.user }}
                  </q-item-label>
                  <q-item-label class="text-caption text-grey-8" style="word-break: break-word;">
                    {{ act.description }}
                  </q-item-label>
                  <q-item-label caption class="text-grey-5" style="font-size: 11px; margin-top: 2px;">
                    <q-icon name="schedule" size="12px" class="q-mr-xs" />
                    {{ formatTime(act.timestamp) }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="summary.recentActivities.length === 0" class="q-py-xl text-center text-grey-6 flex flex-center">
                <q-item-section>
                  <q-icon name="history" size="40px" class="q-mb-sm opacity-50" />
                  No recent activities recorded yet.
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card>
      </div>

      <!-- Fast Search Asset Catalog -->
      <div class="col-12 col-lg-7">
        <q-card class="clean-card shadow-sm h-full">
          <q-card-section class="row items-center justify-between q-pb-sm q-pt-md">
            <div>
              <div class="text-h6 text-dark text-weight-bold">Asset Inventory</div>
              <div class="text-caption text-grey-6">Browse and filter registered equipment</div>
            </div>
            <q-input outlined dense v-model="search" placeholder="Search ID, name, status..." class="bg-white" style="max-width: 250px;">
              <template v-slot:prepend>
                <q-icon name="search" color="grey-6" />
              </template>
            </q-input>
          </q-card-section>
          
          <q-table
            flat
            class="bg-transparent"
            :rows="assetStore.assets"
            :columns="columns"
            row-key="id"
            :filter="search"
            :grid="$q.screen.lt.md"
            :rows-per-page-options="[6, 12, 24]"
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <span class="status-badge" :class="'status-' + props.row.status.toLowerCase().replace(' ', '')">
                  {{ props.row.status }}
                </span>
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" align="right">
                <q-btn size="sm" flat round color="primary" icon="visibility" :to="`/asset/${props.row.id}/scan`">
                  <q-tooltip>Inspect Asset</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>
    </div>

    <!-- Smart Camera Scanner Suite Modal -->
    <SmartScannerModal 
      v-model="showScanner" 
      mode="continuous" 
      @scan="handleScanResult"
    />

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAssetStore } from '../stores/assetStore'
import VueApexCharts from 'vue3-apexcharts'
import axios from 'axios'
import type { ApexOptions } from 'apexcharts'
import { useQuasar } from 'quasar'
import SmartScannerModal from '../components/SmartScannerModal.vue'
import { useRouter } from 'vue-router'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const $q = useQuasar()
const router = useRouter()
const assetStore = useAssetStore()

const search = ref('')
const showScanner = ref(false)
const notifyingOverdue = ref(false)

const summary = ref({
  totalAssets: 0,
  availableAssets: 0,
  borrowedAssets: 0,
  damagedAssets: 0,
  lostAssets: 0,
  totalValue: 0,
  lowStockItems: [] as any[],
  overdueItems: [] as any[],
  recentActivities: [] as any[]
})

// Real-Time 5-Status Donut Chart
const donutOptions = ref<ApexOptions>({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: ['In Stock (Available)', 'Borrowed', 'Damaged / Repair', 'Lost'],
  colors: ['#16a34a', '#f59e0b', '#ef4444', '#64748b'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true, formatter: (val: any) => `${Number(val).toFixed(0)}%` },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total Fleet',
            formatter: () => `${summary.value.totalAssets}`
          }
        }
      }
    }
  }
})

const donutSeries = ref<number[]>([0, 0, 0, 0])

// Category Value Bar Chart
const barOptions = ref<ApexOptions>({
  chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
  xaxis: { categories: [] },
  colors: ['#4f46e5'],
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
  yaxis: {
    labels: {
      formatter: (value: number) => '฿' + value.toLocaleString()
    }
  }
})

const barSeries = ref<any[]>([{ name: 'Asset Value (฿)', data: [] }])

const getPercentage = (count: number) => {
  if (!summary.value.totalAssets || summary.value.totalAssets === 0) return 0
  return Math.round((count / summary.value.totalAssets) * 100)
}

const fetchDashboardData = async () => {
  try {
    const [sumRes, anaRes] = await Promise.allSettled([
      axios.get(`${API_URL}/dashboard/summary`),
      axios.get(`${API_URL}/analytics`)
    ])

    if (sumRes.status === 'fulfilled') {
      summary.value = sumRes.value.data
      donutSeries.value = [
        summary.value.availableAssets,
        summary.value.borrowedAssets,
        summary.value.damagedAssets,
        summary.value.lostAssets
      ]
    }

    if (anaRes.status === 'fulfilled') {
      const data = anaRes.value.data
      const categories = Object.keys(data.categories || {})
      const values = categories.map(c => data.categories[c].value)
      barOptions.value = { ...barOptions.value, xaxis: { categories } }
      barSeries.value = [{ name: 'Total Value (฿)', data: values }]
    }
  } catch (err) {
    console.error("Dashboard fetch error:", err)
  }
}

const triggerOverdueNotification = async () => {
  notifyingOverdue.value = true
  try {
    const res = await axios.post(`${API_URL}/borrow/notify-overdue`)
    $q.notify({
      type: 'positive',
      message: res.data.message || 'Overdue alerts dispatched!',
      position: 'top'
    })
    await fetchDashboardData()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Failed to dispatch overdue notifications',
      position: 'top'
    })
  } finally {
    notifyingOverdue.value = false
  }
}

const handleScanResult = (code: string) => {
  showScanner.value = false
  router.push(`/asset/${code}/scan`)
}

const getActivityIcon = (action: string) => {
  if (action === 'BORROW') return 'swap_horiz'
  if (action === 'RETURN') return 'keyboard_return'
  if (action === 'SENT_TO_REPAIR') return 'build'
  if (action === 'AUDIT_SCAN' || action === 'AUDIT_OPENED') return 'fact_check'
  if (action === 'MARKED_LOST') return 'help_outline'
  if (action === 'CREATE_ASSET') return 'add_circle'
  return 'history'
}

const getActivityColor = (action: string) => {
  if (action === 'BORROW') return 'warning'
  if (action === 'RETURN') return 'positive'
  if (action === 'SENT_TO_REPAIR' || action === 'MARKED_LOST') return 'negative'
  if (action === 'AUDIT_SCAN' || action === 'AUDIT_OPENED') return 'primary'
  return 'grey-8'
}

const formatTime = (ts: string) => {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'name', label: 'Asset Name', field: 'name', align: 'left', sortable: true },
  { name: 'category', label: 'Category', field: 'category', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'actions', label: 'Action', field: 'actions', align: 'right' }
] as any

onMounted(() => {
  assetStore.fetchAssets()
  fetchDashboardData()
})
</script>

<style scoped>
.tracking-wider {
  letter-spacing: 0.05em;
}
.pulse {
  animation: pulseAnim 1.8s infinite;
}
@keyframes pulseAnim {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.75; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
