<template>
  <q-page padding class="q-pa-lg fade-in">
    <div class="row justify-between items-center q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-dark">System Settings</div>
        <div class="text-subtitle1 text-grey-6">Manage global application configurations</div>
      </div>
    </div>

    <q-card class="clean-card shadow-sm">
      <q-tabs
        v-model="tab"
        dense
        class="text-grey-7 bg-transparent"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="categories" label="Asset Categories" class="text-weight-bold q-px-md" />
        <q-tab name="suppliers" label="Vendors & Suppliers" class="text-weight-bold q-px-md" />
        <q-tab name="departments" label="Company Departments" class="text-weight-bold q-px-md" />
        <q-tab name="buildings" label="Buildings" class="text-weight-bold q-px-md" />
        <q-tab name="locations" label="Rooms (Locations)" class="text-weight-bold q-px-md" />
        <q-tab name="users" label="User Access & Roles" class="text-weight-bold q-px-md" v-if="authStore.isSuperAdmin" />
        <q-tab name="backups" label="Database Backups" class="text-weight-bold q-px-md" v-if="authStore.isSuperAdmin" />
        <q-tab name="notifications" label="Alert Settings" class="text-weight-bold q-px-md" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated class="bg-white text-dark">
        
        <!-- Categories Tab -->
        <q-tab-panel name="categories" class="q-pa-lg">
          <div class="text-h6 text-weight-bold q-mb-md">Manage Asset Categories</div>
          
          <div class="row q-col-gutter-md q-mb-lg" style="max-width: 500px">
            <div class="col-8">
              <q-input outlined dense v-model="newCategory" placeholder="e.g. VR Headset" @keyup.enter="addSetting('category', newCategory)" />
            </div>
            <div class="col-4">
              <q-btn color="primary" icon="add" label="Add" unelevated class="full-width h-full" @click="addSetting('category', newCategory)" />
            </div>
          </div>

          <q-list bordered separator style="max-width: 500px; border-radius: 8px">
            <q-item v-for="cat in settingStore.rawCategories" :key="cat.id">
              <q-item-section class="text-weight-medium">{{ cat.value }}</q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn icon="edit" flat round dense color="primary" size="sm" @click="editSettingPrompt(cat)" />
                  <q-btn icon="delete" flat round dense color="negative" size="sm" @click="deleteSetting(cat.id)" />
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="settingStore.rawCategories.length === 0">
              <q-item-section class="text-grey-6 text-italic">No categories configured.</q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <!-- Suppliers Tab -->
        <q-tab-panel name="suppliers" class="q-pa-lg">
          <div class="text-h6 text-weight-bold q-mb-md">Manage Vendors & Suppliers</div>
          
          <div class="row q-col-gutter-md q-mb-lg" style="max-width: 500px">
            <div class="col-8">
              <q-input outlined dense v-model="newSupplier" placeholder="e.g. Dell Enterprise" @keyup.enter="addSetting('supplier', newSupplier)" />
            </div>
            <div class="col-4">
              <q-btn color="primary" icon="add" label="Add" unelevated class="full-width h-full" @click="addSetting('supplier', newSupplier)" />
            </div>
          </div>

          <q-list bordered separator style="max-width: 500px; border-radius: 8px">
            <q-item v-for="sup in settingStore.rawSuppliers" :key="sup.id">
              <q-item-section class="text-weight-medium">{{ sup.value }}</q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn icon="edit" flat round dense color="primary" size="sm" @click="editSettingPrompt(sup)" />
                  <q-btn icon="delete" flat round dense color="negative" size="sm" @click="deleteSetting(sup.id)" />
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="settingStore.rawSuppliers.length === 0">
              <q-item-section class="text-grey-6 text-italic">No suppliers configured.</q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <!-- Departments Tab -->
        <q-tab-panel name="departments" class="q-pa-lg">
          <div class="text-h6 text-weight-bold q-mb-md">Manage Company Departments</div>
          
          <div class="row q-col-gutter-md q-mb-lg" style="max-width: 500px">
            <div class="col-8">
              <q-input outlined dense v-model="newDepartment" placeholder="e.g. Data Science" @keyup.enter="addSetting('department', newDepartment)" />
            </div>
            <div class="col-4">
              <q-btn color="primary" icon="add" label="Add" unelevated class="full-width h-full" @click="addSetting('department', newDepartment)" />
            </div>
          </div>

          <q-list bordered separator style="max-width: 500px; border-radius: 8px">
            <q-item v-for="dep in settingStore.rawDepartments" :key="dep.id">
              <q-item-section class="text-weight-medium">{{ dep.value }}</q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn icon="edit" flat round dense color="primary" size="sm" @click="editSettingPrompt(dep)" />
                  <q-btn icon="delete" flat round dense color="negative" size="sm" @click="deleteSetting(dep.id)" />
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="settingStore.rawDepartments.length === 0">
              <q-item-section class="text-grey-6 text-italic">No departments configured.</q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <!-- Buildings Tab -->
        <q-tab-panel name="buildings" class="q-pa-lg">
          <div class="text-h6 text-weight-bold q-mb-md">Manage Buildings</div>
          
          <div class="row q-col-gutter-md q-mb-lg" style="max-width: 500px">
            <div class="col-8">
              <q-input outlined dense v-model="newBuilding" placeholder="e.g. Head Office" @keyup.enter="addSetting('building', newBuilding)" />
            </div>
            <div class="col-4">
              <q-btn color="primary" icon="add" label="Add" unelevated class="full-width h-full" @click="addSetting('building', newBuilding)" />
            </div>
          </div>

          <q-list bordered separator style="max-width: 500px; border-radius: 8px">
            <q-item v-for="bld in settingStore.rawBuildings" :key="bld.id">
              <q-item-section class="text-weight-medium">{{ bld.value }}</q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn icon="edit" flat round dense color="primary" size="sm" @click="editSettingPrompt(bld)" />
                  <q-btn icon="delete" flat round dense color="negative" size="sm" @click="deleteSetting(bld.id)" />
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="settingStore.rawBuildings.length === 0">
              <q-item-section class="text-grey-6 text-italic">No buildings configured.</q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <!-- Locations Tab -->
        <q-tab-panel name="locations" class="q-pa-lg">
          <div class="text-h6 text-weight-bold q-mb-md">Manage Rooms</div>
          
          <div class="row q-col-gutter-md q-mb-lg" style="max-width: 600px">
            <div class="col-4">
              <q-select outlined dense v-model="selectedBuildingForRoom" :options="settingStore.buildings" label="Select Building" />
            </div>
            <div class="col-5">
              <q-input outlined dense v-model="newLocation" placeholder="e.g. Room 101" @keyup.enter="addRoom" :disable="!selectedBuildingForRoom" />
            </div>
            <div class="col-3">
              <q-btn color="primary" icon="add" label="Add" unelevated class="full-width h-full" @click="addRoom" :disable="!selectedBuildingForRoom || !newLocation" />
            </div>
          </div>

          <div class="row q-col-gutter-md q-mb-md items-center">
            <div class="col-12 col-sm-6 text-subtitle2 text-weight-bold">
              Existing Rooms
            </div>
            <div class="col-6 col-sm-3">
              <q-select outlined dense v-model="filterBuilding" :options="settingStore.buildings" label="Filter by Building" clearable />
            </div>
            <div class="col-6 col-sm-3">
              <q-input outlined dense v-model="searchRoom" placeholder="Search Room..." clearable>
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          </div>

          <q-table
            flat bordered
            :rows="filteredRooms"
            :columns="roomColumns"
            row-key="id"
            :pagination="{ rowsPerPage: 10 }"
            class="bg-transparent"
          >
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" align="right">
                <q-btn icon="edit" flat round dense color="primary" size="sm" @click="editRoomPrompt(props.row)" />
                <q-btn icon="delete" flat round dense color="negative" size="sm" @click="deleteSetting(props.row.id)" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- User Access & Roles Tab (RBAC) -->
        <q-tab-panel name="users" class="q-pa-lg">
          <div class="row items-center justify-between q-mb-md">
            <div>
              <div class="text-h6 text-weight-bold">Role-Based Access Control (RBAC)</div>
              <div class="text-caption text-grey-6">Configure user accounts and permission tiers</div>
            </div>
            <q-btn color="primary" icon="person_add" label="Add New User" unelevated @click="addUserDialog = true" style="border-radius: 6px;" />
          </div>

          <q-table
            flat bordered
            :rows="usersList"
            :columns="userColumns"
            row-key="id"
            :loading="loadingUsers"
            class="bg-transparent"
          >
            <template v-slot:body-cell-role="props">
              <q-td :props="props">
                <q-select 
                  dense outlined 
                  v-model="props.row.role" 
                  :options="['Super Admin', 'Warehouse Staff', 'General Employee']" 
                  @update:model-value="(val) => updateUserRole(props.row.id, val)"
                  style="max-width: 190px;"
                />
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" align="right">
                <q-btn flat round dense color="negative" icon="delete" @click="confirmDeleteUser(props.row)" :disable="props.row.username === 'manager' || props.row.username === authStore.user?.username" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Automated Database Backups Tab -->
        <q-tab-panel name="backups" class="q-pa-lg">
          <div class="row items-center justify-between q-mb-md">
            <div>
              <div class="text-h6 text-weight-bold">Automated Database Backups</div>
              <div class="text-caption text-grey-6">Automatic daily snapshots and manual disaster recovery exports</div>
            </div>
            <q-btn color="primary" icon="cloud_upload" label="Create Instant Backup" unelevated :loading="creatingBackup" @click="createBackupNow" style="border-radius: 6px;" />
          </div>

          <q-table
            flat bordered
            :rows="backupsList"
            :columns="backupColumns"
            row-key="id"
            :loading="loadingBackups"
            class="bg-transparent"
          >
            <template v-slot:body-cell-size="props">
              <q-td :props="props">
                {{ formatBytes(props.row.size_bytes) }}
              </q-td>
            </template>
            <template v-slot:body-cell-type="props">
              <q-td :props="props" align="center">
                <q-badge :color="props.row.type === 'automatic' ? 'primary' : 'teal'" class="text-weight-bold">
                  {{ (props.row.type || 'MANUAL').toUpperCase() }}
                </q-badge>
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" align="right">
                <q-btn size="sm" color="primary" outline label="Download Backup" icon="download" @click="downloadBackup(props.row.filename)" style="border-radius: 6px;" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Alert & Notification Settings Tab -->
        <q-tab-panel name="notifications" class="q-pa-lg">
          <div class="text-h6 text-weight-bold q-mb-sm">External Notification & Alert Integrations</div>
          <div class="text-caption text-grey-6 q-mb-lg">Configure direct channels for overdue equipment and critical damaged alerts</div>

          <div style="max-width: 600px;" class="q-gutter-y-lg">
            <q-card flat bordered class="q-pa-md">
              <div class="text-subtitle1 text-weight-bold flex items-center q-mb-xs">
                <q-icon name="chat" color="positive" class="q-mr-sm" size="22px" />
                LINE Notify Integration
              </div>
              <div class="text-caption text-grey-6 q-mb-md">
                Enter your LINE Notify access token to dispatch real-time alerts to mobile devices.
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-8">
                  <q-input outlined dense v-model="lineToken" placeholder="LINE Notify Access Token" type="password" />
                </div>
                <div class="col-4">
                  <q-btn color="positive" label="Save Token" unelevated class="full-width h-full" @click="saveLineToken" />
                </div>
              </div>
            </q-card>

            <q-card flat bordered class="q-pa-md">
              <div class="text-subtitle1 text-weight-bold flex items-center q-mb-xs">
                <q-icon name="inventory" color="warning" class="q-mr-sm" size="22px" />
                Low Stock Safety Threshold
              </div>
              <div class="text-caption text-grey-6 q-mb-md">
                Alert trigger point when item quantity drops below this amount.
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-8">
                  <q-input outlined dense v-model.number="lowStockLimit" type="number" min="1" max="50" />
                </div>
                <div class="col-4">
                  <q-btn color="primary" label="Save Limit" unelevated class="full-width h-full" @click="saveLowStockLimit" />
                </div>
              </div>
            </q-card>
          </div>
        </q-tab-panel>
        
      </q-tab-panels>
    </q-card>

    <!-- Add User Dialog -->
    <q-dialog v-model="addUserDialog">
      <q-card style="width: 400px; max-width: 90vw;" class="clean-card q-pa-md">
        <q-card-section>
          <div class="text-h6 text-dark text-weight-bold">Create System User</div>
          <div class="text-caption text-grey-6">Assign role and credentials for system access</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleCreateUser" class="q-gutter-md">
            <q-input outlined dense v-model="userForm.username" label="Username *" required />
            <q-input outlined dense v-model="userForm.password" label="Password *" type="password" required />
            <q-select 
              outlined dense 
              v-model="userForm.role" 
              :options="['Super Admin', 'Warehouse Staff', 'General Employee']" 
              label="Role *" 
              required 
            />
            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Cancel" color="grey-7" v-close-popup />
              <q-btn color="primary" label="Create User" type="submit" unelevated style="border-radius: 6px;" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useSettingStore } from '../stores/settingStore'
import { useAuthStore } from '../stores/authStore'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const $q = useQuasar()
const settingStore = useSettingStore()
const authStore = useAuthStore()

const tab = ref('categories')

const newCategory = ref('')
const newSupplier = ref('')
const newDepartment = ref('')
const newBuilding = ref('')
const newLocation = ref('')
const selectedBuildingForRoom = ref('')

const searchRoom = ref('')
const filterBuilding = ref('')

// User Management State
const usersList = ref<any[]>([])
const loadingUsers = ref(false)
const addUserDialog = ref(false)
const userForm = ref({ username: '', password: '', role: 'General Employee' })

const userColumns = [
  { name: 'id', label: 'User ID', field: 'id', align: 'left', sortable: true },
  { name: 'username', label: 'Username', field: 'username', align: 'left', sortable: true },
  { name: 'role', label: 'System Access Role', field: 'role', align: 'left', sortable: true },
  { name: 'actions', label: 'Action', field: 'actions', align: 'right' }
] as any

// Automated Backups State
const backupsList = ref<any[]>([])
const loadingBackups = ref(false)
const creatingBackup = ref(false)

const backupColumns = [
  { name: 'filename', label: 'Backup File Name', field: 'filename', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created At', field: (row: any) => new Date(row.created_at).toLocaleString(), align: 'left', sortable: true },
  { name: 'size', label: 'File Size', field: 'size_bytes', align: 'left' },
  { name: 'created_by', label: 'Created By', field: 'created_by', align: 'left' },
  { name: 'type', label: 'Type', field: 'type', align: 'center' },
  { name: 'actions', label: 'Download', field: 'actions', align: 'right' }
] as any

// Notifications State
const lineToken = ref('')
const lowStockLimit = ref(5)

onMounted(async () => {
  if (authStore.isSuperAdmin) {
    await fetchUsers()
    await fetchBackups()
  }
  await fetchAlertSettings()
})

const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const res = await axios.get(`${API_URL}/users`)
    usersList.value = res.data
  } catch (e) {
    console.error('Fetch users error:', e)
  } finally {
    loadingUsers.value = false
  }
}

const handleCreateUser = async () => {
  try {
    await axios.post(`${API_URL}/users`, userForm.value)
    $q.notify({ type: 'positive', message: `User ${userForm.value.username} created successfully!`, position: 'top' })
    userForm.value = { username: '', password: '', role: 'General Employee' }
    addUserDialog.value = false
    await fetchUsers()
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.error || 'Failed to create user', position: 'top' })
  }
}

const updateUserRole = async (userId: number, newRole: string) => {
  try {
    await axios.put(`${API_URL}/users/${userId}/role`, { role: newRole })
    $q.notify({ type: 'positive', message: `Role updated to ${newRole}`, position: 'top' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Failed to update user role', position: 'top' })
    await fetchUsers()
  }
}

const confirmDeleteUser = (user: any) => {
  $q.dialog({
    title: 'Delete User Account',
    message: `Are you sure you want to permanently delete user "${user.username}"?`,
    cancel: true,
    color: 'negative'
  }).onOk(async () => {
    try {
      await axios.delete(`${API_URL}/users/${user.id}`)
      $q.notify({ type: 'info', message: `User ${user.username} deleted`, position: 'top' })
      await fetchUsers()
    } catch (e) {
      $q.notify({ type: 'negative', message: 'Failed to delete user', position: 'top' })
    }
  })
}

const fetchBackups = async () => {
  loadingBackups.value = true
  try {
    const res = await axios.get(`${API_URL}/backup`)
    backupsList.value = res.data
  } catch (e) {
    console.error('Fetch backups error:', e)
  } finally {
    loadingBackups.value = false
  }
}

const createBackupNow = async () => {
  creatingBackup.value = true
  try {
    const res = await axios.post(`${API_URL}/backup/create`)
    $q.notify({ type: 'positive', message: res.data.message || 'Database backup created!', position: 'top' })
    await fetchBackups()
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Failed to create database backup', position: 'top' })
  } finally {
    creatingBackup.value = false
  }
}

const downloadBackup = (filename: string) => {
  window.open(`${API_URL}/backup/download/${filename}`, '_blank')
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const fetchAlertSettings = async () => {
  const settings = settingStore.settings
  const lineSetting = settings.find(s => s.type === 'line_token')
  if (lineSetting) lineToken.value = lineSetting.value
  const limitSetting = settings.find(s => s.type === 'low_stock_limit')
  if (limitSetting) lowStockLimit.value = Number(limitSetting.value) || 5
}

const saveLineToken = async () => {
  try {
    await settingStore.addSetting('line_token', lineToken.value.trim())
    $q.notify({ type: 'positive', message: 'LINE Notify Token saved successfully!', position: 'top' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Failed to save LINE token', position: 'top' })
  }
}

const saveLowStockLimit = async () => {
  try {
    await settingStore.addSetting('low_stock_limit', String(lowStockLimit.value))
    $q.notify({ type: 'positive', message: 'Low stock safety threshold saved!', position: 'top' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Failed to save threshold', position: 'top' })
  }
}

const roomColumns = [
  { name: 'building', label: 'Building', field: (row: any) => row.value.includes(' > ') ? row.value.split(' > ')[0] : 'Unassigned', align: 'left', sortable: true },
  { name: 'room', label: 'Room', field: (row: any) => row.value.includes(' > ') ? row.value.split(' > ')[1] : row.value, align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', align: 'right' }
] as any

const filteredRooms = computed(() => {
  let rooms = settingStore.rawLocations
  if (filterBuilding.value) {
    rooms = rooms.filter(r => r.value.startsWith(filterBuilding.value + ' > '))
  }
  if (searchRoom.value) {
    const q = searchRoom.value.toLowerCase()
    rooms = rooms.filter(r => r.value.toLowerCase().includes(q))
  }
  return rooms
})

const addSetting = async (type: string, value: string) => {
  if (!value.trim()) return
  
  try {
    await settingStore.addSetting(type, value.trim())
    
    // Clear inputs
    newCategory.value = ''
    newSupplier.value = ''
    newDepartment.value = ''
    newBuilding.value = ''
    $q.notify({ color: 'positive', message: 'Setting added successfully', position: 'top-right' })
  } catch (err) {
    $q.notify({ color: 'negative', message: 'Failed to add setting', position: 'top' })
  }
}

const addRoom = async () => {
  if (!selectedBuildingForRoom.value || !newLocation.value.trim()) return
  try {
    const fullName = `${selectedBuildingForRoom.value} > ${newLocation.value.trim()}`
    await settingStore.addSetting('location', fullName)
    newLocation.value = ''
    $q.notify({ color: 'positive', message: 'Room added successfully', position: 'top-right' })
  } catch (err) {
    $q.notify({ color: 'negative', message: 'Failed to add room', position: 'top' })
  }
}

const editRoomPrompt = (setting: any) => {
  const parts = setting.value.split(' > ')
  const building = parts.length > 1 ? parts[0] : ''
  const roomName = parts.length > 1 ? parts[1] : setting.value

  $q.dialog({
    title: 'Edit Room',
    message: `Edit room name for building: ${building || 'Unknown'}`,
    prompt: {
      model: roomName,
      type: 'text'
    },
    cancel: true,
    persistent: true
  }).onOk(async (data: string) => {
    if (data.trim()) {
      try {
        const newValue = building ? `${building} > ${data.trim()}` : data.trim()
        await settingStore.editSetting(setting.id, newValue)
        $q.notify({ color: 'positive', message: 'Room updated successfully', position: 'top-right' })
      } catch (err) {
        $q.notify({ color: 'negative', message: 'Failed to update room', position: 'top' })
      }
    }
  })
}

const deleteSetting = (id: number) => {
  $q.dialog({
    title: 'Confirm Deletion',
    message: 'Are you sure you want to delete this setting? Existing records that already use this setting will NOT be affected, but it will be removed from the dropdowns.',
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    try {
      await settingStore.deleteSetting(id)
      $q.notify({ color: 'info', message: 'Setting deleted', position: 'top-right' })
    } catch (err) {
      console.error('Failed to delete setting:', err)
      $q.notify({ color: 'negative', message: 'Failed to delete setting' })
    }
  })
}

const editSettingPrompt = (setting: any) => {
  $q.dialog({
    title: 'Edit Setting',
    message: 'Update the name of this setting:',
    prompt: {
      model: setting.value,
      type: 'text' // optional
    },
    cancel: true,
    persistent: true,
    color: 'primary'
  }).onOk(async data => {
    if (!data.trim()) return
    try {
      await settingStore.editSetting(setting.id, data.trim())
      $q.notify({ color: 'positive', message: 'Setting updated', position: 'top-right' })
    } catch (err) {
      console.error('Failed to edit setting:', err)
      $q.notify({ color: 'negative', message: 'Failed to update setting' })
    }
  })
}
</script>
