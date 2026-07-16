<template>
  <q-page padding class="q-pa-lg fade-in">
    <div class="row justify-between items-center q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-dark">Reports & Exports</div>
        <div class="text-subtitle1 text-grey-6">Download your data in Excel and PDF formats</div>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-6">
        <q-card class="clean-card">
          <q-card-section>
            <div class="text-h6 text-dark text-weight-bold flex items-center">
              <q-icon name="inventory" class="q-mr-sm text-primary" size="24px" /> Asset Inventory Report
            </div>
            <p class="text-grey-7 q-mt-sm">Export a complete list of all assets, their categories, values, and current status.</p>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md pt-none">
            <q-btn color="positive" icon="table_view" label="Export Excel" unelevated @click="exportAssetsExcel" style="border-radius: 8px; font-weight: 600" />
            <q-btn color="negative" icon="picture_as_pdf" label="Export PDF" unelevated @click="exportAssetsPDF" class="q-ml-sm" style="border-radius: 8px; font-weight: 600" />
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card class="clean-card">
          <q-card-section>
            <div class="text-h6 text-dark text-weight-bold flex items-center">
              <q-icon name="swap_horiz" class="q-mr-sm text-primary" size="24px" /> Borrow History Report
            </div>
            <p class="text-grey-7 q-mt-sm">Export a comprehensive log of all hardware checkouts and returns.</p>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md pt-none">
            <q-btn color="positive" icon="table_view" label="Export Excel" unelevated @click="exportBorrowsExcel" style="border-radius: 8px; font-weight: 600" />
            <q-btn color="negative" icon="picture_as_pdf" label="Export PDF" unelevated @click="exportBorrowsPDF" class="q-ml-sm" style="border-radius: 8px; font-weight: 600" />
          </q-card-actions>
        </q-card>
      </div>
      
      <div class="col-12 col-md-12">
        <q-card class="clean-card">
          <q-card-section>
            <div class="text-h6 text-dark text-weight-bold flex items-center">
              <q-icon name="fact_check" class="q-mr-sm text-primary" size="24px" /> Stock Checklist
            </div>
            <p class="text-grey-7 q-mt-sm">Export a printable checklist grouped by category for warehouse auditing, including blank spaces for count and condition notes.</p>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md pt-none">
            <q-btn color="negative" icon="picture_as_pdf" label="Export Checklist PDF" unelevated @click="exportChecklistPDF" style="border-radius: 8px; font-weight: 600" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAssetStore } from '../stores/assetStore'
import { useTransactionStore } from '../stores/transactionStore'
import * as XLSX from 'xlsx'
import html2pdf from 'html2pdf.js'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const assetStore = useAssetStore()
const txStore = useTransactionStore()

onMounted(() => {
  assetStore.fetchAssets()
  txStore.fetchAllTransactions()
})

const exportAssetsExcel = () => {
  const ws = XLSX.utils.json_to_sheet(assetStore.assets)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Assets")
  XLSX.writeFile(wb, "IAMS_Asset_Report.xlsx")
}

const exportAssetsPDF = () => {
  const element = document.createElement('div')
  element.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h2 style="color: #263238; border-bottom: 2px solid #1976D2; padding-bottom: 10px;">IAMS Asset Inventory Report</h2>
      <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; font-size: 14px;">
        <thead style="display: table-header-group;">
          <tr style="background-color: #f5f7fa; color: #37474f; text-align: left; page-break-inside: avoid; page-break-after: auto;">
            <th style="padding: 12px; border: 1px solid #cfd8dc;">ID</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Name</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Category</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Status</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Holder</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Value (THB)</th>
          </tr>
        </thead>
        <tbody>
          ${assetStore.assets.map(a => `
            <tr style="page-break-inside: avoid; page-break-after: auto;">
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${a.id}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${a.name}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${a.category}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${a.status}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${a.holder}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${a.value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
  
  html2pdf().from(element).set({
    margin: [15, 10],
    filename: 'IAMS_Asset_Report.pdf',
    // @ts-ignore
    pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' },
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save().then(() => {
    $q.loading.hide()
  })
}

const exportBorrowsExcel = () => {
  const ws = XLSX.utils.json_to_sheet(txStore.borrows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Borrows")
  XLSX.writeFile(wb, "IAMS_Borrow_Report.xlsx")
}

const exportBorrowsPDF = () => {
  const element = document.createElement('div')
  element.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h2 style="color: #263238; border-bottom: 2px solid #C10015; padding-bottom: 10px;">IAMS Borrow History Report</h2>
      <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; font-size: 14px;">
        <thead style="display: table-header-group;">
          <tr style="background-color: #f5f7fa; color: #37474f; text-align: left; page-break-inside: avoid; page-break-after: auto;">
            <th style="padding: 12px; border: 1px solid #cfd8dc;">ID</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Asset ID</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Employee ID</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Borrow Date</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Return Date</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${txStore.borrows.map(b => `
            <tr style="page-break-inside: avoid; page-break-after: auto;">
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${b.id}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${b.asset_id}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${b.employee_id}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${b.borrow_date}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${b.return_date || '-'}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${b.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
  
  html2pdf().from(element).set({
    margin: [15, 10],
    filename: 'IAMS_Borrow_Report.pdf',
    // @ts-ignore
    pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' },
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save().then(() => {
    $q.loading.hide()
  })
}

const exportChecklistPDF = () => {
  $q.loading.show({ message: 'Generating PDF...' })
  
  // Group assets by category
  const grouped = assetStore.assets.reduce((acc: any, asset) => {
    if (!acc[asset.category]) acc[asset.category] = []
    acc[asset.category].push(asset)
    return acc
  }, {})

  let htmlContent = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h2 style="color: #263238; border-bottom: 2px solid #21BA45; padding-bottom: 10px;"> Stock Checklist</h2>
  `

  for (const [category, items] of Object.entries(grouped)) {
    htmlContent += `
      <div class="category-block" style="page-break-inside: avoid; margin-bottom: 40px;">
        <h3 style="color: #37474f; margin-top: 10px; margin-bottom: 15px;">📂 ${category}</h3>
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 14px;">
          <thead style="display: table-header-group;">
            <tr style="background-color: #f5f7fa; color: #37474f; text-align: left; page-break-inside: avoid; page-break-after: auto;">
              <th style="padding: 12px; border: 1px solid #cfd8dc; width: 15%">ID</th>
              <th style="padding: 12px; border: 1px solid #cfd8dc; width: 35%">Name</th>
              <th style="padding: 12px; border: 1px solid #cfd8dc; width: 25%">Quantity</th>
              <th style="padding: 12px; border: 1px solid #cfd8dc; width: 25%">Notes / Condition</th>
            </tr>
          </thead>
          <tbody>
            ${(items as any[]).map(a => `
              <tr style="page-break-inside: avoid; page-break-after: auto;">
                <td style="padding: 10px; border: 1px solid #cfd8dc;">${a.id}</td>
                <td style="padding: 10px; border: 1px solid #cfd8dc;">${a.name}</td>
                <td style="padding: 10px; border: 1px solid #cfd8dc;"></td>
                <td style="padding: 10px; border: 1px solid #cfd8dc;"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }
  
  htmlContent += `</div>`

  const element = document.createElement('div')
  element.innerHTML = htmlContent

  html2pdf().from(element).set({
    margin: [15, 10],
    filename: 'GWE_Stock_Checklist.pdf',
    // @ts-ignore
    pagebreak: { mode: ['css', 'legacy'], avoid: ['.category-block', 'tr'] },
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save().then(() => {
    $q.loading.hide()
  })
}
</script>
