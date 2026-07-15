<template>
  <q-page padding class="q-pa-lg fade-in">
    <div class="row justify-between items-center q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-blue-grey-9">System Settings</div>
        <div class="text-subtitle1 text-grey-6">Manage global application configurations</div>
      </div>
    </div>

    <q-card class="clean-card shadow-sm">
      <q-tabs
        v-model="tab"
        dense
        class="text-grey-7 bg-grey-1"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="categories" label="Asset Categories" class="text-weight-bold q-px-md" />
        <q-tab name="suppliers" label="Vendors & Suppliers" class="text-weight-bold q-px-md" />
        <q-tab name="departments" label="Company Departments" class="text-weight-bold q-px-md" />
        <q-tab name="locations" label="Physical Locations" class="text-weight-bold q-px-md" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated class="bg-white text-blue-grey-9">
        
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

        <!-- Locations Tab -->
        <q-tab-panel name="locations" class="q-pa-lg">
          <div class="text-h6 text-weight-bold q-mb-md">Manage Physical Locations</div>
          
          <div class="row q-col-gutter-md q-mb-lg" style="max-width: 500px">
            <div class="col-8">
              <q-input outlined dense v-model="newLocation" placeholder="e.g. Server Room A" @keyup.enter="addSetting('location', newLocation)" />
            </div>
            <div class="col-4">
              <q-btn color="primary" icon="add" label="Add" unelevated class="full-width h-full" @click="addSetting('location', newLocation)" />
            </div>
          </div>

          <q-list bordered separator style="max-width: 500px; border-radius: 8px">
            <q-item v-for="loc in settingStore.rawLocations" :key="loc.id">
              <q-item-section class="text-weight-medium">{{ loc.value }}</q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn icon="edit" flat round dense color="primary" size="sm" @click="editSettingPrompt(loc)" />
                  <q-btn icon="delete" flat round dense color="negative" size="sm" @click="deleteSetting(loc.id)" />
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="settingStore.rawLocations.length === 0">
              <q-item-section class="text-grey-6 text-italic">No locations configured.</q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>
        
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useSettingStore } from '../stores/settingStore'

const $q = useQuasar()
const settingStore = useSettingStore()

const tab = ref('categories')

const newCategory = ref('')
const newSupplier = ref('')
const newDepartment = ref('')
const newLocation = ref('')

const addSetting = async (type: string, value: string) => {
  if (!value.trim()) return
  
  try {
    await settingStore.addSetting(type, value.trim())
    
    // Clear inputs
    if (type === 'category') newCategory.value = ''
    if (type === 'supplier') newSupplier.value = ''
    if (type === 'department') newDepartment.value = ''
    if (type === 'location') newLocation.value = ''
    $q.notify({ color: 'positive', message: 'Setting added successfully', position: 'top-right' })
  } catch (err) {
    console.error('Failed to add setting:', err)
    $q.notify({ color: 'negative', message: 'Failed to add setting' })
  }
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
