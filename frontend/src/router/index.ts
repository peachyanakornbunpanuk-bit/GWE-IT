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
  { path: '/purchase', name: 'Purchase', component: () => import('../pages/Purchase.vue'), meta: { requiresAuth: true, roles: ['Super Admin', 'Warehouse Staff', 'Manager', 'IT Officer'] } },
  { path: '/audit', name: 'MonthlyAudit', component: () => import('../pages/MonthlyAudit.vue'), meta: { requiresAuth: true, roles: ['Super Admin', 'Warehouse Staff', 'Manager', 'IT Officer'] } },
  { path: '/audit-trail', name: 'AuditTrail', component: () => import('../pages/AuditTrail.vue'), meta: { requiresAuth: true, roles: ['Super Admin', 'Manager'] } },
  { path: '/report', name: 'Report', component: () => import('../pages/Report.vue'), meta: { requiresAuth: true, roles: ['Super Admin', 'Warehouse Staff', 'Manager', 'IT Officer'] } },
  { path: '/employee', name: 'Employee', component: () => import('../pages/Employee.vue'), meta: { requiresAuth: true, roles: ['Super Admin', 'Warehouse Staff', 'Manager', 'IT Officer'] } },
  { path: '/setting', name: 'Setting', component: () => import('../pages/Setting.vue'), meta: { requiresAuth: true, roles: ['Super Admin', 'Manager', 'Warehouse Staff', 'IT Officer'] } }
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
    const userRole = authStore.user.role
    
    // Normalize user role
    const isSuperAdmin = userRole === 'Super Admin' || userRole === 'Manager'
    const isWarehouse = userRole === 'Warehouse Staff' || userRole === 'IT Officer' || isSuperAdmin
    
    let hasAccess = false
    if (isSuperAdmin) {
      hasAccess = true
    } else if (isWarehouse && (roles.includes('Warehouse Staff') || roles.includes('IT Officer'))) {
      hasAccess = true
    } else if (roles.includes(userRole)) {
      hasAccess = true
    }
    
    if (!hasAccess) {
      return next('/')
    }
  }
  
  if (to.path === '/login' && authStore.isAuthenticated) {
    return next('/')
  }
  
  next()
})
