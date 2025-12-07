import { useState, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)
  const lastSubmitTimeRef = useRef(0)

  const from = location.state?.from?.pathname || '/admin/dashboard'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Prevent multiple simultaneous submissions
    if (isSubmittingRef.current) {
      return
    }

    // Debounce: prevent submissions within 1 second of each other
    const now = Date.now()
    if (now - lastSubmitTimeRef.current < 1000) {
      return
    }
    lastSubmitTimeRef.current = now

    // Set submitting flag
    isSubmittingRef.current = true
    setIsLoading(true)

    try {
      const result = await login(formData.username, formData.password)
      
      if (result && result.success) {
        toast.success('Login successful!')
        navigate(from, { replace: true })
      } else {
        const errorMessage = result?.message || 'Invalid username or password'
        toast.error(errorMessage)
      }
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
      // Reset submitting flag after a short delay to prevent rapid re-submissions
      setTimeout(() => {
        isSubmittingRef.current = false
      }, 1000)
    }
  }, [formData.username, formData.password, login, navigate, from])

  return (
    <>
      <Helmet>
        <title>Admin Login - CyberSec & IAM Blog</title>
        <meta name="description" content="Admin login for CyberSec & IAM Blog management" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/images/cybersecurity-comprehensive-bg.jpg.png')] bg-cover bg-center bg-no-repeat opacity-10"></div>
        
        <div className="relative max-w-md w-full space-y-8">
          <div>
            {/* Logo */}
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
              Sign in to access the admin dashboard
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="relative block w-full px-3 py-3 border border-gray-600 bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                  placeholder="Enter username"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="relative block w-full px-3 py-3 pr-10 border border-gray-600 bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || isSubmittingRef.current}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LockClosedIcon className="h-5 w-5 text-cyan-300 group-hover:text-cyan-200" />
                </span>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Secure admin access for CyberSec & IAM Blog
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
