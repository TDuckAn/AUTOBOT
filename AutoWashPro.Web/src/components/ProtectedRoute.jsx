import { Navigate, useLocation } from 'react-router-dom'
import { getRole, isAuthenticated } from '../hooks/useAuth.js'

export function ProtectedRoute({ role, children }) {
  const location = useLocation()
  const loginPath = role === 'Admin' ? '/admin/login' : '/staff/login'

  if (!isAuthenticated() || getRole() !== role) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  return children
}
