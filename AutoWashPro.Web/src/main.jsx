import React from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import './styles/design-system.css'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { Login } from './pages/Login.jsx'
import { StaffQueue } from './pages/staff/StaffQueue.jsx'
import { StaffWalkin } from './pages/staff/StaffWalkin.jsx'
import { StaffHistory } from './pages/staff/StaffHistory.jsx'
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx'
import { AdminServices } from './pages/admin/AdminServices.jsx'
import { AdminPromotions } from './pages/admin/AdminPromotions.jsx'
import { AdminTiers } from './pages/admin/AdminTiers.jsx'
import { AdminCustomers } from './pages/admin/AdminCustomers.jsx'
import { CustomerDashboard } from './pages/customer/CustomerDashboard.jsx'
import { CustomerBookings } from './pages/customer/CustomerBookings.jsx'
import { CustomerVehicles } from './pages/customer/CustomerVehicles.jsx'
import { CustomerRewards } from './pages/customer/CustomerRewards.jsx'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },

  // ── Staff (role = 'Staff') ──────────────────────────────
  { path: '/staff/queue', element: <ProtectedRoute role="Staff"><StaffQueue /></ProtectedRoute> },
  { path: '/staff/walkin', element: <ProtectedRoute role="Staff"><StaffWalkin /></ProtectedRoute> },
  { path: '/staff/history', element: <ProtectedRoute role="Staff"><StaffHistory /></ProtectedRoute> },

  // ── Admin (role = 'Admin') ──────────────────────────────
  { path: '/admin/dashboard', element: <ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute> },
  { path: '/admin/services', element: <ProtectedRoute role="Admin"><AdminServices /></ProtectedRoute> },
  { path: '/admin/promotions', element: <ProtectedRoute role="Admin"><AdminPromotions /></ProtectedRoute> },
  { path: '/admin/tiers', element: <ProtectedRoute role="Admin"><AdminTiers /></ProtectedRoute> },
  { path: '/admin/customers', element: <ProtectedRoute role="Admin"><AdminCustomers /></ProtectedRoute> },

  // ── Customer (role = 'Customer') ────────────────────────
  { path: '/customer/dashboard', element: <ProtectedRoute role="Customer"><CustomerDashboard /></ProtectedRoute> },
  { path: '/customer/bookings', element: <ProtectedRoute role="Customer"><CustomerBookings /></ProtectedRoute> },
  { path: '/customer/vehicles', element: <ProtectedRoute role="Customer"><CustomerVehicles /></ProtectedRoute> },
  { path: '/customer/rewards', element: <ProtectedRoute role="Customer"><CustomerRewards /></ProtectedRoute> },

  // ── Fallback ────────────────────────────────────────────
  { path: '*', element: <Navigate to="/login" replace /> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
