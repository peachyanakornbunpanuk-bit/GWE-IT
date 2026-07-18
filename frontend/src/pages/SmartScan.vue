<template>
  <q-page padding class="q-pa-md row justify-center" style="min-height: 100vh;">
    
    <!-- Loading State -->
    <div v-if="loadingAsset" class="flex flex-center full-width">
      <q-spinner color="primary" size="3em" />
    </div>

    <!-- Error State -->
    <div v-else-if="errorMsg" class="flex flex-center full-width">
      <q-card class="clean-card shadow-12 q-pa-xl text-center" style="width: 100%; max-width: 450px; border-radius: 16px;">
        <q-icon name="error" color="negative" size="80px" class="q-mb-md" />
        <div class="text-h5 text-weight-bold text-negative q-mb-sm">Asset Not Found</div>
        <div class="text-subtitle1 text-grey-6 q-mb-lg">{{ errorMsg }}</div>
        <q-btn color="primary" label="Go Back" unelevated class="full-width" @click="$router.push('/')" />
      </q-card>
    </div>

    <!-- Success State (After Borrow or Return) -->
    <div v-else-if="successMsg" class="flex flex-center full-width">
      <q-card class="clean-card shadow-12 q-pa-xl text-center" style="width: 100%; max-width: 450px; border-radius: 16px;">
        <q-icon name="check_circle" color="positive" size="80px" class="q-mb-md" />
        <div class="text-h5 text-weight-bold text-dark q-mb-sm">Success!</div>
        <div class="text-subtitle1 text-grey-6 q-mb-lg">{{ successMsg }}</div>
        <q-btn color="primary" label="Back to Dashboard" unelevated class="full-width text-weight-bold" size="lg" style="border-radius: 8px;" @click="$router.push('/')" />
      </q-card>
    </div>

    <!-- Smart Scan Container -->
    <div v-else class="full-width" style="max-width: 600px;">
      
      <!-- Top header -->
      <div class="row items-center q-mb-lg">
        <q-btn icon="arrow_back" flat round color="grey-7" @click="$router.push('/')" class="q-mr-md" />
        <div>
          <div class="text-h5 text-weight-bold text-dark">Asset Hub</div>
          <div class="text-caption text-grey-6">Smart Scanner</div>
        </div>
      </div>

      <!-- Unified Asset Preview Card -->
      <q-card class="clean-card shadow-sm q-mb-lg q-pa-md" style="border: 1px solid #e2e8f0;">
        <div class="row items-center q-col-gutter-md">
          <div class="col-auto">
            <q-avatar rounded size="80px" color="white" text-color="primary" class="shadow-2" style="border: 1px solid #e2e8f0;">
              <img v-if="asset?.image_url" :src="`${backendBaseUrl}${asset.image_url}`" style="object-fit: contain; padding: 4px;" />
              <q-icon v-else :name="getCategoryIcon(asset?.category)" size="36px" />
            </q-avatar>
          </div>
          <div class="col">
            <div class="text-caption text-grey-6 text-uppercase text-weight-bold tracking-wide">{{ asset?.category }}</div>
            <div class="text-h6 text-weight-bold text-dark" style="line-height: 1.2;">{{ asset?.name }}</div>
            <div class="text-caption text-grey-7">Code: {{ asset?.id }}</div>
          </div>
          <div class="col-auto text-right">
            <span class="status-badge" :class="'status-' + asset?.status?.toLowerCase().replace(' ', '')">
              {{ asset?.status }}
            </span>
            <div class="text-caption text-grey-6 q-mt-xs" v-if="asset?.holder && asset?.holder !== '-'">Holder: {{ asset?.holder }}</div>
          </div>
        </div>
      </q-card>

      <!-- SCENARIO 1: AVAILABLE (Borrow Form) -->
      <q-card v-if="asset?.status === 'Available'" class="clean-card shadow-md q-pa-lg">
        <div class="text-h6 text-weight-bold text-primary q-mb-md flex items-center">
          <q-icon name="qr_code_scanner" size="24px" class="q-mr-sm" /> Self-Service Borrow
        </div>
        
        <q-form @submit="onSubmitBorrow" class="q-gutter-md">
          <div class="text-subtitle2 text-grey-8 q-mb-xs">Borrowing As / Assign To:</div>
          
          <q-select 
            v-if="isPrivilegedUser"
            outlined 
            v-model="form.selected_employee" 
            :options="employeeStore.employees"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            label="Select Employee"
            dense 
            required
            class="bg-white" 
          />
          <q-input 
            v-else 
            outlined 
            :model-value="authStore.user?.username" 
            disable 
            readonly 
            dense 
            class="bg-grey-2" 
          />

          <div class="text-subtitle2 text-grey-8 q-mt-md q-mb-xs">Expected Return Date:</div>
          <q-input outlined v-model="form.expected_return_date" type="date" required dense />

          <div class="text-subtitle2 text-grey-8 q-mt-md q-mb-xs">Reason / Notes:</div>
          <q-input outlined v-model="form.reason" type="textarea" rows="3" placeholder="Why do you need this?" required />

          <q-btn 
            type="submit" 
            color="primary" 
            label="Confirm Checkout" 
            icon-right="shopping_cart_checkout"
            unelevated 
            class="full-width text-weight-bold q-mt-lg" 
            size="lg" 
            style="border-radius: 8px;"
            :loading="submitting"
          />
        </q-form>
      </q-card>

      <!-- SCENARIO 2: UNAVAILABLE (Timeline + Return Button) -->
      <div v-else>
        <!-- Return Action Card (Only if Borrowed) -->
        <q-card v-if="asset?.status === 'Borrowed'" class="clean-card shadow-md q-pa-lg q-mb-lg bg-orange-1" style="border: 1px solid #fed7aa;">
          <div class="text-h6 text-weight-bold text-orange-9 q-mb-sm">Return Asset</div>
          <div class="text-subtitle2 text-orange-8 q-mb-md">This item is currently checked out to <strong>{{ asset?.holder }}</strong>. Would you like to check it back in?</div>
          
          <q-select outlined v-model="returnCondition" :options="['Good', 'Damaged', 'Lost']" label="Condition upon Return" dense class="bg-white q-mb-md" />
          
          <q-btn 
            @click="onSubmitReturn"
            color="orange-8" 
            label="Return Item Now" 
            icon-right="keyboard_return"
            unelevated 
            class="full-width text-weight-bold" 
            size="md" 
            style="border-radius: 8px;"
            :loading="submitting"
          />
        </q-card>

        <!-- Timeline Card -->
        <q-card class="clean-card shadow-sm q-pa-md">
          <div class="text-h6 text-weight-bold text-dark q-mb-md q-px-sm">Lifecycle History</div>
          
          <div v-if="auditLogs.length === 0" class="text-center q-pa-xl text-grey-6">
            <q-icon name="history" size="48px" class="q-mb-md opacity-50" />
            <div>No audit logs found for this asset.</div>
          </div>

          <q-timeline v-else color="primary" class="q-px-sm">
            <q-timeline-entry
              v-for="log in auditLogs"
              :key="log.id"
              :title="formatAction(log?.action)"
              :subtitle="formatDate(log?.timestamp)"
              :color="getActionColor(log?.action)"
              :icon="getActionIcon(log?.action)"
            >
              <div v-if="parseDescription(log?.description).chips.length > 0">
                <div class="text-subtitle1 text-weight-medium text-dark q-mb-sm">{{ parseDescription(log?.description).main }}</div>
                <div class="row q-gutter-sm q-mb-md">
                  <q-chip 
                    v-for="(chip, index) in parseDescription(log?.description).chips" 
                    :key="index"
                    size="sm"
                    color="grey-2"
                    text-color="blue-grey-9"
                    class="text-weight-bold q-ma-none"
                    square
                    style="border-radius: 4px;"
                  >
                    <span class="text-grey-6 q-mr-xs">{{ chip.key }}:</span> {{ chip.val }}
                  </q-chip>
                </div>
              </div>
              <div v-else class="text-subtitle1 text-dark q-mb-md">{{ log?.description }}</div>
              <div class="text-caption text-grey-6 flex items-center">
                <q-icon name="person" class="q-mr-xs" size="16px" />
                Logged by: <span class="text-weight-bold q-ml-xs text-primary">{{ log?.user }}</span>
              </div>
            </q-timeline-entry>
          </q-timeline>
        </q-card>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useEmployeeStore } from '../stores/employeeStore'
import { useQuasar } from 'quasar'
import axios from 'axios'

const route = useRoute()
const authStore = useAuthStore()
const employeeStore = useEmployeeStore()
const $q = useQuasar()

const API_URL = import.meta.env.VITE_API_URL || '/api'
const backendBaseUrl = API_URL.replace(/\/api$/, '')
const assetId = route.params.id as string

const asset = ref<any>(null)
const auditLogs = ref<any[]>([])
const loadingAsset = ref(true)
const submitting = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

// Default return date to today
const today = new Date().toISOString().split('T')[0]

const form = ref({
  expected_return_date: today,
  reason: '',
  selected_employee: ''
})

const returnCondition = ref('Good')

const isPrivilegedUser = computed(() => {
  return authStore.user?.role === 'Manager' || authStore.user?.role === 'IT Officer'
})

const loadData = async () => {
  try {
    loadingAsset.value = true
    const [assetRes, auditRes] = await Promise.all([
      axios.get(`${API_URL}/assets/${assetId}`),
      axios.get(`${API_URL}/audit/${assetId}`)
    ])
    asset.value = assetRes.data
    auditLogs.value = auditRes.data
    
    // Fetch employees for the dropdown
    if (isPrivilegedUser.value) {
      await employeeStore.fetchEmployees()
    } else {
      form.value.selected_employee = authStore.user?.username || ''
    }

  } catch (error: any) {
    console.error('Error fetching asset', error)
    errorMsg.value = error.response?.data?.error || 'Asset not found or network error.'
  } finally {
    loadingAsset.value = false
  }
}

onMounted(() => {
  loadData()
})

const onSubmitBorrow = async () => {
  if (!authStore.user) return

  // Validate employee selection
  if (isPrivilegedUser.value && !form.value.selected_employee) {
    $q.notify({ color: 'warning', message: 'Please select an employee.', position: 'top' })
    return
  }

  submitting.value = true
  try {
    await axios.post(`${API_URL}/borrow`, {
      asset_ids: [assetId],
      employee_id: form.value.selected_employee,
      borrow_date: new Date().toISOString(),
      expected_return_date: form.value.expected_return_date,
      reason: form.value.reason,
      user: authStore.user.username // The person recording the transaction
    })
    
    successMsg.value = `Asset successfully assigned to ${form.value.selected_employee}.`
  } catch (error: any) {
    console.error(error)
    $q.notify({ color: 'negative', message: error.response?.data?.error || 'Borrow failed', position: 'top' })
  } finally {
    submitting.value = false
  }
}

const onSubmitReturn = async () => {
  if (!authStore.user) return

  submitting.value = true
  try {
    await axios.post(`${API_URL}/return`, {
      asset_id: assetId,
      return_date: new Date().toISOString(),
      condition: returnCondition.value,
      user: authStore.user.username
    })
    
    successMsg.value = 'You have successfully returned this asset to inventory.'
  } catch (error: any) {
    console.error(error)
    $q.notify({ color: 'negative', message: error.response?.data?.error || 'Return failed', position: 'top' })
  } finally {
    submitting.value = false
  }
}

const getCategoryIcon = (category?: string) => {
  if (!category) return 'devices_other'
  const cat = category.toLowerCase()
  if (cat.includes('computer') || cat.includes('laptop') || cat.includes('macbook')) return 'laptop_mac'
  if (cat.includes('phone') || cat.includes('mobile')) return 'smartphone'
  if (cat.includes('monitor') || cat.includes('display')) return 'monitor'
  if (cat.includes('network') || cat.includes('router')) return 'router'
  if (cat.includes('furniture') || cat.includes('desk')) return 'desk'
  return 'devices_other'
}

const resolveEmployeeName = (idOrName: string) => {
  if (!idOrName || idOrName === 'None') return 'None'
  const emp = employeeStore.employees.find(e => e.id === idOrName)
  return emp ? emp.name : idOrName
}

const parseDescription = (desc?: string) => {
  if (!desc) return { main: '', chips: [] }
  if (desc.includes(':')) {
    const parts = desc.split(':')
    const mainAction = parts[0].trim()
    const detailString = parts.slice(1).join(':').trim()
    
    if (detailString.includes('=')) {
      const chipPairs = detailString.split(',').map(pair => {
        const [key, val] = pair.split('=')
        let finalVal = val?.trim()
        if (key?.trim().toLowerCase() === 'holder' && finalVal) {
          finalVal = resolveEmployeeName(finalVal)
        }
        return { key: key?.trim(), val: finalVal }
      }).filter(c => c.key && c.val)
      
      return { main: mainAction, chips: chipPairs }
    }
  }
  return { main: desc, chips: [] }
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString()
}

const formatAction = (action?: string) => {
  if (!action) return 'Unknown Action'
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

const getActionColor = (action?: string) => {
  if (!action) return 'primary'
  if (action.includes('PURCHASE') || action.includes('CREATE')) return 'green'
  if (action.includes('BORROW')) return 'orange'
  if (action.includes('RETURN')) return 'blue'
  if (action.includes('REPAIR')) return 'red'
  if (action.includes('DELETE')) return 'black'
  return 'primary'
}

const getActionIcon = (action?: string) => {
  if (!action) return 'history'
  if (action.includes('PURCHASE') || action.includes('CREATE')) return 'shopping_cart'
  if (action.includes('BORROW')) return 'swap_horiz'
  if (action.includes('RETURN')) return 'keyboard_return'
  if (action.includes('SENT_TO_REPAIR')) return 'build'
  if (action.includes('REPAIR_RESOLVED')) return 'verified'
  if (action.includes('DELETE')) return 'delete_forever'
  return 'history'
}
</script>
