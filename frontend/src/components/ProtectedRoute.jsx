import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './UI/LoadingSpinner'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // SECURITY: CRITICAL - Default to denying access
  // Only show loading for a maximum of 5 seconds to prevent infinite loading
  const [maxLoadTime] = useState(() => Date.now() + 5000)
  const shouldShowLoading = isLoading && Date.now() < maxLoadTime

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // SECURITY: CRITICAL - Never allow access without explicit authentication
  // Default to denying access - only allow if explicitly authenticated
  // Check multiple ways to ensure we catch any edge cases
  const isExplicitlyAuthenticated = isAuthenticated === true && typeof isAuthenticated === 'boolean'
  
  if (!isExplicitlyAuthenticated) {
    // Log for debugging
    console.error('[ProtectedRoute] SECURITY: Access denied - redirecting to login', {
      isAuthenticated,
      type: typeof isAuthenticated,
      isExplicitlyAuthenticated,
      location: location.pathname,
      isLoading,
      timestamp: new Date().toISOString()
    })
    // Immediately redirect to login - no delay, no exceptions, no bypasses
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Final security check - only render if explicitly authenticated
  if (isAuthenticated !== true) {
    console.error('[ProtectedRoute] SECURITY: Final check failed - isAuthenticated is not true', {
      isAuthenticated,
      type: typeof isAuthenticated
    })
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
