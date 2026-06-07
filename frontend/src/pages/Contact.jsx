import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { buildApiUrl } from '../utils/apiUrl'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import PageHero from '../components/UI/PageHero'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(buildApiUrl('/contact/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Message sent successfully! We\'ll get back to you soon.')
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        })
      } else {
        toast.error(data.message || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Contact Us - cyberiam</title>
        <meta name="description" content="Get in touch with our cybersecurity experts. We'd love to hear from you and answer any questions about security or IAM." />
      </Helmet>

      <div className="min-h-screen bg-black">
        <PageHero
          icon={ChatBubbleLeftRightIcon}
          title="Get In Touch"
          subtitle="Have questions about cybersecurity or IAM? We're here to help."
        />

        <div className="border-t border-[#00FBFF]/10 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {/* Contact Form */}
              <div className="rounded-sm border border-[#00FBFF]/15 bg-black/50 p-6 backdrop-blur-sm sm:p-8">
                <h2 className="mb-6 text-2xl font-semibold text-white grid-hero-title-glow">
                  Send us a message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-2 block text-sm font-medium text-white/80">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="mb-2 block text-sm font-medium text-white/80">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="input w-full"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-medium text-white/80">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="input w-full resize-none"
                      placeholder="Tell us more about your question or feedback..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="grid-hero-cta w-full rounded-sm border border-[#00FBFF] bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#00FBFF] transition-all duration-200 hover:bg-[#00FBFF]/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>

              {/* FAQ */}
              <div>
                <h3 className="mb-6 text-lg font-semibold text-white grid-hero-title-glow">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  <div className="rounded-sm border border-[#00FBFF]/15 bg-black/40 p-5 backdrop-blur-sm">
                    <h4 className="font-medium text-[#00FBFF]">
                      Can I contribute articles?
                    </h4>
                    <p className="mt-2 text-sm text-white/70">
                      Yes! We welcome guest contributions from security professionals.
                      Please reach out with your article ideas.
                    </p>
                  </div>
                  <div className="rounded-sm border border-[#00FBFF]/15 bg-black/40 p-5 backdrop-blur-sm">
                    <h4 className="font-medium text-[#00FBFF]">
                      Do you offer consulting services?
                    </h4>
                    <p className="mt-2 text-sm text-white/70">
                      We can connect you with our network of security experts for
                      consulting opportunities.
                    </p>
                  </div>
                  <div className="rounded-sm border border-[#00FBFF]/15 bg-black/40 p-5 backdrop-blur-sm">
                    <h4 className="font-medium text-[#00FBFF]">
                      How can I stay updated?
                    </h4>
                    <p className="mt-2 text-sm text-white/70">
                      Subscribe to our newsletter for weekly security insights and
                      follow us on social media.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
