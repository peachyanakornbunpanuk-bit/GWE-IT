<template>
  <q-page padding class="q-pa-lg fade-in">
    <div class="row justify-between items-center q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-dark">Employee Management</div>
        <div class="text-subtitle1 text-grey-6">Manage staff and departments</div>
      </div>
      <q-btn color="primary" icon="add" label="Add Employee" @click="openDialog" unelevated class="q-px-md q-py-sm" style="border-radius: 8px" />
    </div>

    <q-card class="clean-card">
      <q-table
        flat class="bg-transparent"
        :rows="store.employees"
        :columns="columns"
        row-key="id"
        :grid="$q.screen.lt.md"
      >
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" align="right">
            <q-btn flat round dense color="negative" icon="delete" @click="confirmDelete(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialog">
      <q-card style="min-width: 400px" class="clean-card">
        <q-card-section>
          <div class="text-h6 text-dark text-weight-bold">Add Employee</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input outlined v-model="form.name" label="Name *" required />
            <q-select outlined v-model="form.department" :options="settingStore.departments" label="Department *" required />
            <q-input outlined v-model="form.email" label="Email" type="email" />
            <div class="row justify-end q-mt-xl">
              <q-btn label="Cancel" color="grey-7" flat v-close-popup class="q-mr-sm" />
              <q-btn label="Save Employee" type="submit" color="primary" unelevated style="border-radius: 8px" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useEmployeeStore } from '../stores/employeeStore'
import { useSettingStore } from '../stores/settingStore'

const $q = useQuasar()
const store = useEmployeeStore()
const settingStore = useSettingStore()
const dialog = ref(false)
const form = ref({ name: '', department: '', email: '' })

onMounted(() => store.fetchEmployees())

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'department', label: 'Department', field: 'department', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' }
] as any

const openDialog = () => {
  form.value = { name: '', department: '', email: '' }
  dialog.value = true
}

const onSubmit = () => {
  store.addEmployee(form.value)
  $q.notify({ color: 'positive', message: 'Employee added', position: 'top-right' })
  dialog.value = false
}

const confirmDelete = (emp: any) => {
  $q.dialog({ title: 'Confirm', message: 'Delete this employee?', cancel: true }).onOk(() => {
    store.deleteEmployee(emp.id)
  })
}
</script
