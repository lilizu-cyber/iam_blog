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

  // SECURITY: Redirect to login if not authenticated
  // This is a critical security check - never allow access without authentication
  // No exceptions, no delays, no bypasses
  if (!isAuthenticated) {
    // Log for debugging
    console.log('[ProtectedRoute] Access denied - redirecting to login', {
      isAuthenticated,
      location: location.pathname,
      isLoading
    })
    // Immediately redirect to login - no delay, no exceptions
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
