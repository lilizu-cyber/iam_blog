import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { EnvelopeIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'
import { newsletterApi } from '../../services/api'
import GridSection from '../UI/GridSection'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const subscribeMutation = useMutation(newsletterApi.subscribe, {
    onSuccess: () => {
      setIsSubscribed(true)
      setEmail('')
      toast.success('Successfully subscribed to our newsletter!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to subscribe. Please try again.')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email && !subscribeMutation.isLoading) {
      subscribeMutation.mutate(email)
    }
  }

  if (isSubscribed) {
    return (
      <GridSection>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#00FBFF]/40 bg-[#00FBFF]/10 grid-hero-cta">
              <CheckIcon className="h-8 w-8 text-[#00FBFF]" />
            </div>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl grid-hero-title-glow">
              Welcome to the Community!
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              You'll receive our latest security insights and analysis directly in your inbox.
            </p>
          </motion.div>
        </div>
      </GridSection>
    )
  }

  return (
    <GridSection>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#00FBFF]/40 bg-[#00FBFF]/10 grid-hero-cta">
            <EnvelopeIcon className="h-8 w-8 text-[#00FBFF]" />
          </div>

          <h2 className="text-3xl font-semibold text-white sm:text-4xl grid-hero-title-glow">
            Stay Ahead of Security Threats
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Get weekly insights on the latest cybersecurity trends, IAM best practices,
            and AI-powered security solutions delivered to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-md">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-sm border border-[#00FBFF]/30 bg-black/50 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm transition-colors focus:border-[#00FBFF] focus:bg-black/70 focus:outline-none focus:ring-1 focus:ring-[#00FBFF]/50"
                />
              </div>
              <button
                type="submit"
                disabled={subscribeMutation.isLoading}
                className="grid-hero-cta rounded-sm border border-[#00FBFF] bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#00FBFF] transition-all duration-200 hover:bg-[#00FBFF]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {subscribeMutation.isLoading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-col items-center justify-center gap-4 text-white/70 sm:flex-row sm:gap-6">
            <div className="flex items-center">
              <CheckIcon className="mr-2 h-5 w-5 text-[#00FBFF]" />
              <span className="text-sm">Weekly security insights</span>
            </div>
            <div className="flex items-center">
              <CheckIcon className="mr-2 h-5 w-5 text-[#00FBFF]" />
              <span className="text-sm">No spam, unsubscribe anytime</span>
            </div>
            <div className="flex items-center">
              <CheckIcon className="mr-2 h-5 w-5 text-[#00FBFF]" />
              <span className="text-sm">Expert analysis & tutorials</span>
            </div>
          </div>
        </motion.div>
      </div>
    </GridSection>
  )
}
