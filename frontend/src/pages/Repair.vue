<template>
  <q-page padding class="q-pa-lg fade-in">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-blue-grey-9">Repair Hub</div>
        <div class="text-subtitle1 text-grey-6">Track and manage hardware maintenance</div>
      </div>
    </div>

    <!-- Top/Bottom Layout for better balance -->
    <div class="row q-col-gutter-xl">
      
      <!-- Repair Form -->
      <div class="col-12 col-xl-5 col-lg-6">
        <q-card class="clean-card shadow-sm">
          <q-card-section class="q-pb-none q-pt-lg q-px-lg">
            <div class="text-h6 text-blue-grey-9 text-weight-bold flex items-center">
              <q-icon name="build" class="q-mr-sm text-red-6" size="28px" /> Send to Repair
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">Submit an available or damaged asset for maintenance.</div>
          </q-card-section>
          
          <q-card-section class="q-px-lg">
            <q-form @submit="onRepair" class="q-gutter-y-md q-mt-sm" ref="repairForm">
              
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-select 
                    outlined 
                    v-model="form.category" 
                    :options="categories" 
                    label="Filter by Category" 
                    @update:model-value="form.asset_id = ''" 
                    required 
                    :rules="[val => !!val || 'Category is required']"
                  />
                </div>

                <div class="col-12 col-sm-6">
                  <q-select 
                    outlined 
                    v-model="form.asset_id" 
                    :options="assetOptions" 
                    label="Select Asset *" 
                    emit-value map-options 
                    required 
                    :disable="!form.category"
                    :rules="[val => !!val || 'Asset is required']"
                  />
                </div>
                
                <div class="col-12 col-sm-6">
                  <q-select 
                    outlined 
                    v-model="form.vendor" 
                    :options="settingStore.suppliers"
                    label="Vendor / Service Center *" 
                    required
                    :rules="[val => !!val || 'Vendor is strictly required for auditing']"
                  />
                </div>

                <div class="col-12 col-sm-6">
                  <q-input 
                    outlined 
                    v-model="form.repair_date" 
                    type="date" 
                    label="Repair Date *" 
                    required
                    :rules="[val => !!val || 'Repair date is required']"
                  />
                </div>
                
                <div class="col-12 col-sm-6">
                  <q-input 
                    outlined 
                    v-model.number="form.cost" 
                    type="number" 
                    label="Estimated Cost (฿) *" 
                    required
                    :rules="[val => (val !== null && val !== '') || 'Financial cost estimate is required']"
                  >
                    <template v-slot:prepend>
                      <q-icon name="payments" />
                    </template>
                  </q-input>
                </div>

                <div class="col-12">
                  <q-input 
                    outlined 
                    v-model="form.issue" 
                    label="Issue Description / Notes *" 
                    type="textarea"
                    rows="3"
                    required 
                    :rules="[val => !!val || 'Issue description is required']"
                  />
                </div>
              </div>

              <q-btn 
                label="Submit Repair Request" 
                type="submit" 
                color="red-6" 
                unelevated 
                class="full-width q-py-md q-mt-lg" 
                style="border-radius: 8px; font-size: 16px; font-weight: 600;" 
              />
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Active Repairs -->
      <div class="col-12 col-xl-7 col-lg-6">
        <q-card class="clean-card shadow-sm h-full">
          <q-card-section class="q-pb-none q-pt-lg q-px-lg">
            <div class="text-h6 text-blue-grey-9 text-weight-bold flex items-center">
              <q-icon name="handyman" class="q-mr-sm text-info" size="28px" /> In Repair
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">Hardware currently being serviced at vendors.</div>
          </q-card-section>
          
          <q-card-section class="q-px-lg">
            <q-table
              flat class="bg-transparent q-mt-sm"
              :rows="activeRepairs"
              :columns="columns"
              row-key="id"
              :pagination="{ rowsPerPage: 10 }"
            >
              <template v-slot:body-cell-asset_name="props">
                <q-td :props="props" class="text-weight-bold text-primary">
                  {{ getAssetInfo(props.row.asset_id).name }}
                  <div class="text-caption text-grey-6">{{ props.row.asset_id }}</div>
                </q-td>
              </template>
              
              <template v-slot:body-cell-repair_date="props">
                <q-td :props="props">
                  {{ props.row.repair_date || 'N/A' }}
                </q-td>
              </template>

              <template v-slot:body-cell-cost="props">
                <q-td :props="props" class="text-weight-bold">
                  ฿{{ props.row.cost.toLocaleString() }}
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props" align="right">
                  <q-btn size="sm" color="info" unelevated outline label="Mark Fixed" @click="onFinish(props.row)" style="border-radius: 6px; font-weight: 600" />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAssetStore } from '../stores/assetStore'
import { useTransactionStore } from '../stores/transactionStore'
import { useSettingStore } from '../stores/settingStore'

const $q = useQuasar()
const assetStore = useAssetStore()
const txStore = useTransactionStore()
const settingStore = useSettingStore()

const repairForm = ref(null)

// Form state
const today = new Date().toISOString().split('T')[0]
const form = ref({ category: '', asset_id: '', issue: '', vendor: '', repair_date: today, cost: '' as any })

onMounted(() => {
  txStore.fetchAllTransactions()
  assetStore.fetchAssets()
})

const activeRepairs = computed(() => txStore.repairs.filter(r => r.status === 'In Repair'))

// Compute unique categories from all Available/Damaged assets
const categories = computed(() => {
  const cats = assetStore.assets
    .filter(a => a.status === 'Available' || a.status === 'Damaged')
    .map(a => a.category)
  return [...new Set(cats)]
})

// Filter assets by BOTH physical availability AND the selected category
const assetOptions = computed(() => {
  return assetStore.assets
    .filter(a => (a.status === 'Available' || a.status === 'Damaged') && a.category === form.value.category)
    .map(a => ({ label: `${a.id} - ${a.name} (${a.status})`, value: a.id }))
})

const getAssetInfo = (id: string) => {
  return assetStore.assets.find(a => a.id === id) || { name: 'Unknown' }
}

const columns = [
  { name: 'asset_name', label: 'Item in Repair', field: 'asset_id', align: 'left', sortable: true },
  { name: 'issue', label: 'Issue', field: 'issue', align: 'left' },
  { name: 'vendor', label: 'Vendor', field: 'vendor', align: 'left', sortable: true },
  { name: 'repair_date', label: 'Sent Date', field: 'repair_date', align: 'left', sortable: true },
  { name: 'cost', label: 'Cost Est.', field: 'cost', align: 'left', sortable: true },
  { name: 'actions', label: 'Action', field: 'actions', align: 'right' }
] as any

const onRepair = async () => {
  await txStore.sendToRepair(form.value.asset_id, form.value.issue, form.value.vendor, form.value.cost || 0, form.value.repair_date)
  $q.notify({ color: 'positive', message: 'Asset sent to repair!', position: 'top' })
  
  form.value = { category: '', asset_id: '', issue: '', vendor: '', repair_date: today, cost: '' }
  
  if (repairForm.value) {
    (repairForm.value as any).resetValidation()
  }
}

const onFinish = async (row: any) => {
  await txStore.finishRepair(row.id, row.asset_id)
  $q.notify({ color: 'positive', message: 'Asset Fixed & Returned to Inventory', position: 'top-right' })
}
</script>
