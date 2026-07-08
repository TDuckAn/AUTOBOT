/* eslint-disable react-refresh/only-export-components -- entry module: defines lazy route components; not subject to Fast Refresh */
import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import './styles/design-system.css'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { Login } from './pages/Login.jsx'

// Route pages are code-split so each role only downloads the screens it uses
// (the Recharts-heavy admin dashboard no longer loads for staff/customers).
const StaffQueue = lazy(() => import('./pages/staff/StaffQueue.jsx').then((m) => ({ default: m.StaffQueue })))
const StaffWalkin = lazy(() => import('./pages/staff/StaffWalkin.jsx').then((m) => ({ default: m.StaffWalkin })))
const StaffHistory = lazy(() => import('./pages/staff/StaffHistory.jsx').then((m) => ({ default: m.StaffHistory })))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx').then((m) => ({ default: m.AdminDashboard })))
const AdminServices = lazy(() => import('./pages/admin/AdminServices.jsx').then((m) => ({ default: m.AdminServices })))
const AdminPromotions = lazy(() => import('./pages/admin/AdminPromotions.jsx').then((m) => ({ default: m.AdminPromotions })))
const AdminTiers = lazy(() => import('./pages/admin/AdminTiers.jsx').then((m) => ({ default: m.AdminTiers })))
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers.jsx').then((m) => ({ default: m.AdminCustomers })))
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard.jsx').then((m) => ({ default: m.CustomerDashboard })))
const CustomerBookings = lazy(() => import('./pages/customer/CustomerBookings.jsx').then((m) => ({ default: m.CustomerBookings })))
const CustomerPromotions = lazy(() => import('./pages/customer/CustomerPromotions.jsx').then((m) => ({ default: m.CustomerPromotions })))
const CustomerVehicles = lazy(() => import('./pages/customer/CustomerVehicles.jsx').then((m) => ({ default: m.CustomerVehicles })))
const CustomerRewards = lazy(() => import('./pages/customer/CustomerRewards.jsx').then((m) => ({ default: m.CustomerRewards })))

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--ink-400, #8a8f98)', fontSize: 14 }}>
    Đang tải…
  </div>
)

const guarded = (role, node) => (
  <ProtectedRoute role={role}>
    <Suspense fallback={<PageLoader />}>{node}</Suspense>
  </ProtectedRoute>
)

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },

  // ── Staff (role = 'Staff') ──────────────────────────────
  { path: '/staff/queue', element: guarded('Staff', <StaffQueue />) },
  { path: '/staff/walkin', element: guarded('Staff', <StaffWalkin />) },
  { path: '/staff/history', element: guarded('Staff', <StaffHistory />) },
  { path: '/staff/list', element: <Navigate to="/staff/history" replace /> },

  // ── Admin (role = 'Admin') ──────────────────────────────
  { path: '/admin/dashboard', element: guarded('Admin', <AdminDashboard />) },
  { path: '/admin/services', element: guarded('Admin', <AdminServices />) },
  { path: '/admin/promotions', element: guarded('Admin', <AdminPromotions />) },
  { path: '/admin/tiers', element: guarded('Admin', <AdminTiers />) },
  { path: '/admin/customers', element: guarded('Admin', <AdminCustomers />) },

  // ── Customer (role = 'Customer') ────────────────────────
  { path: '/customer/dashboard', element: guarded('Customer', <CustomerDashboard />) },
  { path: '/customer/bookings', element: guarded('Customer', <CustomerBookings />) },
  { path: '/customer/promotions', element: guarded('Customer', <CustomerPromotions />) },
  { path: '/customer/vehicles', element: guarded('Customer', <CustomerVehicles />) },
  { path: '/customer/rewards', element: guarded('Customer', <CustomerRewards />) },

  // ── Fallback ────────────────────────────────────────────
  { path: '*', element: <Navigate to="/login" replace /> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
