import { Helmet } from 'react-helmet-async'
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  CpuChipIcon,
  UserGroupIcon,
  AcademicCapIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Expert Analysis',
    description: 'In-depth analysis from cybersecurity professionals with years of industry experience.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Practical Guides',
    description: 'Step-by-step tutorials and implementation guides you can apply immediately.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Industry Insights',
    description: 'Latest trends, threat intelligence, and best practices from the security community.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Community Driven',
    description: 'Content created by and for security professionals, fostering knowledge sharing.',
    icon: UserGroupIcon,
  },
]

const stats = [
  { name: 'Articles Published', value: '500+' },
  { name: 'Security Topics Covered', value: '50+' },
  { name: 'Expert Contributors', value: '25+' },
  { name: 'Monthly Readers', value: '100K+' },
]

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Us - CyberSec & IAM Blog</title>
        <meta name="description" content="Learn about our mission to provide expert cybersecurity and identity management insights to security professionals worldwide." />
      </Helmet>

      <div className="bg-white dark:bg-gray-900">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-security-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="flex items-center space-x-4 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20">
                  <ShieldCheckIcon className="h-12 w-12 text-security-600" />
                  <KeyIcon className="h-10 w-10 text-iam-600" />
                  <CpuChipIcon className="h-12 w-12 text-primary-600" />
                </div>
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                About Our Mission
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                We're dedicated to advancing cybersecurity knowledge and identity management practices 
                through expert insights, practical guides, and community-driven content.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="py-24 bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Empowering Security Professionals
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                In today's rapidly evolving threat landscape, staying informed is not just important—it's critical. 
                Our platform serves as a comprehensive resource for cybersecurity professionals, IAM specialists, 
                and security-conscious organizations seeking to strengthen their security posture.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                What Sets Us Apart
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Our commitment to quality, accuracy, and practical applicability
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                      <feature.icon className="h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="py-24 bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Our Impact
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Trusted by security professionals worldwide
              </p>
            </div>
            <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-10 text-center sm:mt-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="flex flex-col gap-y-3 border-l border-gray-900/10 dark:border-white/10 pl-6">
                  <dt className="text-sm leading-6 text-gray-600 dark:text-gray-400">{stat.name}</dt>
                  <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Our Focus Areas
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Comprehensive coverage of critical security domains
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              <div className="card p-8 text-center">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-security-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Cybersecurity
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Threat analysis, vulnerability management, incident response, and security architecture
                </p>
              </div>
              <div className="card p-8 text-center">
                <KeyIcon className="mx-auto h-12 w-12 text-iam-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Identity & Access Management
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Authentication, authorization, identity governance, and access control strategies
                </p>
              </div>
              <div className="card p-8 text-center">
                <CpuChipIcon className="mx-auto h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  AI & Security
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Machine learning in security, AI-powered threat detection, and emerging technologies
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary-600 dark:bg-primary-800 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Join Our Community
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
                Stay updated with the latest security insights and connect with fellow professionals
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a
                  href="/blog"
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Explore Articles
                </a>
                <a href="/contact" className="text-sm font-semibold leading-6 text-white">
                  Contact Us <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
