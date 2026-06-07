import { useState, useEffect } from 'react'
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

const COOKIE_CONSENT_KEY = 'cookie-consent'
const COOKIE_CONSENT_EXPIRY_DAYS = 365

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const saveConsent = (preferences) => {
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))
    setShowBanner(false)
    
    // Trigger analytics initialization if analytics is accepted
    if (preferences.analytics) {
      window.dispatchEvent(new CustomEvent('cookieConsentGiven', { detail: consentData }))
    }
  }

  const acceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      preferences: true
    })
  }

  const acceptSelected = () => {
    const essential = true // Always true
    const analytics = document.getElementById('consent-analytics')?.checked || false
    const preferences = document.getElementById('consent-preferences')?.checked || false
    
    saveConsent({
      essential,
      analytics,
      preferences
    })
  }

  const rejectAll = () => {
    saveConsent({
      essential: true, // Essential cookies are always required
      analytics: false,
      preferences: false
    })
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <InformationCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cookie Preferences
              </h3>
            </div>
            
            {!showDetails ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                We use cookies to enhance your browsing experience, analyze site traffic, and display personalized advertisements 
                through Google AdSense. By clicking "Accept All", you consent to our use of cookies and third-party advertising services.{' '}
                <Link to="/cookies" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Learn more
                </Link>
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  We use different types of cookies to optimize your experience on our website. 
                  You can choose which cookies you want to accept.
                </p>
                
                <div className="space-y-3">
                  {/* Essential Cookies */}
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="consent-essential"
                          checked
                          disabled
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="consent-essential" className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                          Essential Cookies
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                        Required for the website to function properly. These cannot be disabled.
                      </p>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="consent-analytics"
                          defaultChecked
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="consent-analytics" className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                          Analytics Cookies
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                        Help us understand how visitors interact with our website by collecting and reporting information anonymously. 
                        This includes Google AdSense cookies used for personalized advertising.
                      </p>
                    </div>
                  </div>

                  {/* Preference Cookies */}
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="consent-preferences"
                          defaultChecked
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="consent-preferences" className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                          Preference Cookies
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                        Remember your preferences, such as theme settings (dark/light mode).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {showDetails ? (
                <>
                  <button
                    onClick={acceptSelected}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Save Preferences
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="btn-outline text-sm px-4 py-2"
                  >
                    Back
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={acceptAll}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="btn-outline text-sm px-4 py-2"
                  >
                    Customize
                  </button>
                  <button
                    onClick={rejectAll}
                    className="btn-outline text-sm px-4 py-2"
                  >
                    Reject All
                  </button>
                </>
              )}
            </div>
          </div>

          <button
            onClick={rejectAll}
            className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Reject non-essential cookies and close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}







