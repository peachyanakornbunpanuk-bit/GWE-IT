<template>
  <q-page padding class="q-pa-lg fade-in">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-dark">Paperless Borrow & Return</div>
        <div class="text-subtitle1 text-grey-6">Digital signature checkout and photo-inspected returns</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn 
          color="primary" 
          icon="qr_code_scanner" 
          label="Quick Scanner" 
          unelevated 
          class="q-px-md" 
          style="border-radius: 8px;"
          @click="openScannerForCart"
        />
        <q-btn 
          outline 
          color="negative" 
          icon="notification_important" 
          label="Notify Overdue" 
          unelevated 
          class="q-px-md bg-white" 
          style="border-radius: 8px;"
          :loading="notifyingOverdue"
          @click="sendOverdueNotifications"
        />
      </div>
    </div>

    <!-- Active Overdue Reminder Banner -->
    <q-banner v-if="overdueItems.length > 0" rounded class="bg-red-1 text-red-10 q-mb-lg shadow-1" style="border: 1px solid #fca5a5;">
      <template v-slot:avatar>
        <q-icon name="warning" color="negative" size="32px" />
      </template>
      <div class="text-subtitle2 text-weight-bold">
        There are currently {{ overdueItems.length }} overdue item(s) checked out!
      </div>
      <div class="text-caption">
        Automatic reminders can be dispatched immediately to borrowers and administrative staff.
      </div>
      <template v-slot:action>
        <q-btn flat color="negative" label="Dispatch Reminders Now" :loading="notifyingOverdue" @click="sendOverdueNotifications" />
      </template>
    </q-banner>

    <!-- Main Grid -->
    <div class="row q-col-gutter-xl">
      
      <!-- Checkout Form (Paperless Process with Digital Signature) -->
      <div class="col-12 col-xl-5 col-lg-6">
        <q-card class="clean-card shadow-sm">
          <q-card-section class="q-pb-none q-pt-lg q-px-lg">
            <div class="text-h6 text-dark text-weight-bold flex items-center">
              <q-icon name="drive_file_rename_outline" class="q-mr-sm text-primary" size="28px" /> 
              Digital Checkout (5-Step Paperless)
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
              Scan product $\rightarrow$ employee $\rightarrow$ select room $\rightarrow$ sign on iPad $\rightarrow$ approve.
            </div>
          </q-card-section>
          
          <q-card-section class="q-px-lg">
            <q-form @submit="onBorrow" class="q-gutter-y-md q-mt-sm" ref="checkoutForm">
              
              <!-- 1. Employee Assignment & Scan -->
              <div>
                <div class="text-subtitle2 text-grey-8 q-mb-xs flex items-center justify-between">
                  <span>Borrower / Employee *</span>
                  <q-btn flat dense size="sm" color="primary" icon="qr_code_scanner" label="Scan Employee QR" @click="openScannerForEmployee" />
                </div>
                <q-select 
                  outlined 
                  v-model="form.employee_id" 
                  :options="empOptions" 
                  label="Select or search employee" 
                  emit-value 
                  map-options 
                  use-input 
                  @filter="filterEmployees" 
                  required 
                />
              </div>

              <!-- Dates & Location -->
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input outlined v-model="form.borrow_date" type="date" label="Checkout Date *" required dense />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input outlined v-model="form.expected_return_date" type="date" label="Due Date *" required dense />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select outlined dense v-model="selectedBuilding" :options="settingStore.buildings" label="Destination Building" clearable />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select outlined dense v-model="selectedRoom" :options="availableRooms" label="Room Code" :disable="!selectedBuilding" clearable />
                </div>
              </div>

              <q-separator class="q-my-sm" />
              
              <!-- 2. Equipment Items in Cart -->
              <div>
                <div class="text-subtitle2 text-weight-bold text-dark q-mb-xs flex justify-between items-center">
                  <span>Cart Items ({{ form.items.length }})</span>
                  <div class="row q-gutter-xs">
                    <q-btn flat dense size="sm" icon="qr_code_scanner" color="primary" label="Scan Serial" @click="openScannerForCart" />
                    <q-btn flat dense size="sm" icon="add_circle" color="secondary" label="Add Row" @click="addItem" />
                  </div>
                </div>
                
                <div v-for="(item, index) in form.items" :key="index" class="q-mb-sm q-pa-sm bg-grey-1 rounded-borders" style="border: 1px solid #e2e8f0;">
                  <div class="row items-center justify-between q-mb-xs">
                    <div class="text-caption text-weight-bold text-grey-7">Item #{{ index + 1 }}</div>
                    <q-btn flat round dense icon="delete" color="negative" size="xs" @click="removeItem(index)" :disable="form.items.length === 1" />
                  </div>
                  
                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-5">
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
                    <div class="col-12 col-sm-7">
                      <q-select 
                        outlined dense 
                        v-model="item.asset_id" 
                        :options="getAvailableAssets(item.category, index)" 
                        label="Asset ID - Name" 
                        emit-value map-options 
                        required 
                        :disable="!item.category"
                        class="bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Reason / Purpose -->
              <q-input outlined v-model="form.reason" type="textarea" label="Purpose / Project Notes *" placeholder="e.g. Remote setup, studio filming, network maintenance..." rows="2" required dense />

              <q-separator class="q-my-sm" />

              <!-- 3. DIGITAL SIGNATURE PAD -->
              <DigitalSignaturePad ref="sigPadRef" @update:signature="(data) => signatureData = data" />

              <!-- Submit Button -->
              <q-btn 
                label="Approve Digital Checkout" 
                type="submit" 
                color="primary" 
                icon="check_circle"
                unelevated 
                class="full-width q-py-md q-mt-md" 
                style="border-radius: 8px; font-size: 16px; font-weight: 600;" 
                :disable="isCartInvalid || !signatureData"
                :loading="submitting"
              />
              <div v-if="!signatureData" class="text-caption text-center text-negative">
                * Borrower digital signature on screen is required for checkout
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Active Checkouts Table & Return Actions -->
      <div class="col-12 col-xl-7 col-lg-6">
        <q-card class="clean-card shadow-sm h-full">
          <q-card-section class="q-pb-none q-pt-lg q-px-lg">
            <div class="text-h6 text-dark text-weight-bold flex items-center">
              <q-icon name="inventory_2" class="q-mr-sm text-warning" size="28px" /> 
              Active Checkouts & Returns
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
              Check in equipment with condition inspection and photo evidence of damage.
            </div>
          </q-card-section>
          
          <q-card-section class="q-px-lg">
            <q-table
              flat class="bg-transparent q-mt-sm"
              :rows="groupedBorrows"
              :columns="columns"
              row-key="group_id"
              :grid="$q.screen.lt.md"
              :pagination="{ rowsPerPage: 8 }"
            >
              <template v-slot:body-cell-employee_name="props">
                <q-td :props="props" class="text-weight-bold text-primary">
                  {{ getEmployeeInfo(props.row.employee_id).name }}
                </q-td>
              </template>
              
              <template v-slot:body-cell-item_count="props">
                <q-td :props="props" align="center">
                  <q-badge color="primary" class="q-px-sm">
                    {{ props.row.items.length }} Item(s)
                  </q-badge>
                </q-td>
              </template>

              <template v-slot:body-cell-due_status="props">
                <q-td :props="props" align="center">
                  <q-badge v-if="isOverdue(props.row.expected_return_date)" color="negative" class="text-weight-bold">
                    Overdue ({{ props.row.expected_return_date }})
                  </q-badge>
                  <span v-else class="text-caption text-grey-7">
                    Due: {{ props.row.expected_return_date }}
                  </span>
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props" align="right">
                  <q-btn size="sm" color="primary" unelevated outline label="Manage / Return" @click="openDetailsDialog(props.row)" style="border-radius: 6px; font-weight: 600" />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Return Equipment with Condition Photo Dialog -->
    <q-dialog v-model="returnDialog" persistent>
      <q-card style="width: 500px; max-width: 95vw;" class="clean-card q-pa-md">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-h6 text-dark text-weight-bold flex items-center">
            <q-icon name="assignment_return" class="q-mr-sm text-primary" size="24px" />
            Check-In Equipment Inspection
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md" v-if="selectedReturnRecord">
          <div class="q-pa-sm bg-grey-1 rounded-borders q-mb-md" style="border: 1px solid #e2e8f0;">
            <div class="text-weight-bold text-dark">{{ getAssetInfo(selectedReturnRecord.asset_id).name }}</div>
            <div class="text-caption text-grey-7">ID: {{ selectedReturnRecord.asset_id }} • Borrower: {{ getEmployeeInfo(selectedReturnRecord.employee_id).name }}</div>
          </div>

          <!-- Condition Selector -->
          <div class="text-subtitle2 text-grey-8 q-mb-xs">Returned Condition *</div>
          <q-select 
            outlined 
            dense 
            v-model="returnCondition" 
            :options="['Good', 'Damaged', 'Lost']" 
            class="bg-white q-mb-md"
          >
            <template v-slot:prepend>
              <q-icon :name="returnCondition === 'Good' ? 'check_circle' : 'warning'" :color="returnCondition === 'Good' ? 'positive' : 'negative'" />
            </template>
          </q-select>

          <!-- Return Location -->
          <div class="text-subtitle2 text-grey-8 q-mb-xs">Return Shelf / Location</div>
          <q-input outlined dense v-model="returnLocation" placeholder="e.g. Zone A > Shelf 3" class="bg-white q-mb-md" />

          <!-- Condition Photo Upload (Evidence of Cracks / Breaks) -->
          <div class="text-subtitle2 text-grey-8 q-mb-xs flex items-center justify-between">
            <span>Product Condition Photo (Evidence)</span>
            <span class="text-caption text-grey-5" v-if="returnCondition === 'Damaged'">* Highly Recommended</span>
          </div>
          
          <q-file 
            outlined 
            dense 
            v-model="returnPhotoFile" 
            label="Take or Upload Photo" 
            accept="image/*" 
            capture="environment"
            clearable
            class="bg-white q-mb-md"
          >
            <template v-slot:prepend>
              <q-icon name="photo_camera" color="primary" />
            </template>
          </q-file>

          <div v-if="returnCondition === 'Damaged'" class="q-pa-sm bg-red-1 text-red-9 rounded-borders text-caption flex items-center q-mb-md">
            <q-icon name="report_problem" size="20px" class="q-mr-xs" />
            Flagging as Damaged will immediately log this incident and alert IT hardware support.
          </div>

          <div class="row justify-end q-gutter-sm q-mt-lg">
            <q-btn flat label="Cancel" color="grey-7" v-close-popup />
            <q-btn 
              color="primary" 
              label="Confirm Return & Inspection" 
              icon="check" 
              unelevated 
              :loading="submittingReturn"
              @click="submitReturnInspection" 
              style="border-radius: 6px; font-weight: 600;"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Transaction Details Dialog with Digital Signature Preview -->
    <q-dialog v-model="detailsDialog">
      <q-card style="width: 550px; max-width: 95vw;" class="clean-card">
        <q-card-section class="bg-transparent row items-center">
          <div class="text-h6 text-dark text-weight-bold">Transaction Record & Digital Signature</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-7" />
        </q-card-section>

        <q-card-section class="q-pt-none" v-if="selectedGroup">
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <div class="text-caption text-grey-6">Borrower</div>
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
            <div class="col-12">
              <div class="text-caption text-grey-6">Purpose / Notes</div>
              <div class="text-caption text-grey-9 q-pa-sm bg-grey-1 rounded-borders">{{ selectedGroup.reason || 'N/A' }}</div>
            </div>
          </div>

          <!-- Digital Signature Thumbnail -->
          <div v-if="selectedGroup.items[0]?.signature_data" class="q-mb-md">
            <div class="text-caption text-grey-6 q-mb-xs">Authorized Digital Signature:</div>
            <div class="bg-white q-pa-sm rounded-borders text-center shadow-1" style="border: 1px solid #cbd5e1; max-width: 280px; margin: 0 auto;">
              <img :src="selectedGroup.items[0].signature_data" style="max-height: 80px; max-width: 100%; object-fit: contain;" />
            </div>
          </div>
          
          <q-separator class="q-my-md" />
          
          <div class="text-subtitle2 text-weight-bold q-mb-sm">Items in this Checkout ({{ selectedGroup.items.length }})</div>
          
          <q-list separator bordered class="rounded-borders">
            <q-item v-for="record in selectedGroup.items" :key="record.id">
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ getAssetInfo(record.asset_id).name }}</q-item-label>
                <q-item-label caption>ID: {{ record.asset_id }} • Category: {{ getAssetInfo(record.asset_id).category }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn size="sm" color="green-7" unelevated outline label="Check-In / Return" @click="openReturnDialog(record)" style="border-radius: 6px; font-weight: 600" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Smart Camera Scanner Suite Modal -->
    <SmartScannerModal 
      v-model="showScanner" 
      mode="single" 
      @scan="handleScanResult"
    />

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTransactionStore } from '../stores/transactionStore'
import { useAssetStore } from '../stores/assetStore'
import { useEmployeeStore } from '../stores/employeeStore'
import { useSettingStore } from '../stores/settingStore'
import DigitalSignaturePad from '../components/DigitalSignaturePad.vue'
import SmartScannerModal from '../components/SmartScannerModal.vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const $q = useQuasar()
const txStore = useTransactionStore()
const assetStore = useAssetStore()
const empStore = useEmployeeStore()
const settingStore = useSettingStore()

const now = new Date()
const borrowDateDefault = now.toISOString().split('T')[0]
const nextMonth = new Date(now)
nextMonth.setMonth(nextMonth.getMonth() + 1)
const returnDateDefault = nextMonth.toISOString().split('T')[0]

const checkoutForm = ref(null)
const sigPadRef = ref<any>(null)
const signatureData = ref<string | null>(null)
const showScanner = ref(false)
const scannerTarget = ref<'cart' | 'employee'>('cart')
const notifyingOverdue = ref(false)
const submitting = ref(false)

const form = ref({ 
  employee_id: '', 
  borrow_date: borrowDateDefault,
  expected_return_date: returnDateDefault,
  reason: '',
  items: [{ category: '', asset_id: '' }] 
})

const selectedBuilding = ref('')
const selectedRoom = ref('')
const availableRooms = computed(() => selectedBuilding.value ? settingStore.locationsByBuilding[selectedBuilding.value] || [] : [])

// Return modal state
const returnDialog = ref(false)
const selectedReturnRecord = ref<any>(null)
const returnCondition = ref<'Good' | 'Damaged' | 'Lost'>('Good')
const returnLocation = ref('')
const returnPhotoFile = ref<File | null>(null)
const submittingReturn = ref(false)

// Details modal state
const detailsDialog = ref(false)
const selectedGroupId = ref<string>('')

onMounted(() => {
  txStore.fetchAllTransactions()
  assetStore.fetchAssets()
  empStore.fetchEmployees()
  settingStore.fetchSettings()
})

const empOptions = ref(empStore.employees.map(e => ({ label: `${e.name} (${e.department})`, value: e.id })))
const filterEmployees = (val: string, update: Function) => {
  update(() => {
    const needle = val.toLowerCase()
    empOptions.value = empStore.employees
      .filter(e => e.name.toLowerCase().includes(needle) || e.id.toLowerCase().includes(needle) || e.department.toLowerCase().includes(needle))
      .map(e => ({ label: `${e.name} (${e.department})`, value: e.id }))
  })
}

const categories = computed(() => {
  const cats = assetStore.assets.map(a => a.category)
  return [...new Set(cats)]
})

const getAvailableAssets = (category: string, currentIndex: number) => {
  const selectedIds = form.value.items
    .map((item, idx) => idx !== currentIndex ? item.asset_id : null)
    .filter(id => id)

  return assetStore.assets
    .filter(a => a.status === 'Available' && a.category === category && !selectedIds.includes(a.id))
    .map(a => ({ label: `${a.id} - ${a.name}`, value: a.id }))
}

const getAssetInfo = (id: string) => {
  return assetStore.assets.find(a => a.id === id) || { name: 'Unknown', category: 'Unknown' }
}

const getEmployeeInfo = (id: string) => {
  return empStore.employees.find(e => e.id === id) || { name: 'Unknown', department: '' }
}

const isOverdue = (dateStr: string) => {
  return dateStr < now.toISOString().split('T')[0]
}

const overdueItems = computed(() => {
  const today = now.toISOString().split('T')[0]
  return txStore.borrows.filter(b => b.status === 'Active' && b.expected_return_date < today)
})

const isCartInvalid = computed(() => {
  if (!form.value.items[0].asset_id) return true
  const selectedIds = new Set()
  for (let index = 0; index < form.value.items.length; index++) {
    const item = form.value.items[index]
    if (!item.asset_id) return true
    if (selectedIds.has(item.asset_id)) return true
    selectedIds.add(item.asset_id)
  }
  return false
})

const groupedBorrows = computed(() => {
  const activeBorrows = txStore.borrows.filter(b => b.status === 'Active')
  const groups: Record<string, any> = {}

  activeBorrows.forEach(b => {
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

const selectedGroup = computed(() => {
  if (!selectedGroupId.value) return null
  return groupedBorrows.value.find(g => g.group_id === selectedGroupId.value)
})

const openDetailsDialog = (groupRow: any) => {
  selectedGroupId.value = groupRow.group_id
  detailsDialog.value = true
}

const addItem = () => {
  form.value.items.push({ category: '', asset_id: '' })
}

const removeItem = (index: number) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

// Scanner triggers
const openScannerForCart = () => {
  scannerTarget.value = 'cart'
  showScanner.value = true
}

const openScannerForEmployee = () => {
  scannerTarget.value = 'employee'
  showScanner.value = true
}

const handleScanResult = (code: string) => {
  showScanner.value = false

  if (scannerTarget.value === 'employee') {
    const emp = empStore.employees.find(e => e.id.toLowerCase() === code.toLowerCase() || e.name.toLowerCase() === code.toLowerCase())
    if (emp) {
      form.value.employee_id = emp.id
      $q.notify({ type: 'positive', message: `Employee assigned: ${emp.name}`, position: 'top' })
    } else {
      $q.notify({ type: 'warning', message: `No employee matched code: ${code}`, position: 'top' })
    }
    return
  }

  // Scanner target: Cart item
  const asset = assetStore.assets.find(a => a.id.toLowerCase() === code.toLowerCase() || a.name.toLowerCase() === code.toLowerCase())
  if (!asset) {
    $q.notify({ type: 'negative', message: `Asset ${code} not found in catalog`, position: 'top' })
    return
  }

  if (asset.status !== 'Available') {
    $q.notify({ type: 'warning', message: `Asset ${asset.id} is currently ${asset.status}`, position: 'top' })
    return
  }

  // Populate first empty row or append
  const emptyRow = form.value.items.find(i => !i.asset_id)
  if (emptyRow) {
    emptyRow.category = asset.category
    emptyRow.asset_id = asset.id
  } else {
    form.value.items.push({ category: asset.category, asset_id: asset.id })
  }
  $q.notify({ type: 'positive', message: `Added ${asset.id} (${asset.name}) to cart`, position: 'top' })
}

const onBorrow = async () => {
  if (isCartInvalid.value || !signatureData.value) return
  submitting.value = true

  try {
    const locationStr = selectedBuilding.value && selectedRoom.value ? `${selectedBuilding.value} > ${selectedRoom.value}` : ''
    const assetIds = form.value.items.map(item => item.asset_id).filter(Boolean)

    await axios.post(`${API_URL}/borrow`, {
      asset_ids: assetIds,
      employee_id: form.value.employee_id,
      borrow_date: form.value.borrow_date,
      expected_return_date: form.value.expected_return_date,
      reason: form.value.reason,
      location: locationStr,
      signature_data: signatureData.value
    })

    $q.notify({ type: 'positive', message: `Checked out ${assetIds.length} item(s) successfully with digital signature!`, position: 'top' })

    // Reset Form
    form.value = {
      employee_id: '',
      borrow_date: borrowDateDefault,
      expected_return_date: returnDateDefault,
      reason: '',
      items: [{ category: '', asset_id: '' }]
    }
    selectedBuilding.value = ''
    selectedRoom.value = ''
    signatureData.value = null
    if (sigPadRef.value) sigPadRef.value.clear()

    await txStore.fetchAllTransactions()
    await assetStore.fetchAssets()
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to process digital checkout', position: 'top' })
  } finally {
    submitting.value = false
  }
}

// Return inspection modal
const openReturnDialog = (record: any) => {
  selectedReturnRecord.value = record
  returnCondition.value = 'Good'
  returnLocation.value = ''
  returnPhotoFile.value = null
  returnDialog.value = true
}

const submitReturnInspection = async () => {
  if (!selectedReturnRecord.value) return
  submittingReturn.value = true

  try {
    let conditionPhotoUrl = ''

    // Upload photo if taken/provided
    if (returnPhotoFile.value) {
      const fd = new FormData()
      fd.append('image', returnPhotoFile.value)
      const uploadRes = await axios.post(`${API_URL}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      conditionPhotoUrl = uploadRes.data.imageUrl
    }

    const returnDate = new Date().toISOString().slice(0, 16).replace('T', ' ')
    await axios.post(`${API_URL}/return`, {
      borrow_id: selectedReturnRecord.value.id,
      asset_id: selectedReturnRecord.value.asset_id,
      return_date: returnDate,
      condition: returnCondition.value,
      condition_photo: conditionPhotoUrl,
      location: returnLocation.value
    })

    $q.notify({ 
      type: returnCondition.value === 'Damaged' ? 'warning' : 'positive', 
      message: `Item returned (${returnCondition.value} condition)${conditionPhotoUrl ? ' with photo evidence' : ''}`, 
      position: 'top' 
    })

    returnDialog.value = false
    detailsDialog.value = false
    await txStore.fetchAllTransactions()
    await assetStore.fetchAssets()
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to complete item return', position: 'top' })
  } finally {
    submittingReturn.value = false
  }
}

const sendOverdueNotifications = async () => {
  notifyingOverdue.value = true
  try {
    const res = await axios.post(`${API_URL}/borrow/notify-overdue`)
    $q.notify({ type: 'positive', message: res.data.message || 'Overdue alerts dispatched!', position: 'top' })
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to dispatch notifications', position: 'top' })
  } finally {
    notifyingOverdue.value = false
  }
}

const columns = [
  { name: 'employee_name', label: 'Borrower', field: 'employee_id', align: 'left', sortable: true },
  { name: 'borrow_date', label: 'Checkout Date', field: 'borrow_date', align: 'left', sortable: true },
  { name: 'item_count', label: 'Items', field: 'item_count', align: 'center' },
  { name: 'due_status', label: 'Status / Due', field: 'expected_return_date', align: 'center', sortable: true },
  { name: 'actions', label: 'Action', field: 'actions', align: 'right' }
] as any
</script>
