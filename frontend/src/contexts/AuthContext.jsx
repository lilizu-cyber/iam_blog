import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { buildApiUrl } from '../utils/apiUrl'
import { getAuth0CallbackUrl, auth0DashboardSettings } from '../config/auth0'
import { getAuth0Client } from '../services/auth0Client'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const mapAuth0User = (auth0User) => ({
  id: auth0User.sub,
  username: auth0User.email || auth0User.name || auth0User.nickname || auth0User.sub,
  email: auth0User.email,
  name: auth0User.name,
  picture: auth0User.picture,
  role: 'admin',
})

const AUTH0_SYNC_DENIED_KEY = 'auth0_session_sync_denied'

const syncBackendSession = async (client) => {
  if (sessionStorage.getItem(AUTH0_SYNC_DENIED_KEY) === '1') {
    throw new Error('Access denied. No admin account linked to this Auth0 user.')
  }

  const accessToken = await client.getTokenSilently()
  const response = await fetch(buildApiUrl('/auth/auth0/session'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const message = data.message || 'Failed to sync backend session'

    if (response.status === 403) {
      sessionStorage.setItem(AUTH0_SYNC_DENIED_KEY, '1')
    }

    throw new Error(message)
  }

  sessionStorage.removeItem(AUTH0_SYNC_DENIED_KEY)

  const data = await response.json()
  return data.data
}

const loadBackendSession = async () => {
  const response = await fetch(buildApiUrl('/auth/me'), {
    credentials: 'include',
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  if (data.success === true && data.isAuthenticated === true) {
    return data.data
  }

  return null
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [authSetupHint, setAuthSetupHint] = useState(null)
  const initRef = useRef(false)
  const postLoginRedirectRef = useRef('/admin/dashboard')

  const checkAuthStatus = useCallback(async () => {
    try {
      const client = await getAuth0Client()

      if (await client.isAuthenticated()) {
        const existingSession = await loadBackendSession()
        if (existingSession) {
          setUser(existingSession)
          setIsAuthenticated(true)
          return
        }

        const auth0User = await client.getUser()
        await syncBackendSession(client)
        setUser(mapAuth0User(auth0User))
        setIsAuthenticated(true)
        return
      }

      const existingSession = await loadBackendSession()
      if (existingSession) {
        setUser(existingSession)
        setIsAuthenticated(true)
        return
      }

      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('[AuthContext] checkAuthStatus failed:', error)
      setAuthError(error.message || 'Authentication failed')
      if (error.message?.includes('No admin account linked')) {
        setAuthSetupHint(
          'Add an admin user in the database whose email exactly matches your Auth0 login email (role: admin, isActive: true). For GitHub login, use the email GitHub shares with Auth0.'
        )
      } else if (error.message?.includes('Too many login attempts') || error.message?.includes('Too many Auth0 session sync')) {
        setAuthSetupHint('Wait 15 minutes, or restart the backend dev server to reset the rate limit, then try again.')
      }
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initRef.current) {
      return
    }
    initRef.current = true

    const initializeAuth = async () => {
      try {
        const client = await getAuth0Client()

        if (window.location.search.includes('error=')) {
          const params = new URLSearchParams(window.location.search)
          const error = params.get('error')
          const description = params.get('error_description')
          setAuthError(`${error} — ${description}`)

          if (
            error === 'access_denied' ||
            description?.toLowerCase().includes('callback') ||
            description?.toLowerCase().includes('redirect')
          ) {
            setAuthSetupHint(formatAuth0SetupHint())
          }

          window.history.replaceState({}, '', window.location.pathname)
          setIsLoading(false)
          return
        }

        if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
          const result = await client.handleRedirectCallback()
          if (result?.appState?.returnTo) {
            postLoginRedirectRef.current = result.appState.returnTo
          }
          window.history.replaceState({}, '', window.location.pathname)
        }

        await checkAuthStatus()
      } catch (error) {
        console.error('[AuthContext] Auth0 initialization failed:', error)
        setAuthError(error.message || 'Authentication initialization failed')

        if (
          error.message?.toLowerCase().includes('callback') ||
          error.message?.toLowerCase().includes('redirect') ||
          error.message?.toLowerCase().includes('403')
        ) {
          setAuthSetupHint(formatAuth0SetupHint())
        }

        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [checkAuthStatus])

  const login = async (options = {}) => {
    sessionStorage.removeItem(AUTH0_SYNC_DENIED_KEY)
    const client = await getAuth0Client()
    const { appState, authorizationParams, ...rest } = options

    await client.loginWithRedirect({
      ...rest,
      appState: {
        returnTo: appState?.returnTo || postLoginRedirectRef.current || '/admin/dashboard',
      },
      authorizationParams: {
        redirect_uri: getAuth0CallbackUrl(),
        prompt: 'login',
        ...authorizationParams,
      },
    })

    return { success: true }
  }

  const logout = async () => {
    sessionStorage.removeItem(AUTH0_SYNC_DENIED_KEY)
    try {
      await fetch(buildApiUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Backend logout error:', error)
    }

    const client = await getAuth0Client()
    await client.logout({
      logoutParams: {
        returnTo: `${window.location.origin}/admin/login`,
      },
    })
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    authError,
    authSetupHint,
    postLoginRedirect: postLoginRedirectRef.current,
    login,
    logout,
    checkAuthStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

function formatAuth0SetupHint() {
  const callbackUrls = auth0DashboardSettings.callbackUrls.join(', ')
  const logoutUrls = auth0DashboardSettings.logoutUrls.join(', ')
  const webOrigins = auth0DashboardSettings.webOrigins.join(', ')

  return `Configure your Auth0 Application (Settings): Allowed Callback URLs = ${callbackUrls}; Allowed Logout URLs = ${logoutUrls}; Allowed Web Origins = ${webOrigins}; Application Type = SPA; Token Endpoint Auth Method = None.`
}
