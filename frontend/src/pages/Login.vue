<template>
  <q-layout view="hHh Lpr lff" class="bg-blue-grey-1">
    <q-page-container>
      <q-page class="row justify-center items-center window-height">
        <q-card class="shadow-3" style="width: 100%; max-width: 400px; border-radius: 12px;">
          <q-card-section class="bg-primary text-white q-pa-lg text-center" style="border-radius: 12px 12px 0 0;">
            <div class="text-h5 text-weight-bold">IAMS Enterprise</div>
            <div class="text-subtitle2 q-mt-sm">IT Asset Management System</div>
          </q-card-section>
          
          <q-card-section class="q-pa-lg">
            <q-form @submit="handleLogin" class="q-gutter-md">
              <q-input 
                outlined 
                v-model="username" 
                label="Username" 
                lazy-rules
                :rules="[val => !!val || 'Username is required']"
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>

              <q-input 
                outlined 
                v-model="password" 
                type="password" 
                label="Password"
                lazy-rules
                :rules="[val => !!val || 'Password is required']"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <div class="q-mt-xl">
                <q-btn 
                  type="submit"
                  color="primary" 
                  class="full-width text-weight-bold" 
                  size="lg"
                  unelevated 
                  label="Secure Login"
                  style="border-radius: 8px"
                  :loading="loading"
                />
              </div>
            </q-form>
          </q-card-section>
          
          <q-card-section class="text-center text-grey-6 q-pt-none q-pb-lg">
            <small>Default accounts: manager/admin, it/admin, user/user</small>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/authStore'

const username = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const authStore = useAuthStore()

const handleLogin = async () => {
  loading.value = true
  
  const success = await authStore.login(username.value, password.value)
  
  if (success) {
    $q.notify({ color: 'positive', message: `Welcome back, ${authStore.user?.role}!`, position: 'top' })
    const redirectPath = route.query.redirect as string || '/'
    router.push(redirectPath)
  } else {
    $q.notify({ color: 'negative', message: 'Invalid username or password', position: 'top' })
  }
  
  loading.value = false
}
</script>
