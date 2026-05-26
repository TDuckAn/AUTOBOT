import React from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import './styles/design-system.css'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { StaffLogin } from './pages/staff/StaffLogin.jsx'
import { StaffQueue } from './pages/staff/StaffQueue.jsx'
import { StaffWalkin } from './pages/staff/StaffWalkin.jsx'
import { AdminLogin } from './pages/admin/AdminLogin.jsx'
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx'
import { AdminServices } from './pages/admin/AdminServices.jsx'
import { AdminPromotions } from './pages/admin/AdminPromotions.jsx'
import { AdminTiers } from './pages/admin/AdminTiers.jsx'
import { AdminCustomers } from './pages/admin/AdminCustomers.jsx'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/staff/login" replace /> },
  { path: '/staff/login', element: <StaffLogin /> },
  { path: '/staff/queue', element: <ProtectedRoute role="Staff"><StaffQueue /></ProtectedRoute> },
  { path: '/staff/walkin', element: <ProtectedRoute role="Staff"><StaffWalkin /></ProtectedRoute> },
  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/admin/dashboard', element: <ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute> },
  { path: '/admin/services', element: <ProtectedRoute role="Admin"><AdminServices /></ProtectedRoute> },
  { path: '/admin/promotions', element: <ProtectedRoute role="Admin"><AdminPromotions /></ProtectedRoute> },
  { path: '/admin/tiers', element: <ProtectedRoute role="Admin"><AdminTiers /></ProtectedRoute> },
  { path: '/admin/customers', element: <ProtectedRoute role="Admin"><AdminCustomers /></ProtectedRoute> },
  { path: '*', element: <Navigate to="/staff/login" replace /> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
