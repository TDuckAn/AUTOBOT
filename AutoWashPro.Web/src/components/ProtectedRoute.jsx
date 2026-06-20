import { Navigate, useLocation } from 'react-router-dom'
import { getRole, isAuthenticated } from '../hooks/useAuth.js'

export function ProtectedRoute({ role, children }) {
  const location = useLocation()

  if (!isAuthenticated() || getRole() !== role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
