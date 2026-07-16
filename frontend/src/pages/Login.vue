<template>
  <q-layout view="hHh Lpr lff">
    <div ref="vantaRef" class="fullscreen" style="z-index: -1;"></div>
    <q-page-container>
      <q-page class="row justify-center items-center window-height" style="background: transparent;">
        <q-card class="clean-card shadow-10" style="width: 100%; max-width: 420px; border-radius: 16px;">
          <q-card-section class="q-pa-xl text-center" style="border-radius: 16px 16px 0 0; background: rgba(5,5,5,0.4);">
            <div class="column justify-center items-center">
              <span style="font-family: 'Syncopate', sans-serif; letter-spacing: 2px; font-size: 1.5rem; font-weight: 800; color: #fff;">GREENWOOD</span>
              <span class="text-primary q-mt-xs" style="letter-spacing: 4px; font-size: 0.7rem; text-transform: uppercase;">Entertainment</span>
            </div>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/authStore'
import * as THREE from 'three'
// @ts-ignore
import NET from 'vanta/dist/vanta.net.min'

const vantaRef = ref(null)
let vantaEffect: any = null

onMounted(() => {
  vantaEffect = NET({
    el: vantaRef.value,
    THREE: THREE,
    color: 0x00F0FF, // Neon Cyan
    backgroundColor: 0x050505, // Deep black
    points: 12.00,
    maxDistance: 20.00,
    spacing: 25.00,
    showDots: true
  })
})

onBeforeUnmount(() => {
  if (vantaEffect) vantaEffect.destroy()
})

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
