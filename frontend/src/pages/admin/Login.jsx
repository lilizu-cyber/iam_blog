import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ShieldCheckIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { auth0Connections } from '../../config/auth0'

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading, authError, authSetupHint, postLoginRedirect } = useAuth()

  const from = location.state?.from?.pathname || postLoginRedirect || '/admin/dashboard'

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, from])

  const handleLogin = async (authorizationParams = {}) => {
    try {
      await login({ appState: { returnTo: from }, authorizationParams })
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.')
    }
  }

  const handleSignup = async () => {
    try {
      await login({
        appState: { returnTo: from },
        authorizationParams: { screen_hint: 'signup', prompt: 'login' },
      })
    } catch (error) {
      toast.error(error.message || 'Signup failed. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Admin Login - CyberSec & IAM Blog</title>
        <meta name="description" content="Admin login for CyberSec & IAM Blog management" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[url('/images/cybersecurity-comprehensive-bg.jpg.png')] bg-cover bg-center bg-no-repeat opacity-10"></div>

        <div className="relative max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border border-cyan-400/30">
                <ShieldCheckIcon className="h-12 w-12 text-cyan-400" />
                <KeyIcon className="h-10 w-10 text-blue-400" />
              </div>
            </div>

            <h2 className="text-center text-3xl font-bold text-white">
              Admin Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Sign in with Auth0 to access the admin dashboard
            </p>
          </div>

          {authError && (
            <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <p>Error: {authError}</p>
              {authSetupHint && (
                <p className="mt-2 text-xs text-red-100">{authSetupHint}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleLogin({ connection: auth0Connections.github })}
              className="w-full rounded-lg border border-white/20 bg-[#24292f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2f363d]"
            >
              Continue with GitHub
            </button>

            <button
              type="button"
              onClick={() => handleLogin({ connection: auth0Connections.google })}
              className="w-full rounded-lg border border-white/20 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleLogin()}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:from-cyan-600 hover:to-blue-700"
            >
              All login options
            </button>

            <button
              type="button"
              onClick={handleSignup}
              className="w-full rounded-lg border border-cyan-400/40 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Sign up
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              If Auth0 only shows GitHub, click &quot;All login options&quot; or sign out of Auth0 in another tab.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
