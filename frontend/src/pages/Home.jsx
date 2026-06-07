import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  CpuChipIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

// Components
import Header from '../components/Layout/Header'
import GridBackground from '../components/UI/GridBackground'
import GridSection from '../components/UI/GridSection'
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

      {/* Hero Section — cyber grid */}
      <section className="relative flex min-h-[92vh] flex-col overflow-hidden bg-black">
        <GridBackground />
        <Header variant="grid" overlay />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-24 text-center sm:px-6 lg:px-8">
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, y: 24 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.9 }}
            className="mx-auto max-w-3xl"
          >
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl grid-hero-title-glow">
              Enter the Grid
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/85 sm:text-lg">
              Experience the next evolution of cybersecurity and identity management,
              where access flows with unparalleled speed and security.
            </p>

            <div className="mt-10 flex justify-center">
              <Link
                to="/blog"
                className="grid-hero-cta inline-flex items-center rounded-sm border border-[#00FBFF] px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#00FBFF] transition-all duration-200 hover:bg-[#00FBFF]/10"
              >
                Explore the Network
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-[#00FBFF]/10 bg-black py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            ref={featuresRef}
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl grid-hero-title-glow">
              What You'll Discover
            </h2>
            <p className="mt-4 text-lg text-white/75">
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
                  <div className="inline-flex rounded-sm border border-[#00FBFF]/20 bg-[#00FBFF]/10 p-3">
                    <feature.icon className="h-6 w-6 text-[#00FBFF] transition-colors group-hover:text-[#00FBFF]" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white transition-colors group-hover:text-[#00FBFF]">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-white/70">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-white/70 transition-colors group-hover:text-[#00FBFF]">
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
      <GridSection>
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
                <div className="text-3xl font-bold text-[#00FBFF] sm:text-4xl grid-hero-title-glow">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-medium uppercase tracking-wider text-white/75">
                  {stat.name}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </GridSection>

      {/* Featured Posts */}
      <FeaturedPosts />

      {/* Recent Posts */}
      <RecentPosts />

      {/* Newsletter */}
      <Newsletter />
    </>
  )
}
