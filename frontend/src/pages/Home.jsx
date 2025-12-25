import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  CpuChipIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

// Components
import FeaturedPosts from '../components/Blog/FeaturedPosts'
import RecentPosts from '../components/Blog/RecentPosts'
import Newsletter from '../components/Newsletter/Newsletter'

const features = [
  {
    name: 'Cybersecurity Insights',
    description: 'Stay ahead of the latest threats with in-depth analysis of cybersecurity trends, vulnerabilities, and defense strategies.',
    icon: ShieldCheckIcon,
    color: 'security',
    href: '/security'
  },
  {
    name: 'Identity & Access Management',
    description: 'Master IAM concepts, best practices, and implementation strategies for secure identity governance.',
    icon: KeyIcon,
    color: 'iam',
    href: '/iam'
  },
  {
    name: 'AI-Powered Security',
    description: 'Explore how artificial intelligence is revolutionizing cybersecurity and identity management.',
    icon: CpuChipIcon,
    color: 'primary',
    href: '/blog?tag=ai-security'
  }
]

const stats = [
  { name: 'Security Articles', value: '200+' },
  { name: 'IAM Guides', value: '150+' },
  { name: 'Expert Contributors', value: '25+' },
  { name: 'Monthly Readers', value: '50K+' }
]

export default function Home() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [statsRef, statsInView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const siteUrl = window.location.origin

  // Organization schema for SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CyberSec & IAM Blog",
    "url": siteUrl,
    "logo": `${siteUrl}/images/icon-512x512.png`,
    "description": "Expert insights on cybersecurity, identity and access management (IAM), and AI-powered security solutions.",
      "sameAs": [
      "https://twitter.com/cyberiam_blog",
      "https://linkedin.com/company/cyberiam-blog"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "url": `${siteUrl}/contact`
    }
  }

  // Website schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CyberSec & IAM Blog",
    "url": siteUrl,
    "description": "Explore the latest in cybersecurity, identity and access management (IAM), and AI-powered security solutions.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <>
      <Helmet>
        <title>CyberSec & IAM Blog - Security Insights & Identity Management</title>
        <meta name="description" content="Explore the latest in cybersecurity, identity and access management (IAM), and AI-powered security solutions. Expert insights, tutorials, and industry trends." />
        <meta name="keywords" content="cybersecurity, IAM, identity management, access control, security, AI security, authentication, authorization, Okta, PAM, privileged access, identity governance" />
        <link rel="canonical" href={siteUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content="CyberSec & IAM Blog - Security Insights & Identity Management" />
        <meta property="og:description" content="Explore the latest in cybersecurity, identity and access management (IAM), and AI-powered security solutions." />
        <meta property="og:image" content={`${siteUrl}/og-image.jpg`} />
        <meta property="og:site_name" content="CyberSec & IAM Blog" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={siteUrl} />
        <meta name="twitter:title" content="CyberSec & IAM Blog - Security Insights & Identity Management" />
        <meta name="twitter:description" content="Explore the latest in cybersecurity, identity and access management (IAM), and AI-powered security solutions." />
        <meta name="twitter:image" content={`${siteUrl}/og-image.jpg`} />
        <meta name="twitter:creator" content="@cybersec_iam" />
        <meta name="twitter:site" content="@cybersec_iam" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[600px] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        {/* Background Image */}
        <div className="absolute inset-0 bg-[url('/images/cybersecurity-comprehensive-bg.jpg.png')] bg-cover bg-center bg-no-repeat opacity-30"></div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-blue-900/70 to-transparent"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
            className="text-left max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-start mb-8"
            >
              <div className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border border-cyan-400/30">
                <ShieldCheckIcon className="h-12 w-12 text-cyan-400" />
                <SparklesIcon className="h-8 w-8 text-yellow-400" />
                <KeyIcon className="h-10 w-10 text-blue-400" />
              </div>
            </motion.div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                Empowering your business
              </span>
              <span className="block text-white mt-2">
                with Robust
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mt-2">
                Cybersecurity Solutions
              </span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Explore cutting-edge cybersecurity strategies, identity and access management best practices, 
              and AI-powered security solutions. Stay ahead of threats with expert insights and practical guides.
            </p>
            
            <div className="mt-10 flex items-start gap-x-6">
              <Link
                to="/blog"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200"
              >
                Explore Articles
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-cyan-400 border-2 border-cyan-400 rounded-lg hover:bg-cyan-400 hover:text-slate-900 transition-all duration-200"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            ref={featuresRef}
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              What You'll Discover
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Comprehensive coverage of the most critical security topics
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <Link
                  to={feature.href}
                  className="group relative block p-8 card-hover hover-lift"
                >
                  <div className={`inline-flex rounded-lg p-3 ${
                    feature.color === 'security' ? 'bg-security-100 dark:bg-security-900' :
                    feature.color === 'iam' ? 'bg-iam-100 dark:bg-iam-900' :
                    'bg-primary-100 dark:bg-primary-900'
                  }`}>
                    <feature.icon className={`h-6 w-6 ${
                      feature.color === 'security' ? 'text-security-600 dark:text-security-400' :
                      feature.color === 'iam' ? 'text-iam-600 dark:text-iam-400' :
                      'text-primary-600 dark:text-primary-400'
                    }`} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300">
                    Learn more
                    <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            ref={statsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={statsInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-primary-100">
                  {stat.name}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      <FeaturedPosts />

      {/* Recent Posts */}
      <RecentPosts />

      {/* Newsletter */}
      <Newsletter />
    </>
  )
}
