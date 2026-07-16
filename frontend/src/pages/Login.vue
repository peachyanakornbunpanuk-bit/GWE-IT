<template>
  <q-layout view="hHh Lpr lff">
    <div class="grain"></div>
    <div class="fullscreen login-bg" style="z-index: -1;"></div>
    <q-page-container>
      <q-page class="row justify-center items-center window-height" style="background: transparent;">
        <q-card class="clean-card shadow-4" style="width: 100%; max-width: 420px; border-radius: 8px;">
          <q-card-section class="q-pa-xl text-center" style="border-radius: 8px 8px 0 0; border-bottom: 1px solid var(--line-soft);">
            <div class="column justify-center items-center">
              <span style="font-family: 'Fraunces', serif; letter-spacing: 0.02em; font-size: 1.7rem; font-weight: 400; color: var(--ink);">IAMS</span>
              <span class="text-primary q-mt-xs" style="font-family: 'Fraunces', serif; font-style: italic; letter-spacing: 0.05em; font-size: 0.9rem;">Enterprise</span>
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

<style scoped>
.login-bg {
  background: radial-gradient(ellipse at 50% 60%, rgba(177, 106, 72, 0.15) 0%, rgba(244, 237, 224, 0.8) 70%, var(--cream) 100%),
              linear-gradient(180deg, rgba(227, 213, 193, 0.45) 0%, var(--cream) 100%);
  animation: login-breath 12s ease-in-out infinite alternate;
}

@keyframes login-breath {
  0%   { background-position: 0% 50%; opacity: 0.8; }
  100% { background-position: 100% 50%; opacity: 1; }
}
</style>
