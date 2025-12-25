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

  // SECURITY: CRITICAL - Never allow access without explicit authentication
  // Default to denying access - only allow if explicitly authenticated
  // This prevents any bypass scenarios where isAuthenticated might be undefined or true by default
  if (!isAuthenticated) {
    // Log for debugging
    console.warn('[ProtectedRoute] Access denied - redirecting to login', {
      isAuthenticated,
      location: location.pathname,
      isLoading,
      timestamp: new Date().toISOString()
    })
    // Immediately redirect to login - no delay, no exceptions, no bypasses
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Only render children if explicitly authenticated
  // Double-check to be absolutely sure
  if (isAuthenticated !== true) {
    console.error('[ProtectedRoute] Security check failed - isAuthenticated is not explicitly true', {
      isAuthenticated,
      type: typeof isAuthenticated
    })
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
