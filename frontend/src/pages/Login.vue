<template>
  <q-layout view="hHh Lpr lff">
    <div class="grain"></div>
    <div class="hero-image">
      <div class="hero-veil"></div>
      <div class="hero-beam"></div>
    </div>
    
    <q-header class="bg-transparent text-white" style="position: absolute; z-index: 10; background: linear-gradient(180deg, rgba(30, 22, 16, 0.6) 0%, rgba(30, 22, 16, 0.3) 50%, transparent 100%); padding-bottom: 2rem;">
      <q-toolbar class="q-px-xl q-py-md">
        <q-toolbar-title class="flex items-center">
          <div class="brand-mark q-mr-sm"></div>
          <span style="font-family: 'Fraunces', serif; letter-spacing: 0.01em; font-size: 1.15rem; font-weight: 400;">IAMS</span>
        </q-toolbar-title>
        
        <q-space />
        
        <div class="nav-links gt-sm">
          <a href="#">Asset Tracking</a>
          <a href="#">Inventory</a>
          <a href="#">Maintenance</a>
        </div>
        
        <q-space />
        
        <q-btn 
          outline
          rounded
          class="login-btn-top"
          label="Enter Portal" 
          @click="loginDialog = true"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="row justify-center items-center window-height" style="background: transparent;">
        <div class="hero-content text-center" style="color: #faf5ec; z-index: 5; padding-top: 4rem;">
          <div class="hero-label fade-up">Enterprise Asset Management<span></span>Est. 2024</div>
          <h1 class="hero-title fade-up delay-1">IAMS Enterprise</h1>
          <p class="hero-tag fade-up delay-2">
            Intelligent tracking for complex organizations. One dashboard to manage hardware, software, and maintenance lifecycles seamlessly.
          </p>
          <q-btn 
            unelevated
            rounded
            class="hero-cta fade-up delay-3 q-px-xl q-py-md"
            label="Access System →" 
            @click="loginDialog = true"
          />
        </div>
      </q-page>
    </q-page-container>

    <!-- Login Modal -->
    <q-dialog v-model="loginDialog" transition-show="fade" transition-hide="fade">
      <q-card class="clean-card shadow-10" style="width: 100%; max-width: 420px; border-radius: 8px;">
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
              <template v-slot:prepend><q-icon name="person" /></template>
            </q-input>

            <q-input 
              outlined 
              v-model="password" 
              type="password" 
              label="Password"
              lazy-rules
              :rules="[val => !!val || 'Password is required']"
            >
              <template v-slot:prepend><q-icon name="lock" /></template>
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
    </q-dialog>
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
const loginDialog = ref(false)
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
.hero-image {
  position: fixed; inset: 0;
  z-index: 0;
  background-image: url('/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  animation: hero-breath 20s ease-in-out infinite alternate;
}

@keyframes hero-breath {
  0%   { transform: scale(1.0); }
  100% { transform: scale(1.05); }
}

.hero-veil {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 60%, transparent 0%, rgba(40, 32, 24, 0.45) 70%, rgba(30, 22, 16, 0.8) 100%),
              linear-gradient(180deg, rgba(40, 32, 24, 0.55) 0%, transparent 35%, transparent 65%, rgba(30, 22, 16, 0.65) 100%);
}

.hero-beam {
  position: absolute; inset: 0;
  background: linear-gradient(115deg, transparent 22%, rgba(255, 232, 200, 0.08) 28%, transparent 35%, transparent 52%, rgba(255, 232, 200, 0.05) 60%, transparent 67%);
  mix-blend-mode: screen;
  pointer-events: none;
}

.brand-mark {
  width: 22px; height: 22px;
  position: relative;
  border-radius: 50%;
  border: 1px solid rgba(250, 245, 236, 0.8);
}
.brand-mark::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: var(--terracotta);
  animation: brand-breath 8s ease-in-out infinite;
}
@keyframes brand-breath {
  0%, 100% { transform: scale(0.55); opacity: 0.6; }
  50% { transform: scale(1); opacity: 1; }
}

.nav-links {
  display: flex; gap: 2.2rem;
}
.nav-links a {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(250, 245, 236, 0.95);
  text-decoration: none;
  font-weight: 500;
  transition: color 400ms ease;
  position: relative;
  text-shadow: 0 1px 4px rgba(0,0,0,0.4);
}
.nav-links a::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -6px; height: 1px;
  background: var(--terracotta);
  transform: scaleX(0); transform-origin: left;
  transition: transform 500ms ease;
}
.nav-links a:hover { color: #faf5ec; }
.nav-links a:hover::after { transform: scaleX(1); }

.login-btn-top {
  color: rgba(250, 245, 236, 0.95);
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  border-color: rgba(250, 245, 236, 0.6) !important;
  transition: all 400ms ease;
  text-shadow: 0 1px 4px rgba(0,0,0,0.4);
}
.login-btn-top:hover {
  background: #faf5ec !important;
  color: var(--ink) !important;
}

.hero-content {
  max-width: 900px;
}
.hero-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.36em;
  text-transform: uppercase;
  color: rgba(244, 237, 224, 0.78);
  margin-bottom: 2.5rem;
}
.hero-label span {
  display: inline-block;
  width: 28px; height: 1px;
  background: rgba(244, 237, 224, 0.5);
  vertical-align: middle;
  margin: 0 1rem;
}
.hero-title {
  font-family: 'Fraunces', serif;
  font-weight: 300;
  font-size: clamp(3.5rem, 10vw, 8.5rem);
  line-height: 0.95;
  letter-spacing: -0.025em;
  margin-bottom: 1.5rem;
  color: #faf5ec;
}
.hero-tag {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: clamp(1.05rem, 1.4vw, 1.3rem);
  line-height: 1.65;
  color: rgba(244, 237, 224, 0.85);
  max-width: 580px;
  margin: 0 auto 3rem;
}

.hero-cta {
  background: rgba(244, 237, 224, 0.04) !important;
  border: 1px solid rgba(244, 237, 224, 0.45);
  color: #faf5ec !important;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.22em;
  transition: all 400ms ease;
}
.hero-cta:hover {
  background: #faf5ec !important;
  color: var(--ink) !important;
}

/* Animations */
.fade-up {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeUp 1s cubic-bezier(.22, 1, .36, 1) forwards;
}
.delay-1 { animation-delay: 200ms; }
.delay-2 { animation-delay: 400ms; }
.delay-3 { animation-delay: 600ms; }

@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}
</style>
