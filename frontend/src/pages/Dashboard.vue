<template>
  <q-page padding class="q-pa-lg fade-in">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-dark">Overview</div>
        <div class="text-subtitle1 text-grey-6">Welcome back to IAMS Enterprise</div>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- KPI Cards -->
      <div class="col-12 col-md-3">
        <q-card class="clean-card tilt-card" style="transform-style: preserve-3d;">
          <q-card-section class="row items-center justify-between" style="transform: translateZ(30px);">
            <div>
              <div class="text-subtitle2 text-grey-6 text-uppercase tracking-wider text-weight-bold">Total Asset</div>
              <div class="text-h4 text-weight-bold q-mt-sm text-dark data-value">{{ store.totalAssets }}</div>
            </div>
            <q-avatar color="grey-3" text-color="primary" icon="inventory_2" size="56px" class="shadow-1" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="clean-card tilt-card" style="transform-style: preserve-3d;">
          <q-card-section class="row items-center justify-between" style="transform: translateZ(30px);">
            <div>
              <div class="text-subtitle2 text-grey-6 text-uppercase tracking-wider text-weight-bold">Available</div>
              <div class="text-h4 text-weight-bold q-mt-sm text-positive data-value">{{ store.availableAssets }}</div>
            </div>
            <q-avatar color="grey-3" text-color="positive" icon="check_circle" size="56px" class="shadow-1" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="clean-card tilt-card" style="transform-style: preserve-3d;">
          <q-card-section class="row items-center justify-between" style="transform: translateZ(30px);">
            <div>
              <div class="text-subtitle2 text-grey-6 text-uppercase tracking-wider text-weight-bold">Borrowed</div>
              <div class="text-h4 text-weight-bold q-mt-sm text-warning data-value">{{ store.borrowedAssets }}</div>
            </div>
            <q-avatar color="grey-3" text-color="warning" icon="shopping_bag" size="56px" class="shadow-1" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="clean-card tilt-card" style="transform-style: preserve-3d;">
          <q-card-section class="row items-center justify-between" style="transform: translateZ(30px);">
            <div>
              <div class="text-subtitle2 text-grey-6 text-uppercase tracking-wider text-weight-bold">Repair / Damaged</div>
              <div class="text-h4 text-weight-bold q-mt-sm text-negative data-value">{{ store.repairDamagedAssets }}</div>
            </div>
            <q-avatar color="grey-3" text-color="negative" icon="build" size="56px" class="shadow-1" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Analytics Charts -->
    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-12 col-md-6">
        <q-card class="clean-card shadow-sm h-full">
          <q-card-section>
            <div class="text-h6 text-dark text-weight-bold">Assets by Status</div>
          </q-card-section>
          <q-card-section class="flex flex-center">
            <VueApexCharts type="donut" width="100%" height="300" :options="donutOptions" :series="donutSeries" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card class="clean-card shadow-sm h-full">
          <q-card-section>
            <div class="text-h6 text-dark text-weight-bold">Financial Value by Category</div>
          </q-card-section>
          <q-card-section>
            <VueApexCharts type="bar" width="100%" height="300" :options="barOptions" :series="barSeries" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mt-md">
      <div class="col-12 col-md-8">
        <q-card class="clean-card h-full">
          <q-card-section class="row items-center justify-between q-pb-sm q-pt-md">
            <div class="text-h6 text-dark text-weight-bold">Recent Assets</div>
            <q-input outlined dense v-model="search" placeholder="Search assets..." class="search-input bg-white">
              <template v-slot:prepend>
                <q-icon name="search" color="grey-6" />
              </template>
            </q-input>
          </q-card-section>
          <q-table
            flat
            class="bg-transparent"
            :rows="store.assets"
            :columns="columns"
            row-key="id"
            :filter="search"
            :grid="$q.screen.lt.md"
            :rows-per-page-options="[5]"
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <span class="status-badge" :class="'status-' + props.row.status.toLowerCase().replace(' ', '')">
                  {{ props.row.status }}
                </span>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>

      <!-- Low Stock & Quick Actions -->
      <div class="col-12 col-md-4">
        <q-card class="clean-card h-full tilt-card" style="transform-style: preserve-3d;">
          <q-card-section class="q-pb-sm q-pt-md" style="transform: translateZ(20px);">
            <div class="text-h6 text-dark text-weight-bold flex items-center" style="line-height: 1.5; padding-top: 4px;">
              <q-icon name="warning" color="warning" class="q-mr-sm" size="24px" /> Low Stock Alerts
            </div>
          </q-card-section>
          <div style="max-height: 380px; overflow-y: auto;" class="custom-scroll">
            <q-list separator class="q-px-sm">
              <q-item v-for="item in lowStock" :key="item.name" class="q-py-md transition-all">
                <q-item-section>
                  <q-item-label class="text-weight-medium text-dark">{{ item.name }}</q-item-label>
                  <q-item-label caption>{{ item.category }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                <span v-if="item.qty === 0" class="status-badge status-outofstock q-px-sm shadow-1">
                  Out of Stock
                </span>
                <span v-else class="status-badge status-borrowed q-px-sm shadow-1">
                  {{ item.qty }} Left
                </span>
              </q-item-section>
              </q-item>

              <q-item v-if="lowStock.length === 0" class="q-py-xl text-center text-grey-6 flex flex-center">
                <q-item-section>
                  <q-icon name="check_circle_outline" size="40px" class="q-mb-sm text-positive" />
                  All stock levels are optimal.
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAssetStore } from '../stores/assetStore'
import VueApexCharts from 'vue3-apexcharts'
import axios from 'axios'
import type { ApexOptions } from 'apexcharts'
import VanillaTilt from 'vanilla-tilt'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const store = useAssetStore()
const search = ref('')

// Analytics State
const donutOptions = ref<ApexOptions>({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: [],
  colors: ['#8a9a87', '#b16a48', '#d4a5a0', '#c9b89e', '#5d6e5a'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: false }
})
const donutSeries = ref<number[]>([])

const barOptions = ref<ApexOptions>({
  chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
  xaxis: { categories: [] },
  colors: ['#c9b89e'],
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 4, horizontal: false } },
  yaxis: {
    labels: {
      formatter: (value: number) => { return '฿' + value.toLocaleString() }
    }
  }
})
const barSeries = ref<any[]>([{ name: 'Asset Value (฿)', data: [] }])

const fetchAnalytics = async () => {
  try {
    const res = await axios.get(`${API_URL}/analytics`)
    const data = res.data
    
    // Status Donut
    donutOptions.value = { ...donutOptions.value, labels: Object.keys(data.statuses) }
    donutSeries.value = Object.values(data.statuses) as number[]
    
    // Category Value Bar
    const categories = Object.keys(data.categories)
    const values = categories.map(c => data.categories[c].value)
    barOptions.value = { ...barOptions.value, xaxis: { categories } }
    barSeries.value = [{ name: 'Total Value (฿)', data: values }]
  } catch(e) {
    console.error("Analytics fetch error:", e)
  }
}

onMounted(() => {
  store.fetchAssets()
  fetchAnalytics()
  // Initialize 3D Tilt Effect on cards
  setTimeout(() => {
    const tiltElements = document.querySelectorAll(".tilt-card")
    if (tiltElements.length > 0) {
      // @ts-ignore
      VanillaTilt.init(Array.from(tiltElements), {
        max: 8,
        speed: 400,
        glare: true,
        "max-glare": 0.15,
        scale: 1.02
      })
    }
  }, 100)
})


const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'name', label: 'Asset Name', field: 'name', align: 'left', sortable: true },
  { name: 'category', label: 'Category', field: 'category', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true }
] as any

const lowStock = computed(() => {
  const counts: Record<string, { category: string, qty: number }> = {}
  
  // Count only available assets
  store.assets.forEach(a => {
    if (a.status === 'Available') {
      if (!counts[a.name]) counts[a.name] = { category: a.category, qty: 0 }
      counts[a.name].qty++
    }
  })

  // Ensure assets that exist but have 0 available are counted as 0
  store.assets.forEach(a => {
    if (!counts[a.name]) counts[a.name] = { category: a.category, qty: 0 }
  })

  return Object.entries(counts)
    .map(([name, data]) => ({ name, category: data.category, qty: data.qty }))
    .filter(item => item.qty < 5) // Less than 5 is considered low stock
    .sort((a, b) => a.qty - b.qty)
})
</script>
