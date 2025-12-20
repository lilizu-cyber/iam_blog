import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './UI/LoadingSpinner'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication
  // Always wait for auth check to complete before allowing access
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Redirect to login if not authenticated
  // This is a security check - never allow access without authentication
  if (!isAuthenticated) {
    // Log for debugging (remove in production if needed)
    console.log('[ProtectedRoute] Redirecting to login - isAuthenticated:', isAuthenticated, 'location:', location.pathname)
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
