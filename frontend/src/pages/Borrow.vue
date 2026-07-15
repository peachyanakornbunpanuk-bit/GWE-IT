<template>
  <q-page padding class="q-pa-lg fade-in">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-blue-grey-9">Borrow / Return</div>
        <div class="text-subtitle1 text-grey-6">Advanced multi-item checkout system</div>
      </div>
    </div>

    <!-- Top/Bottom Layout for better balance -->
    <div class="row q-col-gutter-xl">
      
      <!-- Checkout Form -->
      <div class="col-12 col-xl-5 col-lg-6">
        <q-card class="clean-card shadow-sm">
          <q-card-section class="q-pb-none q-pt-lg q-px-lg">
            <div class="text-h6 text-blue-grey-9 text-weight-bold flex items-center">
              <q-icon name="shopping_cart_checkout" class="q-mr-sm text-primary" size="28px" /> New Checkout
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">Select an employee and add items to their cart.</div>
          </q-card-section>
          
          <q-card-section class="q-px-lg">
            <q-form @submit="onBorrow" class="q-gutter-y-lg q-mt-sm" ref="checkoutForm">
              
              <!-- Employee & Dates Section -->
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-select outlined v-model="form.employee_id" :options="empOptions" label="Select Employee *" emit-value map-options required />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input outlined v-model="form.borrow_date" type="date" label="Checkout Date *" required />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input outlined v-model="form.expected_return_date" type="date" label="Expected Return Date *" required />
                </div>
                <!-- Reason Field -->
                <div class="col-12">
                  <q-input outlined v-model="form.reason" type="textarea" label="Notes / Reason for Borrowing *" placeholder="e.g. For remote work, for streaming event..." rows="2" required />
                </div>
              </div>

              <q-separator class="q-my-md" />
              
              <!-- Dynamic Cart Items -->
              <div>
                <div class="text-subtitle1 text-weight-bold text-blue-grey-9 q-mb-md flex justify-between items-center">
                  <span>Cart Items ({{ form.items.length }})</span>
                  <q-btn type="button" flat dense icon="add_circle" color="primary" label="Add Item" @click.prevent="addItem" />
                </div>
                
                <div v-for="(item, index) in form.items" :key="index" class="q-mb-md q-pa-md bg-grey-1 rounded-borders" style="border: 1px solid #e2e8f0;">
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-weight-bold text-grey-7">Item #{{ index + 1 }}</div>
                    <q-btn type="button" flat round dense icon="delete" color="negative" size="sm" @click.prevent="removeItem(index)" :disable="form.items.length === 1" />
                  </div>
                  
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                      <q-select 
                        outlined dense 
                        v-model="item.category" 
                        :options="categories" 
                        label="Category" 
                        @update:model-value="item.asset_id = ''" 
                        required 
                        class="bg-white"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-select 
                        outlined dense 
                        v-model="item.asset_id" 
                        :options="getAvailableAssets(item.category)" 
                        label="Select Asset" 
                        emit-value map-options 
                        required 
                        :disable="!item.category"
                        class="bg-white"
                      />
                    </div>
                  </div>
                  
                  <!-- Out of Stock Alert -->
                  <div v-if="item.category && getAvailableAssets(item.category).length === 0" class="q-mt-sm q-pa-sm bg-red-1 text-negative rounded-borders flex items-center">
                    <q-icon name="error_outline" size="20px" class="q-mr-sm" />
                    <strong>Out of Stock:</strong> No items available in this category.
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <q-btn 
                label="Confirm Checkout" 
                type="submit" 
                color="primary" 
                unelevated 
                class="full-width q-py-md q-mt-lg" 
                style="border-radius: 8px; font-size: 16px; font-weight: 600;" 
                :disable="isCartInvalid" 
              />
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Active Checkouts -->
      <div class="col-12 col-xl-7 col-lg-6">
        <q-card class="clean-card shadow-sm h-full">
          <q-card-section class="q-pb-none q-pt-lg q-px-lg">
            <div class="text-h6 text-blue-grey-9 text-weight-bold flex items-center">
              <q-icon name="inventory" class="q-mr-sm text-warning" size="28px" /> Active Borrows (Grouped)
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">Checkouts are grouped by Employee and Date. Click any row to view full details.</div>
          </q-card-section>
          
          <q-card-section class="q-px-lg">
            <q-table
              flat class="bg-transparent q-mt-sm table-clickable"
              :rows="groupedBorrows"
              :columns="columns"
              row-key="group_id"
              :pagination="{ rowsPerPage: 10 }"
              @row-click="(evt, row) => openDetailsDialog(row)"
            >
              <template v-slot:body-cell-employee_name="props">
                <q-td :props="props" class="text-weight-bold text-primary cursor-pointer">
                  {{ getEmployeeInfo(props.row.employee_id).name }}
                </q-td>
              </template>
              
              <template v-slot:body-cell-item_count="props">
                <q-td :props="props">
                  <q-chip size="sm" color="blue-1" text-color="primary" class="text-weight-bold">
                    {{ props.row.items.length }} Item(s)
                  </q-chip>
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props" align="right">
                  <q-btn size="sm" color="primary" unelevated outline label="View Details" @click.stop="openDetailsDialog(props.row)" style="border-radius: 6px; font-weight: 600" />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- View Details Dialog -->
    <q-dialog v-model="detailsDialog">
      <q-card style="width: 500px; max-width: 90vw;" class="clean-card">
        <q-card-section class="bg-grey-1 row items-center">
          <div class="text-h6 text-blue-grey-9 text-weight-bold">Checkout Transaction Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-7" />
        </q-card-section>

        <q-card-section class="q-pt-md" v-if="selectedGroup">
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <div class="text-caption text-grey-6">Employee</div>
              <div class="text-weight-bold">{{ getEmployeeInfo(selectedGroup.employee_id).name }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-6">Department</div>
              <div class="text-weight-bold">{{ getEmployeeInfo(selectedGroup.employee_id).department }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-6">Checkout Date</div>
              <div class="text-weight-bold">{{ selectedGroup.borrow_date }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-6">Due Date</div>
              <div class="text-weight-bold">{{ selectedGroup.expected_return_date }}</div>
            </div>
            <div class="col-12 q-mt-sm">
              <div class="text-caption text-grey-6">Notes / Reason</div>
              <div class="text-weight-medium text-primary bg-blue-50 q-pa-sm rounded-borders">{{ selectedGroup.reason || 'No notes provided.' }}</div>
            </div>
          </div>
          
          <q-separator class="q-my-md" />
          
          <div class="text-subtitle2 text-weight-bold q-mb-sm">Items in this Transaction ({{ selectedGroup.items.length }})</div>
          
          <q-list separator bordered class="rounded-borders">
            <q-item v-for="record in selectedGroup.items" :key="record.id">
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ getAssetInfo(record.asset_id).name }}</q-item-label>
                <q-item-label caption>ID: {{ record.asset_id }} • Category: {{ getAssetInfo(record.asset_id).category }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn size="sm" color="green-7" unelevated outline label="Return Item" @click="onReturnIndividual(record.id, record.asset_id)" style="border-radius: 6px; font-weight: 600" />
              </q-item-section>
            </q-item>
          </q-list>
          
          <div v-if="selectedGroup.items.length === 0" class="text-center text-grey-6 q-pa-md">
            All items in this transaction have been returned.
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTransactionStore } from '../stores/transactionStore'
import { useAssetStore } from '../stores/assetStore'
import { useEmployeeStore } from '../stores/employeeStore'

const $q = useQuasar()
const txStore = useTransactionStore()
const assetStore = useAssetStore()
const empStore = useEmployeeStore()

const now = new Date()
const borrowDateDefault = now.toISOString().split('T')[0]
const nextMonth = new Date(now)
nextMonth.setMonth(nextMonth.getMonth() + 1)
const returnDateDefault = nextMonth.toISOString().split('T')[0]

// Ref for form component
const checkoutForm = ref(null)

const form = ref({ 
  employee_id: '', 
  borrow_date: borrowDateDefault,
  expected_return_date: returnDateDefault,
  reason: '',
  items: [{ category: '', asset_id: '' }] 
})

// Details Dialog state
const detailsDialog = ref(false)
const selectedGroupId = ref<string>('')

onMounted(() => {
  txStore.fetchAllTransactions()
  assetStore.fetchAssets()
  empStore.fetchEmployees()
})

const empOptions = computed(() => empStore.employees.map(e => ({ label: `${e.name} (${e.department})`, value: e.id })))
const categories = computed(() => {
  // Use ALL categories in the system so they can see out-of-stock ones
  const cats = assetStore.assets.map(a => a.category)
  return [...new Set(cats)]
})

const getAvailableAssets = (category: string) => {
  return assetStore.assets
    .filter(a => a.status === 'Available' && a.category === category)
    .map(a => ({ label: `${a.id} - ${a.name}`, value: a.id }))
}

const getAssetInfo = (id: string) => {
  return assetStore.assets.find(a => a.id === id) || { name: 'Unknown', category: 'Unknown' }
}

const getEmployeeInfo = (id: string) => {
  return empStore.employees.find(e => e.id === id) || { name: 'Unknown', department: '' }
}

// Ensure checkout button is disabled if form is incomplete OR any stock is empty
const isCartInvalid = computed(() => {
  if (!form.value.items[0].asset_id) return true;
  
  const selectedIds = new Set();
  for (const item of form.value.items) {
    if (!item.asset_id) return true;
    
    // Block duplicate selections
    if (selectedIds.has(item.asset_id)) return true;
    selectedIds.add(item.asset_id);
    
    if (getAvailableAssets(item.category).length === 0) return true;
  }
  return false;
})

// --- Data Grouping Logic ---
const groupedBorrows = computed(() => {
  const activeBorrows = txStore.borrows.filter(b => b.status === 'Active')
  const groups: Record<string, any> = {}

  activeBorrows.forEach(b => {
    // Group by Employee + Date + Reason
    const groupId = `${b.employee_id}_${b.borrow_date}_${b.reason || 'noreason'}`
    if (!groups[groupId]) {
      groups[groupId] = {
        group_id: groupId,
        employee_id: b.employee_id,
        borrow_date: b.borrow_date,
        expected_return_date: b.expected_return_date,
        reason: b.reason,
        items: []
      }
    }
    groups[groupId].items.push(b)
  })

  return Object.values(groups)
})

// Keep selected group updated automatically when items are returned
const selectedGroup = computed(() => {
  if (!selectedGroupId.value) return null
  return groupedBorrows.value.find(g => g.group_id === selectedGroupId.value)
})

const openDetailsDialog = (groupRow: any) => {
  selectedGroupId.value = groupRow.group_id
  detailsDialog.value = true
}

const addItem = () => {
  form.value.items = [...form.value.items, { category: '', asset_id: '' }]
}

const removeItem = (index: number) => {
  if (form.value.items.length > 1) {
    const newItems = [...form.value.items]
    newItems.splice(index, 1)
    form.value.items = newItems
  }
}

const columns = [
  { name: 'employee_name', label: 'Employee', field: 'employee_id', align: 'left', sortable: true },
  { name: 'borrow_date', label: 'Checkout Date', field: 'borrow_date', align: 'left', sortable: true },
  { name: 'item_count', label: 'Items Borrowed', field: 'item_count', align: 'center' },
  { name: 'actions', label: 'Action', field: 'actions', align: 'right' }
] as any

const onBorrow = async () => {
  const assetIds = form.value.items.map(item => item.asset_id).filter(id => id !== '')
  
  const uniqueIds = new Set(assetIds);
  if (uniqueIds.size !== assetIds.length) {
    $q.notify({ color: 'negative', message: 'Error: Duplicate items detected in cart.', position: 'top' });
    return;
  }
  
  await txStore.borrowAsset(assetIds, form.value.employee_id, form.value.borrow_date, form.value.expected_return_date, form.value.reason)
  $q.notify({ color: 'positive', message: `Checked out ${assetIds.length} item(s) successfully`, position: 'top-right' })
  
  // FIX: Reset form fully
  form.value.employee_id = ''
  form.value.reason = ''
  form.value.items = [{ category: '', asset_id: '' }]
  
  // Reset quasar form validation state
  if (checkoutForm.value) {
    (checkoutForm.value as any).resetValidation()
  }
}

const onReturnIndividual = async (recordId: number, assetId: string) => {
  await txStore.returnAsset(recordId, assetId)
  $q.notify({ color: 'info', message: 'Asset Returned Successfully', position: 'top-right' })
  
  // If the group is completely empty after returning, close the dialog
  if (selectedGroup.value && selectedGroup.value.items.length === 0) {
    detailsDialog.value = false
  }
}
</script>
