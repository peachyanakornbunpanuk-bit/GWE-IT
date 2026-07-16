<template>
  <q-page padding class="q-pa-lg fade-in">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-dark">Procurement</div>
        <div class="text-subtitle1 text-grey-6">Purchase and automatically ingest new hardware</div>
      </div>
    </div>

    <!-- Top/Bottom Layout for better balance -->
    <div class="row q-col-gutter-xl">
      
      <!-- Purchase Form -->
      <div class="col-12 col-xl-5 col-lg-6">
        <q-card class="clean-card shadow-sm">
          <q-card-section class="q-pb-none q-pt-lg q-px-lg">
            <div class="text-h6 text-dark text-weight-bold flex items-center">
              <q-icon name="shopping_cart" class="q-mr-sm text-primary" size="28px" /> New Purchase
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">Record a purchase to automatically generate asset tags.</div>
          </q-card-section>
          
          <q-card-section class="q-px-lg">
            <q-form @submit="onPurchase" class="q-gutter-y-md q-mt-sm" ref="purchaseForm">
              
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-8">
                  <q-input 
                    outlined 
                    v-model="form.item_name" 
                    label="Item Name / Model *" 
                    required 
                    :rules="[val => !!val || 'Item name is required']"
                  />
                </div>
                
                <div class="col-12 col-sm-4">
                  <q-input 
                    outlined 
                    v-model.number="form.quantity" 
                    type="number" 
                    label="Quantity *" 
                    min="1"
                    required
                    :rules="[val => (val !== null && val > 0) || 'Must buy at least 1']"
                  />
                </div>

                <div class="col-12 col-sm-6">
                  <q-select 
                    outlined 
                    v-model="form.category" 
                    :options="settingStore.categories" 
                    label="Category *" 
                    required 
                    :rules="[val => !!val || 'Category is required']"
                  />
                </div>

                <div class="col-12 col-sm-6">
                  <q-select 
                    outlined 
                    v-model="form.supplier" 
                    :options="settingStore.suppliers" 
                    label="Supplier / Store *"
                    required
                    :rules="[val => !!val || 'Supplier is required for auditing']"
                  />
                </div>

                <div class="col-12 col-sm-6">
                  <q-select 
                    outlined 
                    v-model="form.location" 
                    :options="settingStore.locations" 
                    label="Default Location (Room/Area) *"
                    required
                    :rules="[val => !!val || 'Location is required']"
                  />
                </div>

                <div class="col-12 col-sm-6">
                  <q-input 
                    outlined 
                    v-model="form.purchase_date" 
                    type="date" 
                    label="Purchase Date *" 
                    required
                    :rules="[val => !!val || 'Purchase date is required']"
                  />
                </div>

                <div class="col-12 col-sm-6">
                  <q-input 
                    outlined 
                    v-model.number="form.cost" 
                    type="number" 
                    label="Unit Cost (฿) *" 
                    required
                    :rules="[val => (val !== null && val !== '') || 'Unit cost is required']"
                  >
                    <template v-slot:prepend>
                      <q-icon name="payments" />
                    </template>
                  </q-input>
                </div>
                
                <!-- Total Cost Preview -->
                <div class="col-12 text-right text-subtitle1 q-mt-sm" v-if="form.cost && form.quantity > 1">
                  Total Bill: <span class="text-weight-bold text-primary">฿{{ (form.cost * form.quantity).toLocaleString() }}</span>
                </div>
              </div>

              <q-btn 
                label="Submit Purchase & Ingest Assets" 
                type="submit" 
                color="primary" 
                unelevated 
                class="full-width q-py-md q-mt-lg" 
                style="border-radius: 8px; font-size: 16px; font-weight: 600;" 
              />
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Purchase History -->
      <div class="col-12 col-xl-7 col-lg-6">
        <q-card class="clean-card shadow-sm h-full">
          <q-card-section class="q-pb-none q-pt-lg q-px-lg">
            <div class="text-h6 text-dark text-weight-bold flex items-center">
              <q-icon name="history" class="q-mr-sm text-grey-6" size="28px" /> Procurement Ledger
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">Historical log of all company hardware purchases. Click a row to see details.</div>
          </q-card-section>
          
          <q-card-section class="q-px-lg">
            <q-table
              flat class="bg-transparent q-mt-sm cursor-pointer"
              :rows="txStore.purchases"
              :columns="columns"
              row-key="id"
              :pagination="{ rowsPerPage: 5 }"
              @row-click="openDetails"
            >
              <template v-slot:body-cell-item_name="props">
                <q-td :props="props" class="text-weight-bold text-primary">
                  {{ props.row.item_name }}
                  <q-chip v-if="props.row.quantity > 1" size="sm" color="orange-1" class="text-weight-bold text-primary q-ml-sm">
                    x{{ props.row.quantity }}
                  </q-chip>
                  <div class="text-caption text-grey-6">{{ props.row.category }}</div>
                </q-td>
              </template>
              
              <template v-slot:body-cell-cost="props">
                <q-td :props="props" class="text-weight-bold" align="right">
                  ฿{{ props.row.cost.toLocaleString() }}
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Purchase Details Dialog -->
    <q-dialog v-model="detailsDialog">
      <q-card style="width: 500px; max-width: 90vw;" class="clean-card">
        <q-card-section class="bg-primary text-white row items-center justify-between">
          <div class="text-h6 text-weight-bold flex items-center">
            <q-icon name="receipt_long" class="q-mr-sm" /> Invoice Details
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        
        <q-card-section class="q-pa-lg" v-if="selectedPurchase">
          <div class="row q-col-gutter-y-md">
            <div class="col-12">
              <div class="text-caption text-grey-6 text-uppercase">Item Name</div>
              <div class="text-h6 text-weight-bold text-dark">{{ selectedPurchase.item_name }}</div>
            </div>
            
            <div class="col-6">
              <div class="text-caption text-grey-6 text-uppercase">Category</div>
              <div class="text-subtitle1 text-weight-bold">{{ selectedPurchase.category }}</div>
            </div>
            
            <div class="col-6">
              <div class="text-caption text-grey-6 text-uppercase">Supplier</div>
              <div class="text-subtitle1 text-weight-bold">{{ selectedPurchase.supplier || 'N/A' }}</div>
            </div>
            
            <div class="col-6">
              <div class="text-caption text-grey-6 text-uppercase">Purchase Date</div>
              <div class="text-subtitle1 text-weight-bold">{{ selectedPurchase.purchase_date }}</div>
            </div>
            
            <div class="col-6">
              <div class="text-caption text-grey-6 text-uppercase">Transaction ID</div>
              <div class="text-subtitle1 text-weight-bold">#{{ selectedPurchase.id }}</div>
            </div>
            
            <div class="col-12 q-my-sm">
              <q-separator />
            </div>
            
            <div class="col-4">
              <div class="text-caption text-grey-6 text-uppercase">Quantity</div>
              <div class="text-h6 text-weight-bold text-primary">{{ selectedPurchase.quantity || 1 }} Units</div>
            </div>
            
            <div class="col-4">
              <div class="text-caption text-grey-6 text-uppercase">Unit Price</div>
              <div class="text-h6 text-weight-bold">฿{{ (selectedPurchase.unit_cost || (selectedPurchase.cost / (selectedPurchase.quantity || 1))).toLocaleString() }}</div>
            </div>
            
            <div class="col-4 text-right">
              <div class="text-caption text-grey-6 text-uppercase">Total Cost</div>
              <div class="text-h6 text-weight-bold text-negative">฿{{ selectedPurchase.cost.toLocaleString() }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTransactionStore } from '../stores/transactionStore'
import { useSettingStore } from '../stores/settingStore'

const $q = useQuasar()
const txStore = useTransactionStore()
const settingStore = useSettingStore()

const purchaseForm = ref(null)

// Dialog refs
const detailsDialog = ref(false)
const selectedPurchase = ref<any>(null)

const getTodayDate = () => new Date().toISOString().split('T')[0]

// Added quantity field and purchase_date
const form = ref({ 
  item_name: '', 
  category: '', 
  supplier: '', 
  cost: null as any, 
  quantity: 1,
  purchase_date: getTodayDate(),
  location: ''
})

onMounted(() => {
  txStore.fetchAllTransactions()
  settingStore.fetchSettings()
})

const columns = [
  { name: 'id', label: 'Tx ID', field: 'id', align: 'left' },
  { name: 'item_name', label: 'Purchase Order', field: 'item_name', align: 'left', sortable: true },
  { name: 'supplier', label: 'Supplier', field: 'supplier', align: 'left', sortable: true },
  { name: 'purchase_date', label: 'Date', field: 'purchase_date', align: 'left', sortable: true },
  { name: 'cost', label: 'Total Cost', field: 'cost', align: 'right', sortable: true }
] as any

const openDetails = (_evt: any, row: any) => {
  selectedPurchase.value = row
  detailsDialog.value = true
}

const onPurchase = async () => {
  try {
    // Pass quantity, date, and location to the store
    await txStore.recordPurchase(form.value.item_name, form.value.category, form.value.supplier, form.value.cost, form.value.quantity, form.value.purchase_date, form.value.location)
    
    $q.notify({ 
      color: 'positive', 
      message: `Purchase recorded! Instantly generated ${form.value.quantity} new asset tags.`, 
      position: 'top-right' 
    })
    
    // Explicitly reset form fields to wipe UI clean
    form.value.item_name = ''
    form.value.category = ''
    form.value.supplier = ''
    form.value.cost = null as any
    form.value.quantity = 1
    form.value.purchase_date = getTodayDate()
    form.value.location = ''
    
    if (purchaseForm.value) {
      // Small timeout to allow Vue reactivity to flush before resetting validation
      setTimeout(() => {
        (purchaseForm.value as any).resetValidation()
      }, 50)
    }
  } catch (err) {
    console.error('Error during purchase:', err)
    $q.notify({ color: 'negative', message: 'Failed to record purchase' })
  }
}
</script>
