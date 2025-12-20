import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { buildApiUrl } from '../utils/apiUrl'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Track in-flight requests to prevent duplicates
  const loginRequestRef = useRef(null)
  const authCheckRequestRef = useRef(null)
  const lastAuthCheckRef = useRef(0)
  const justLoggedInRef = useRef(false) // Flag to prevent checkAuthStatus from resetting auth after login

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    // Throttle auth checks - don't check more than once per 2 seconds
    const now = Date.now()
    if (now - lastAuthCheckRef.current < 2000) {
      return
    }
    lastAuthCheckRef.current = now

    // Cancel previous request if still in flight
    if (authCheckRequestRef.current) {
      // AbortController would be better, but fetch doesn't support it in all cases
      // Just skip if there's already a request
      return
    }

    try {
      const controller = new AbortController()
      authCheckRequestRef.current = controller

      const response = await fetch(buildApiUrl('/auth/me'), {
        credentials: 'include',
        signal: controller.signal
      })
      
      if (response.ok) {
        try {
          const data = await response.json()
          if (data.success && data.isAuthenticated) {
            setUser(data.data)
            setIsAuthenticated(true)
            
            // If token was refreshed, log it (optional)
            if (data.tokenRefreshed) {
              console.debug('Token automatically refreshed')
            }
          } else {
            // Only reset auth state if we didn't just log in
            if (!justLoggedInRef.current) {
              setUser(null)
              setIsAuthenticated(false)
            }
          }
        } catch (parseError) {
          // Only reset auth state if we didn't just log in
          if (!justLoggedInRef.current) {
            setUser(null)
            setIsAuthenticated(false)
          }
        }
      } else {
        // If 401, try to refresh token
        if (response.status === 401) {
          try {
            const refreshResponse = await fetch(buildApiUrl('/auth/refresh'), {
              method: 'POST',
              credentials: 'include'
            })
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              if (refreshData.success) {
                setUser(refreshData.data)
                setIsAuthenticated(true)
                return // Successfully refreshed, exit early
              }
            }
          } catch (refreshError) {
            // Refresh failed, continue to set unauthenticated
          }
        }
        
        // Only reset auth state if we didn't just log in
        if (!justLoggedInRef.current) {
          setUser(null)
          setIsAuthenticated(false)
        }
      }
    } catch (error) {
      // Don't set authenticated to false on aborted requests
      if (error.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      // For any other error (network errors, etc.), only set unauthenticated if we didn't just log in
      // This ensures security - if we can't verify auth, deny access
      // But don't override a successful login
      if (!justLoggedInRef.current) {
        setUser(null)
        setIsAuthenticated(false)
      }
    } finally {
      authCheckRequestRef.current = null
      setIsLoading(false)
    }
  }

  const login = async (username, password) => {
    // Prevent multiple simultaneous login attempts
    if (loginRequestRef.current) {
      return { success: false, message: 'Login request already in progress' }
    }

    try {
      const controller = new AbortController()
      loginRequestRef.current = controller

      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({ username, password })
      })

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Login failed. Please try again.'
        try {
          // Check if response has content before parsing
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const text = await response.text()
            if (text) {
              const errorData = JSON.parse(text)
              errorMessage = errorData.message || errorMessage
            }
          }
        } catch (e) {
          // If JSON parsing fails, use status-based message
          if (response.status === 401) {
            errorMessage = 'Invalid username or password'
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again later.'
          }
        }
        return { success: false, message: errorMessage }
      }

      const data = await response.json()

      if (data.success) {
        setUser(data.data)
        setIsAuthenticated(true)
        setIsLoading(false) // Ensure loading is false so navigation can proceed
        // Set flag to prevent checkAuthStatus from resetting auth state
        justLoggedInRef.current = true
        // Reset auth check throttle to allow immediate check
        lastAuthCheckRef.current = 0
        // Don't call checkAuthStatus immediately after login - we already know we're authenticated
        // Clear the flag after a short delay to allow normal auth checks to resume
        setTimeout(() => {
          justLoggedInRef.current = false
        }, 3000) // 3 seconds should be enough for navigation to complete
        return { success: true }
      } else {
        return { success: false, message: data.message || 'Login failed. Please try again.' }
      }
    } catch (error) {
      // Handle aborted requests
      if (error.name === 'AbortError') {
        return { success: false, message: 'Login request was cancelled' }
      }
      return { success: false, message: error.message || 'Login failed. Please check your connection and try again.' }
    } finally {
      loginRequestRef.current = null
    }
  }

  const logout = async () => {
    try {
      await fetch(buildApiUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
