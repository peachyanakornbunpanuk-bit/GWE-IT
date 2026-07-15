import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import { useAuthStore } from '../stores/authStore'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../pages/Login.vue') },
  { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/asset', name: 'Asset', component: () => import('../pages/Asset.vue'), meta: { requiresAuth: true, roles: ['Manager', 'IT Officer'] } },
  { path: '/asset/:id/scan', name: 'SmartScan', component: () => import('../pages/SmartScan.vue'), meta: { requiresAuth: true } },
  { path: '/borrow', name: 'Borrow', component: () => import('../pages/Borrow.vue'), meta: { requiresAuth: true, roles: ['Manager', 'IT Officer'] } },
  { path: '/repair', name: 'Repair', component: () => import('../pages/Repair.vue'), meta: { requiresAuth: true, roles: ['Manager', 'IT Officer'] } },
  { path: '/purchase', name: 'Purchase', component: () => import('../pages/Purchase.vue'), meta: { requiresAuth: true, roles: ['Manager', 'IT Officer'] } },
  { path: '/report', name: 'Report', component: () => import('../pages/Report.vue'), meta: { requiresAuth: true, roles: ['Manager', 'IT Officer'] } },
  { path: '/employee', name: 'Employee', component: () => import('../pages/Employee.vue'), meta: { requiresAuth: true, roles: ['Manager', 'IT Officer'] } },
  { path: '/setting', name: 'Setting', component: () => import('../pages/Setting.vue'), meta: { requiresAuth: true, roles: ['Manager', 'IT Officer'] } }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }
  
  if (to.meta.roles && authStore.user) {
    const roles = to.meta.roles as string[]
    if (!roles.includes(authStore.user.role)) {
      // Employee trying to access unauthorized route
      return next('/')
    }
  }
  
  if (to.path === '/login' && authStore.isAuthenticated) {
    return next('/')
  }
  
  next()
})
