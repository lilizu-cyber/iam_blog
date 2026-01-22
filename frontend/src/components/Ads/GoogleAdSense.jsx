import { useEffect, useState } from 'react'
import { canUseAnalytics } from '../../utils/cookieConsent'

/**
 * Google AdSense Component
 * 
 * Usage:
 * <GoogleAdSense adSlot="1234567890" adFormat="auto" />
 * 
 * Or for specific ad units:
 * <GoogleAdSense 
 *   adSlot="1234567890" 
 *   adFormat="rectangle"
 *   adStyle={{ display: 'block', textAlign: 'center' }}
 * />
 */

const GOOGLE_ADSENSE_CLIENT_ID = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID || ''

let adsenseScriptLoaded = false

export default function GoogleAdSense({ 
  adSlot, 
  adFormat = 'auto',
  adStyle = {},
  className = '',
  responsive = true 
}) {
  const [hasConsentState, setHasConsentState] = useState(() => canUseAnalytics())

  useEffect(() => {
    // Check consent on mount
    setHasConsentState(canUseAnalytics())

    // Listen for consent events
    const handleConsentChange = (event) => {
      if (event.detail?.analytics) {
        setHasConsentState(true)
      }
    }

    window.addEventListener('cookieConsentGiven', handleConsentChange)

    return () => {
      window.removeEventListener('cookieConsentGiven', handleConsentChange)
    }
  }, [])

  useEffect(() => {
    // Only load AdSense if user has consented to analytics
    if (!hasConsentState) {
      console.log('[AdSense] User has not consented to analytics - AdSense not loaded')
      return
    }

    // Check if AdSense client ID is configured
    if (!GOOGLE_ADSENSE_CLIENT_ID) {
      console.warn('[AdSense] VITE_GOOGLE_ADSENSE_CLIENT_ID not configured')
      return
    }

    // Check if adSlot is provided
    if (!adSlot) {
      console.warn('[AdSense] adSlot prop is required')
      return
    }

    // Load AdSense script only once
    if (!adsenseScriptLoaded) {
      const script = document.createElement('script')
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT_ID}`
      script.async = true
      script.crossOrigin = 'anonymous'
      script.onload = () => {
        adsenseScriptLoaded = true
        console.log('[AdSense] Script loaded successfully')
      }
      script.onerror = () => {
        console.error('[AdSense] Failed to load script')
      }
      document.head.appendChild(script)
    }

    // Initialize ad after script loads
    const initializeAd = () => {
      if (window.adsbygoogle && window.adsbygoogle.loaded !== true) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({})
        } catch (error) {
          console.error('[AdSense] Error initializing ad:', error)
        }
      }
    }

    // Wait for script to load if not already loaded
    if (adsenseScriptLoaded) {
      initializeAd()
    } else {
      const checkInterval = setInterval(() => {
        if (adsenseScriptLoaded || window.adsbygoogle) {
          clearInterval(checkInterval)
          initializeAd()
        }
      }, 100)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
      }, 5000)
    }

    return () => {
      // Cleanup if needed
    }
  }, [adSlot, hasConsentState])

  // Don't render if no consent
  if (!hasConsentState || !GOOGLE_ADSENSE_CLIENT_ID || !adSlot) {
    return null
  }

  const defaultStyle = {
    display: 'block',
    textAlign: 'center',
    minHeight: responsive ? '250px' : 'auto',
    ...adStyle
  }

  return (
    <div className={`adsense-container ${className}`} style={defaultStyle}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={GOOGLE_ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  )
}

/**
 * In-Article Ad Component
 * Use this for ads within blog post content
 */
export function InArticleAd({ adSlot, className = '' }) {
  return (
    <GoogleAdSense
      adSlot={adSlot}
      adFormat="fluid"
      className={`in-article-ad ${className}`}
      adStyle={{
        display: 'block',
        textAlign: 'center',
        margin: '2rem auto',
        maxWidth: '100%'
      }}
    />
  )
}

/**
 * Sidebar Ad Component
 * Use this for sidebar ads
 */
export function SidebarAd({ adSlot, className = '' }) {
  return (
    <GoogleAdSense
      adSlot={adSlot}
      adFormat="rectangle"
      className={`sidebar-ad ${className}`}
      adStyle={{
        display: 'block',
        textAlign: 'center',
        margin: '1rem 0'
      }}
    />
  )
}

/**
 * Banner Ad Component
 * Use this for top/bottom banner ads
 */
export function BannerAd({ adSlot, className = '' }) {
  return (
    <GoogleAdSense
      adSlot={adSlot}
      adFormat="horizontal"
      className={`banner-ad ${className}`}
      adStyle={{
        display: 'block',
        textAlign: 'center',
        width: '100%',
        margin: '1rem 0'
      }}
    />
  )
}






