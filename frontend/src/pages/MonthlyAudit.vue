<template>
  <q-page padding class="q-pa-lg fade-in">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-dark">Monthly Stock Check ("Preventing Loss")</div>
        <div class="text-subtitle1 text-grey-6">Automated warehouse auditing, iPad zone tracking, and loss prevention</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn 
          v-if="!auditStore.hasActiveSession && authStore.isSuperAdmin"
          color="primary" 
          icon="add_task" 
          label="Open Audit Session" 
          unelevated 
          class="q-px-md" 
          style="border-radius: 8px;"
          @click="openSessionDialog = true"
        />
        <q-btn 
          v-if="auditStore.hasActiveSession"
          color="positive" 
          icon="qr_code_scanner" 
          label="Start Shelf Scan" 
          unelevated 
          class="q-px-md" 
          style="border-radius: 8px;"
          @click="showScanner = true"
        />
        <q-btn 
          v-if="auditStore.hasActiveSession && authStore.isSuperAdmin"
          color="negative" 
          icon="lock" 
          label="Close Audit & Flag Lost" 
          unelevated 
          class="q-px-md" 
          style="border-radius: 8px;"
          @click="openCloseConfirm"
        />
      </div>
    </div>

    <!-- Active Session Banner & iPad Progress Tracker -->
    <div v-if="auditStore.currentSession" class="q-mb-lg">
      <q-card class="clean-card shadow-sm q-pa-md bg-white">
        <div class="row items-center justify-between q-mb-md">
          <div class="row items-center">
            <q-avatar icon="fact_check" color="primary" text-color="white" size="44px" class="q-mr-md shadow-1" />
            <div>
              <div class="text-h5 text-weight-bold text-dark flex items-center">
                {{ auditStore.currentSession.title }}
                <q-badge :color="auditStore.currentSession.status === 'Active' ? 'positive' : 'grey-7'" class="q-ml-sm text-weight-bold">
                  {{ auditStore.currentSession.status.toUpperCase() }}
                </q-badge>
              </div>
              <div class="text-caption text-grey-6">
                Audit Period: {{ auditStore.currentSession.month }} • Opened by: {{ auditStore.currentSession.opened_by }} • {{ formatDate(auditStore.currentSession.opened_at) }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-h3 text-weight-bold text-primary">{{ auditStore.stats.percentage }}%</div>
            <div class="text-caption text-grey-6 text-weight-bold">COMPLETION RATE</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <q-linear-progress 
          :value="auditStore.stats.percentage / 100" 
          color="positive" 
          track-color="red-2" 
          size="16px" 
          rounded 
          class="q-mb-md shadow-1" 
        />

        <!-- Stats Counters -->
        <div class="row q-col-gutter-md text-center">
          <div class="col-4">
            <div class="q-pa-sm bg-grey-2 rounded-borders">
              <div class="text-caption text-grey-7 text-weight-bold text-uppercase">Expected in Stock</div>
              <div class="text-h5 text-weight-bold text-dark">{{ auditStore.stats.totalExpected }}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="q-pa-sm bg-green-1 rounded-borders" style="border: 1px solid #bbf7d0;">
              <div class="text-caption text-green-8 text-weight-bold text-uppercase">Verified Scanned</div>
              <div class="text-h5 text-weight-bold text-green-7">{{ auditStore.stats.totalScanned }}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="q-pa-sm bg-red-1 rounded-borders" style="border: 1px solid #fecaca;">
              <div class="text-caption text-red-8 text-weight-bold text-uppercase">Unscanned / Pending</div>
              <div class="text-h5 text-weight-bold text-red-7">{{ auditStore.stats.remaining }}</div>
            </div>
          </div>
        </div>
      </q-card>
    </div>

    <!-- No Active Session Alert -->
    <div v-else-if="!auditStore.loading" class="q-mb-lg">
      <q-card class="clean-card shadow-sm q-pa-xl text-center">
        <q-icon name="playlist_add_check" size="64px" color="grey-5" class="q-mb-md" />
        <div class="text-h5 text-weight-bold text-dark">No Active Audit Session</div>
        <div class="text-subtitle1 text-grey-6 q-mb-lg" style="max-width: 500px; margin-left: auto; margin-right: auto;">
          Open a monthly audit session to freeze the current warehouse inventory balance and begin physical shelf verification.
        </div>
        <q-btn 
          v-if="authStore.isSuperAdmin"
          color="primary" 
          icon="play_arrow" 
          label="Start Monthly Audit Now" 
          unelevated 
          size="md" 
          style="border-radius: 8px;"
          @click="openSessionDialog = true"
        />
      </q-card>
    </div>

    <!-- iPad Zone / Shelf Checklist -->
    <div v-if="auditStore.currentSession">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6 text-dark text-weight-bold flex items-center">
          <q-icon name="shelves" color="primary" class="q-mr-sm" size="24px" />
          Warehouse Zone & Shelf Progress
        </div>
        <div class="row items-center q-gutter-sm">
          <q-input outlined dense v-model="filterZone" placeholder="Filter zone or item..." class="bg-white" style="max-width: 220px;">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-btn-toggle
            v-model="filterStatus"
            toggle-color="primary"
            flat
            dense
            :options="[
              { label: 'All', value: 'all' },
              { label: 'Scanned', value: 'scanned' },
              { label: 'Unscanned', value: 'unscanned' }
            ]"
          />
        </div>
      </div>

      <!-- Zone Accordions / Cards -->
      <div class="row q-col-gutter-md">
        <div v-for="(items, zoneName) in filteredZones" :key="zoneName" class="col-12">
          <q-card class="clean-card shadow-sm">
            <!-- Zone Header -->
            <q-card-section class="bg-grey-2 row items-center justify-between q-py-sm">
              <div class="row items-center">
                <q-icon name="place" color="primary" class="q-mr-sm" size="20px" />
                <span class="text-subtitle1 text-weight-bold text-dark">{{ zoneName }}</span>
                <span class="text-caption text-grey-6 q-ml-sm">({{ items.length }} items)</span>
              </div>
              <div class="row items-center q-gutter-sm">
                <q-badge color="positive">{{ getScannedCount(items) }} Scanned</q-badge>
                <q-badge color="negative">{{ items.length - getScannedCount(items) }} Pending</q-badge>
              </div>
            </q-card-section>

            <!-- Items Grid inside Zone -->
            <q-card-section class="q-pa-md">
              <div class="row q-col-gutter-sm">
                <div v-for="item in items" :key="item.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
                  <!-- Visual Green / Red Status Card -->
                  <div 
                    class="q-pa-sm rounded-borders transition-all audit-item-card"
                    :class="item.is_scanned === 1 ? 'audit-scanned' : 'audit-unscanned'"
                  >
                    <div class="row items-center justify-between no-wrap">
                      <div class="ellipsis">
                        <div class="text-weight-bold text-caption ellipsis">{{ item.asset_id }}</div>
                        <div class="text-body2 text-weight-medium ellipsis text-dark" style="line-height: 1.2;">{{ item.asset_name }}</div>
                        <div class="text-caption text-grey-6">{{ item.category }}</div>
                      </div>

                      <div class="column items-end">
                        <!-- Scanned (Green) or Unscanned (Red) Badge -->
                        <q-badge 
                          :color="item.is_scanned === 1 ? 'positive' : 'negative'" 
                          class="q-px-sm text-weight-bold"
                        >
                          <q-icon :name="item.is_scanned === 1 ? 'check' : 'close'" size="12px" class="q-mr-xs" />
                          {{ item.is_scanned === 1 ? 'SCANNED' : 'PENDING' }}
                        </q-badge>

                        <!-- Manual verify button if not scanned -->
                        <q-btn 
                          v-if="item.is_scanned === 0 && auditStore.currentSession?.status === 'Active'" 
                          size="xs" 
                          flat 
                          color="primary" 
                          label="Verify Now" 
                          class="q-mt-xs"
                          @click="verifyItemManually(item.asset_id)" 
                        />
                      </div>
                    </div>

                    <!-- Scanned metadata footer -->
                    <div v-if="item.is_scanned === 1" class="text-caption text-green-9 q-mt-xs text-italic row items-center" style="font-size: 11px;">
                      <q-icon name="verified" size="13px" class="q-mr-xs text-positive" />
                      Scanned by {{ item.scanned_by || 'Staff' }} at {{ formatTime(item.scanned_at) }}
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Audit Session History Table -->
    <div class="q-mt-xl">
      <div class="text-h6 text-dark text-weight-bold q-mb-md flex items-center">
        <q-icon name="history" color="grey-7" class="q-mr-sm" size="24px" />
        Audit Session History & Discrepancy Archives
      </div>

      <q-card class="clean-card shadow-sm">
        <q-table
          flat
          class="bg-transparent"
          :rows="auditStore.sessions"
          :columns="sessionColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 5 }"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props" align="center">
              <q-badge :color="props.row.status === 'Active' ? 'positive' : 'grey-7'" class="text-weight-bold">
                {{ props.row.status }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-total_missing="props">
            <q-td :props="props" align="center">
              <q-badge v-if="props.row.total_missing > 0" color="negative" class="text-weight-bold">
                {{ props.row.total_missing }} Lost Items
              </q-badge>
              <q-badge v-else color="positive">0 Missing</q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" align="right">
              <q-btn size="sm" outline color="primary" label="View Discrepancy" @click="viewDiscrepancy(props.row.id)" style="border-radius: 6px;" class="q-mr-xs" />
              <q-btn size="sm" flat color="grey-8" label="Load Session" @click="auditStore.fetchSessionDetails(props.row.id)" />
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Open Session Dialog -->
    <q-dialog v-model="openSessionDialog">
      <q-card style="width: 450px; max-width: 90vw;" class="clean-card q-pa-md">
        <q-card-section>
          <div class="text-h6 text-dark text-weight-bold">Open Monthly Stock Audit Session</div>
          <div class="text-caption text-grey-6">
            This will take an immutable snapshot of all assets currently registered as available.
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleOpenSession" class="q-gutter-md">
            <q-input outlined v-model="sessionForm.title" label="Session Title *" required dense />
            <q-input outlined v-model="sessionForm.month" type="text" mask="####-##" placeholder="YYYY-MM" label="Audit Month (YYYY-MM) *" required dense />
            <q-input outlined v-model="sessionForm.notes" type="textarea" label="Notes / Instructions" rows="2" dense />
            <div class="row justify-end q-gutter-sm q-mt-lg">
              <q-btn flat label="Cancel" color="grey-7" v-close-popup />
              <q-btn color="primary" label="Freeze Stock & Open" type="submit" unelevated style="border-radius: 6px;" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Close Audit Confirmation Dialog -->
    <q-dialog v-model="closeConfirmDialog">
      <q-card style="width: 480px; max-width: 90vw; border: 2px solid #ef4444;" class="clean-card q-pa-md bg-red-1">
        <q-card-section>
          <div class="text-h6 text-red-10 text-weight-bold flex items-center">
            <q-icon name="warning" color="negative" class="q-mr-sm" size="28px" />
            Close Audit Session & Flag Lost Items
          </div>
          <p class="text-body2 text-red-9 q-mt-md">
            There are currently <strong>{{ auditStore.stats.remaining }} unscanned item(s)</strong>.
            Closing this session will:
          </p>
          <ul class="text-caption text-red-10">
            <li>Automatically change the status of all {{ auditStore.stats.remaining }} unscanned items to <strong>"Lost"</strong>.</li>
            <li>Tag them with month <strong>"Lost in Audit {{ auditStore.currentSession?.month }}"</strong>.</li>
            <li>Finalize the Discrepancy Reconciliation Report.</li>
          </ul>
        </q-card-section>
        <q-card-actions align="right" class="q-pt-none">
          <q-btn flat label="Keep Scanning" color="grey-8" v-close-popup />
          <q-btn color="negative" label="Close Audit & Mark Lost" unelevated :loading="closingSession" @click="handleCloseSession" style="border-radius: 6px;" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Discrepancy Report Modal -->
    <q-dialog v-model="discrepancyDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1 column" id="discrepancy-report-print">
        <!-- Top bar -->
        <div class="row items-center justify-between q-pa-md bg-white shadow-2">
          <div class="row items-center">
            <q-btn icon="arrow_back" flat round dense v-close-popup class="q-mr-sm" />
            <div>
              <div class="text-h6 text-weight-bold text-dark">Discrepancy Audit Report</div>
              <div class="text-caption text-grey-6">{{ discrepancyData?.session?.title }} ({{ discrepancyData?.session?.month }})</div>
            </div>
          </div>
          <div class="row q-gutter-sm">
            <q-btn color="positive" icon="table_view" label="Export Excel" unelevated @click="exportDiscrepancyExcel" style="border-radius: 6px;" />
            <q-btn color="negative" icon="picture_as_pdf" label="Export PDF" unelevated @click="exportDiscrepancyPDF" style="border-radius: 6px;" />
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </div>

        <div class="col q-pa-lg custom-scroll overflow-auto">
          <!-- Summary Cards -->
          <div class="row q-col-gutter-md q-mb-lg" v-if="discrepancyData">
            <div class="col-12 col-sm-3">
              <q-card class="clean-card q-pa-md text-center">
                <div class="text-caption text-grey-6 text-uppercase text-weight-bold">Expected Balance</div>
                <div class="text-h4 text-weight-bold text-dark">{{ discrepancyData.summary?.totalExpected }}</div>
              </q-card>
            </div>
            <div class="col-12 col-sm-3">
              <q-card class="clean-card q-pa-md text-center bg-green-1">
                <div class="text-caption text-green-8 text-uppercase text-weight-bold">Reconciled (Found)</div>
                <div class="text-h4 text-weight-bold text-green-7">{{ discrepancyData.summary?.totalScanned }}</div>
              </q-card>
            </div>
            <div class="col-12 col-sm-3">
              <q-card class="clean-card q-pa-md text-center bg-red-1">
                <div class="text-caption text-red-8 text-uppercase text-weight-bold">Missing (Marked Lost)</div>
                <div class="text-h4 text-weight-bold text-red-7">{{ discrepancyData.summary?.totalMissing }}</div>
              </q-card>
            </div>
            <div class="col-12 col-sm-3">
              <q-card class="clean-card q-pa-md text-center bg-blue-1">
                <div class="text-caption text-blue-8 text-uppercase text-weight-bold">Excess (Unexpected)</div>
                <div class="text-h4 text-weight-bold text-blue-7">{{ discrepancyData.summary?.totalUnexpected }}</div>
              </q-card>
            </div>
          </div>

          <!-- Missing Items Table -->
          <div class="q-mb-xl">
            <div class="text-h6 text-red-9 text-weight-bold q-mb-sm flex items-center">
              <q-icon name="error" color="negative" class="q-mr-sm" size="24px" />
              Missing Items - Automatically Flagged as "Lost" ({{ discrepancyData?.missing?.length || 0 }})
            </div>
            <q-card class="clean-card">
              <q-table
                flat
                class="bg-transparent"
                :rows="discrepancyData?.missing || []"
                :columns="missingColumns"
                row-key="id"
                :pagination="{ rowsPerPage: 10 }"
              >
                <template v-slot:body-cell-status="props">
                  <q-td :props="props">
                    <q-badge color="negative">LOST</q-badge>
                  </q-td>
                </template>
              </q-table>
            </q-card>
          </div>

          <!-- Found Items Table -->
          <div>
            <div class="text-h6 text-green-9 text-weight-bold q-mb-sm flex items-center">
              <q-icon name="check_circle" color="positive" class="q-mr-sm" size="24px" />
              Successfully Verified Assets ({{ discrepancyData?.found?.length || 0 }})
            </div>
            <q-card class="clean-card">
              <q-table
                flat
                class="bg-transparent"
                :rows="discrepancyData?.found || []"
                :columns="foundColumns"
                row-key="id"
                :pagination="{ rowsPerPage: 10 }"
              />
            </q-card>
          </div>
        </div>
      </q-card>
    </q-dialog>

    <!-- Smart Scanner Modal for High-Speed Batch Audit Scanning -->
    <SmartScannerModal 
      v-model="showScanner" 
      mode="continuous" 
      @scan="handleAuditScan"
    />

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuditStore, AuditSnapshot } from '../stores/auditStore'
import { useAuthStore } from '../stores/authStore'
import { useQuasar } from 'quasar'
import SmartScannerModal from '../components/SmartScannerModal.vue'
import * as XLSX from 'xlsx'
import html2pdf from 'html2pdf.js'

const $q = useQuasar()
const auditStore = useAuditStore()
const authStore = useAuthStore()

const showScanner = ref(false)
const openSessionDialog = ref(false)
const closeConfirmDialog = ref(false)
const discrepancyDialog = ref(false)
const closingSession = ref(false)
const discrepancyData = ref<any>(null)

const filterZone = ref('')
const filterStatus = ref<'all' | 'scanned' | 'unscanned'>('all')

const currentMonthStr = new Date().toISOString().slice(0, 7)
const sessionForm = ref({
  title: `Monthly Audit - ${currentMonthStr}`,
  month: currentMonthStr,
  notes: ''
})

onMounted(async () => {
  await auditStore.fetchSessions()
  if (auditStore.activeSession) {
    await auditStore.fetchSessionDetails(auditStore.activeSession.id)
  }
})

const filteredZones = computed(() => {
  const result: Record<string, AuditSnapshot[]> = {}
  const q = filterZone.value.toLowerCase()

  for (const [zone, items] of Object.entries(auditStore.zones)) {
    let list = items

    // Filter by scanned / unscanned
    if (filterStatus.value === 'scanned') {
      list = list.filter(i => i.is_scanned === 1)
    } else if (filterStatus.value === 'unscanned') {
      list = list.filter(i => i.is_scanned === 0)
    }

    // Filter by text
    if (q) {
      list = list.filter(i => 
        zone.toLowerCase().includes(q) || 
        i.asset_id.toLowerCase().includes(q) || 
        i.asset_name.toLowerCase().includes(q)
      )
    }

    if (list.length > 0) {
      result[zone] = list
    }
  }
  return result
})

const getScannedCount = (items: AuditSnapshot[]) => items.filter(i => i.is_scanned === 1).length

const handleOpenSession = async () => {
  try {
    await auditStore.openSession(sessionForm.value.title, sessionForm.value.month, sessionForm.value.notes)
    $q.notify({ type: 'positive', message: 'Audit session started! Current balance frozen.', position: 'top' })
    openSessionDialog.value = false
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to start audit session', position: 'top' })
  }
}

const handleAuditScan = async (code: string) => {
  if (!auditStore.currentSession) return
  try {
    const res = await auditStore.scanAsset(auditStore.currentSession.id, code)
    if (res.isUnexpected) {
      $q.notify({ type: 'warning', message: `Excess item recorded: ${code}`, position: 'top' })
    } else {
      $q.notify({ type: 'positive', message: `Verified: ${code}`, position: 'top' })
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: `Scan error on ${code}`, position: 'top' })
  }
}

const verifyItemManually = async (assetId: string) => {
  if (!auditStore.currentSession) return
  try {
    await auditStore.scanAsset(auditStore.currentSession.id, assetId)
    $q.notify({ type: 'positive', message: `Verified ${assetId}`, position: 'top' })
  } catch (err) {
    $q.notify({ type: 'negative', message: `Failed to verify ${assetId}`, position: 'top' })
  }
}

const openCloseConfirm = () => {
  closeConfirmDialog.value = true
}

const handleCloseSession = async () => {
  if (!auditStore.currentSession) return
  closingSession.value = true
  try {
    const res = await auditStore.closeSession(auditStore.currentSession.id)
    $q.notify({
      type: res.total_missing > 0 ? 'warning' : 'positive',
      message: `Audit closed! ${res.total_missing} missing items tagged as LOST.`,
      position: 'top'
    })
    closeConfirmDialog.value = false
    await viewDiscrepancy(auditStore.currentSession.id)
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to close audit session', position: 'top' })
  } finally {
    closingSession.value = false
  }
}

const viewDiscrepancy = async (sessionId: number) => {
  const data = await auditStore.fetchDiscrepancy(sessionId)
  discrepancyData.value = data
  discrepancyDialog.value = true
}

const exportDiscrepancyExcel = () => {
  if (!discrepancyData.value) return
  const missing = (discrepancyData.value.missing || []).map((m: any) => ({
    'Asset ID': m.asset_id,
    'Asset Name': m.asset_name,
    'Category': m.category,
    'Expected Location': m.location,
    'Final Status': 'LOST'
  }))
  const found = (discrepancyData.value.found || []).map((f: any) => ({
    'Asset ID': f.asset_id,
    'Asset Name': f.asset_name,
    'Category': f.category,
    'Location': f.location,
    'Scanned By': f.scanned_by,
    'Scanned Time': f.scanned_at
  }))

  const wb = XLSX.utils.book_new()
  const wsMissing = XLSX.utils.json_to_sheet(missing)
  const wsFound = XLSX.utils.json_to_sheet(found)

  XLSX.utils.book_append_sheet(wb, wsMissing, "Missing_Lost_Items")
  XLSX.utils.book_append_sheet(wb, wsFound, "Reconciled_Found_Items")

  XLSX.writeFile(wb, `Audit_Discrepancy_${discrepancyData.value.session.month}.xlsx`)
}

const exportDiscrepancyPDF = () => {
  const element = document.getElementById('discrepancy-report-print')
  if (!element) return

  $q.loading.show({ message: 'Generating Discrepancy PDF...' })
  html2pdf().from(element).set({
    margin: [10, 10],
    filename: `Audit_Discrepancy_${discrepancyData.value?.session?.month}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save().then(() => {
    $q.loading.hide()
  })
}

const formatDate = (ts: string) => ts ? new Date(ts).toLocaleDateString() : '-'
const formatTime = (ts?: string) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'

const sessionColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'title', label: 'Session Title', field: 'title', align: 'left', sortable: true },
  { name: 'month', label: 'Period', field: 'month', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'total_missing', label: 'Discrepancy (Lost)', field: 'total_missing', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' }
] as any

const missingColumns = [
  { name: 'asset_id', label: 'Asset ID', field: 'asset_id', align: 'left', sortable: true },
  { name: 'asset_name', label: 'Name', field: 'asset_name', align: 'left' },
  { name: 'category', label: 'Category', field: 'category', align: 'left' },
  { name: 'location', label: 'Expected Shelf / Zone', field: 'location', align: 'left' },
  { name: 'status', label: 'Status', field: 'expected_status', align: 'center' }
] as any

const foundColumns = [
  { name: 'asset_id', label: 'Asset ID', field: 'asset_id', align: 'left', sortable: true },
  { name: 'asset_name', label: 'Name', field: 'asset_name', align: 'left' },
  { name: 'location', label: 'Zone / Location', field: 'location', align: 'left' },
  { name: 'scanned_by', label: 'Verified By', field: 'scanned_by', align: 'left' },
  { name: 'scanned_at', label: 'Time', field: 'scanned_at', align: 'left' }
] as any
</script>

<style scoped>
.audit-item-card {
  border-radius: 8px;
  border-width: 1.5px;
  border-style: solid;
}
.audit-scanned {
  background-color: #f0fdf4;
  border-color: #86efac;
}
.audit-unscanned {
  background-color: #fef2f2;
  border-color: #fca5a5;
}
</style>
