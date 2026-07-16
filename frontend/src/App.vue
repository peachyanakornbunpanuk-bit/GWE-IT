<template>
  <div class="grain"></div>
  <q-layout view="hHh Lpr lff" v-if="authStore.isAuthenticated">
    <q-header class="text-ink shadow-1" style="background: rgba(244, 237, 224, 0.86); backdrop-filter: blur(12px); border-bottom: 1px solid var(--line-soft);">
      <q-toolbar class="q-px-lg">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="drawer = !drawer" color="primary" />
        <q-toolbar-title class="text-weight-bold flex items-center">
          <div class="column q-ml-sm" style="line-height: 1.2">
            <span style="font-family: 'Fraunces', serif; letter-spacing: 0.02em; font-size: 1.25rem; font-weight: 400; color: var(--ink);">IAMS</span>
            <span class="text-caption text-primary" style="font-family: 'Fraunces', serif; font-style: italic; letter-spacing: 0.05em; font-size: 0.8rem; font-weight: 300;">Enterprise</span>
          </div>
        </q-toolbar-title>
        <q-space />
        
        <!-- Global Search -->
        <q-btn flat round dense icon="search" class="q-mr-sm text-grey-7" @click="searchDialog = true" />
        
        <q-btn flat round dense icon="notifications_none" class="q-mr-md text-grey-7">
          <q-badge color="negative" floating rounded v-if="notifStore.unreadCount > 0">{{ notifStore.unreadCount }}</q-badge>
          <q-menu fit anchor="bottom right" self="top right" style="min-width: 320px; max-height: 400px; overflow-y: auto;">
            <q-list class="q-py-sm">
              <q-item-label header class="text-weight-bold text-dark row items-center justify-between">
                <span>Alerts & Notifications</span>
                <q-btn flat dense round icon="done_all" size="sm" @click="notifStore.markAllAsRead(authStore.user?.username || '', authStore.user?.role || '')" v-if="notifStore.unreadCount > 0">
                  <q-tooltip>Mark all as read</q-tooltip>
                </q-btn>
              </q-item-label>
              <div v-if="notifStore.unreadCount === 0" class="q-pa-md text-grey-6 text-center">No new alerts.</div>
              <q-item v-for="notif in notifStore.unreadNotifications" :key="notif.id" clickable v-ripple @click="handleNotifClick(notif)">
                <q-item-section avatar>
                  <q-icon :name="notif.icon" :color="notif.color" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium text-dark">{{ notif.title }}</q-item-label>
                  <q-item-label caption>{{ notif.message }}</q-item-label>
                  <q-item-label caption class="text-grey-5" style="font-size: 10px; margin-top: 2px;">{{ new Date(notif.timestamp).toLocaleString() }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        
        <q-btn flat no-caps class="q-ml-sm" @click="handleLogout">
          <div class="row items-center">
            <q-avatar size="32px" color="primary" text-color="white" class="q-mr-sm">
              {{ authStore.user?.username?.charAt(0).toUpperCase() }}
            </q-avatar>
            <div class="text-left">
              <div class="text-weight-bold" style="line-height: 1.2">{{ authStore.user?.username }}</div>
              <div class="text-caption text-grey-6" style="line-height: 1.2">{{ authStore.user?.role }}</div>
            </div>
            <q-icon name="logout" size="sm" class="q-ml-md text-grey-6" />
          </div>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      show-if-above
      :width="260"
      :breakpoint="768"
      class="sidebar-drawer"
      style="background: var(--cream-soft); border-right: 1px solid var(--line-soft);"
    >
      <q-scroll-area class="fit">
        <div class="q-pa-md text-overline text-grey-6">Main Menu</div>
        <q-list padding class="q-pt-none">
          <q-item to="/" exact clickable v-ripple active-class="active-nav" class="nav-item">
            <q-item-section avatar><q-icon name="dashboard" size="22px" /></q-item-section>
            <q-item-section class="text-weight-medium">Dashboard</q-item-section>
          </q-item>
          
          <template v-if="authStore.user?.role !== 'Employee'">
            <q-item to="/asset" clickable v-ripple active-class="active-nav" class="nav-item">
              <q-item-section avatar><q-icon name="computer" size="22px" /></q-item-section>
              <q-item-section class="text-weight-medium">Asset Inventory</q-item-section>
            </q-item>
            <q-item to="/borrow" clickable v-ripple active-class="active-nav" class="nav-item">
              <q-item-section avatar><q-icon name="swap_horiz" size="22px" /></q-item-section>
              <q-item-section class="text-weight-medium">Borrow / Return</q-item-section>
            </q-item>
            <q-item to="/repair" clickable v-ripple active-class="active-nav" class="nav-item">
              <q-item-section avatar><q-icon name="build" size="22px" /></q-item-section>
              <q-item-section class="text-weight-medium">Repair Hub</q-item-section>
            </q-item>
            
            <div class="q-pa-md text-overline text-grey-6 q-mt-sm">Administration</div>
            
            <q-item to="/purchase" clickable v-ripple active-class="active-nav" class="nav-item">
              <q-item-section avatar><q-icon name="shopping_cart" size="22px" /></q-item-section>
              <q-item-section class="text-weight-medium">Procurement</q-item-section>
            </q-item>
            <q-item to="/employee" clickable v-ripple active-class="active-nav" class="nav-item">
              <q-item-section avatar><q-icon name="people" size="22px" /></q-item-section>
              <q-item-section class="text-weight-medium">Employees</q-item-section>
            </q-item>
            <q-item to="/report" clickable v-ripple active-class="active-nav" class="nav-item">
              <q-item-section avatar><q-icon name="assessment" size="22px" /></q-item-section>
              <q-item-section class="text-weight-medium">Reports</q-item-section>
            </q-item>
            <q-item to="/setting" clickable v-ripple active-class="active-nav" class="nav-item">
              <q-item-section avatar><q-icon name="settings" size="22px" /></q-item-section>
              <q-item-section class="text-weight-medium">Settings</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Spotlight Search -->
    <q-dialog v-model="searchDialog" position="top" transition-show="scale" transition-hide="scale">
      <q-card style="width: 650px; max-width: 90vw; border-radius: 12px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);" class="q-mt-xl shadow-24 clean-card">
        <q-card-section class="q-pa-none">
          <q-input 
            borderless 
            v-model="searchQuery" 
            placeholder="Search assets, employees, or IDs..." 
            autofocus
            class="q-px-md text-h6"
            style="height: 64px;"
          >
            <template v-slot:prepend>
              <q-icon name="search" size="28px" color="primary" />
            </template>
            <template v-slot:append>
              <q-btn v-if="searchQuery" icon="close" flat round dense @click="searchQuery = ''" />
            </template>
          </q-input>
        </q-card-section>
        
        <q-separator v-if="searchQuery" />
        
        <q-card-section class="q-pa-md" style="max-height: 50vh; overflow: auto" v-if="searchQuery">
          <!-- Assets Group -->
          <div v-if="assetResults.length > 0" class="q-mb-md">
            <div class="text-overline text-grey-6 q-mb-sm">Hardware Assets ({{ assetResults.length }})</div>
            <div class="row q-col-gutter-sm">
              <div v-for="res in assetResults" :key="res.id" class="col-12 col-sm-6">
                <div class="q-pa-sm rounded-borders bg-transparent hover-shadow cursor-pointer transition-all flex items-center" style="border: 1px solid #e2e8f0;" @click="handleSearchClick(res.route)">
                  <q-icon name="devices" color="primary" size="20px" class="q-mr-sm" />
                  <div>
                    <div class="text-weight-bold text-dark" style="font-size: 13px;">{{ res.title }}</div>
                    <div class="text-caption text-grey-6">{{ res.subtitle }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Employees Group -->
          <div v-if="employeeResults.length > 0">
            <div class="text-overline text-grey-6 q-mb-sm">Employees ({{ employeeResults.length }})</div>
            <div class="row q-col-gutter-sm">
              <div v-for="res in employeeResults" :key="res.id" class="col-12 col-sm-6">
                <div class="q-pa-sm rounded-borders bg-transparent hover-shadow cursor-pointer transition-all flex items-center" style="border: 1px solid #e2e8f0;" @click="handleSearchClick(res.route)">
                  <q-icon name="person" color="secondary" size="20px" class="q-mr-sm" />
                  <div>
                    <div class="text-weight-bold text-dark" style="font-size: 13px;">{{ res.title }}</div>
                    <div class="text-caption text-grey-6">{{ res.subtitle }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="assetResults.length === 0 && employeeResults.length === 0" class="text-center text-grey-6 q-pa-xl">
            <q-icon name="sentiment_dissatisfied" size="48px" class="q-mb-md opacity-50" />
            <div>No results found for "{{ searchQuery }}"</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-page-container class="bg-transparent">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
    <ChatWidget />
  </q-layout>
  <router-view v-else />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAssetStore } from './stores/assetStore'
import { useTransactionStore } from './stores/transactionStore'
import { useEmployeeStore } from './stores/employeeStore'
import { useSettingStore } from './stores/settingStore'
import { useAuthStore } from './stores/authStore'
import { useNotificationStore } from './stores/notificationStore'
import ChatWidget from './components/ChatWidget.vue'

const drawer = ref(true)
const searchDialog = ref(false)
const searchQuery = ref('')
const router = useRouter()

const assetStore = useAssetStore()
const txStore = useTransactionStore()
const empStore = useEmployeeStore()
const settingStore = useSettingStore()
const authStore = useAuthStore()
const notifStore = useNotificationStore()

const handleLogout = () => {
  notifStore.stopPolling()
  authStore.logout()
  router.push('/login')
}

const handleNetworkReconnect = async () => {
  console.log('Network reconnected! Refreshing data...')
  if (authStore.isAuthenticated) {
    await Promise.all([
      assetStore.fetchAssets(),
      txStore.fetchAllTransactions(),
      empStore.fetchEmployees(),
      settingStore.fetchSettings()
    ])
    // Re-fetch notifications if user is logged in
    if (authStore.user) {
      notifStore.fetchNotifications(authStore.user.username, authStore.user.role)
    }
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    initializeStores()
  }
  window.addEventListener('online', handleNetworkReconnect)
})

watch(() => authStore.isAuthenticated, (newVal) => {
  if (newVal) {
    initializeStores()
  } else {
    notifStore.stopPolling()
  }
})

const initializeStores = async () => {
  await Promise.all([
    assetStore.fetchAssets(),
    txStore.fetchAllTransactions(),
    empStore.fetchEmployees(),
    settingStore.fetchSettings()
  ])
  if (authStore.user) {
    notifStore.startPolling(authStore.user.username, authStore.user.role)
  }
}

onUnmounted(() => {
  notifStore.stopPolling()
  window.removeEventListener('online', handleNetworkReconnect)
})

// --- Notifications Logic ---
const handleNotifClick = (notif: any) => {
  notifStore.markAsRead(notif.id)
  if (notif.link) {
    router.push(notif.link)
  }
}

// --- Global Search Logic ---
const searchResults = computed(() => {
  if (!searchQuery.value) return []
  const q = searchQuery.value.toLowerCase()
  const results: Array<{id: string, title: string, subtitle: string, type: string, route: string}> = []

  // Search Assets
  assetStore.assets.forEach(a => {
    if (a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)) {
      results.push({ id: a.id, title: a.name, subtitle: `${a.id} • ${a.status}`, type: 'Asset', route: '/asset' })
    }
  })

  // Search Employees
  empStore.employees.forEach(e => {
    if (e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)) {
      results.push({ id: e.id, title: e.name, subtitle: e.department, type: 'Employee', route: '/employee' })
    }
  })

  return results
})

const assetResults = computed(() => searchResults.value.filter(r => r.type === 'Asset'))
const employeeResults = computed(() => searchResults.value.filter(r => r.type === 'Employee'))

const handleSearchClick = (route: string) => {
  searchDialog.value = false
  searchQuery.value = ''
  router.push(route)
}

</script>

<style>
.h-full {
  height: 100%;
}
.nav-item {
  border-radius: 8px;
  margin: 2px 12px;
  color: var(--ink-mute);
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(244, 237, 224, 0.4); 
  color: var(--ink);
}

.badge-soft-positive { background: rgba(93, 110, 90, 0.15) !important; color: var(--sage-deep) !important; }
.badge-soft-warning { background: rgba(177, 106, 72, 0.15) !important; color: var(--terracotta-deep) !important; }
.badge-soft-negative { background: rgba(212, 165, 160, 0.15) !important; color: var(--dusk-pink) !important; }
.badge-soft-info { background: rgba(201, 184, 158, 0.15) !important; color: var(--sand-deep) !important; }
.badge-soft-grey { background: rgba(44, 38, 32, 0.05) !important; color: var(--ink-mute) !important; }

.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.q-field--outlined .q-field__control {
  border-radius: 8px;
}
.q-field--filled .q-field__control {
  border-radius: 8px;
  background: #f8fafc;
}
</style>
