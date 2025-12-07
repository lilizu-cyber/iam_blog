import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { EnvelopeIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'
import { newsletterApi } from '../../services/api'

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
      <section className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <CheckIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Welcome to the Community!
            </h2>
            <p className="mt-4 text-xl text-primary-100">
              You'll receive our latest security insights and analysis directly in your inbox.
            </p>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <EnvelopeIcon className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Stay Ahead of Security Threats
          </h2>
          
          <p className="mt-4 text-xl text-primary-100 max-w-2xl mx-auto">
            Get weekly insights on the latest cybersecurity trends, IAM best practices, 
            and AI-powered security solutions delivered to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
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
                  className="w-full px-4 py-3 rounded-lg border-0 bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={subscribeMutation.isLoading}
                className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribeMutation.isLoading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-primary-100">
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">Weekly security insights</span>
            </div>
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">No spam, unsubscribe anytime</span>
            </div>
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">Expert analysis & tutorials</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
