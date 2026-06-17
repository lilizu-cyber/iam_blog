import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ShieldCheckIcon,
  KeyIcon,
  CpuChipIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import PageHero from '../components/UI/PageHero'
import GridSection from '../components/UI/GridSection'

const siteBrand = 'cyberiam.blog'

const focusAreas = [
  {
    name: 'Cybersecurity',
    description:
      'Threat awareness, defensive practices, incident response, and security architecture for modern environments.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Identity & Access Management',
    description:
      'Authentication, authorization, identity governance, and access control — explained with practical context.',
    icon: KeyIcon,
  },
  {
    name: 'AI & Security',
    description:
      'How AI affects security workflows, detection, and the evolving IAM landscape.',
    icon: CpuChipIcon,
  },
]

export default function About() {
  return (
    <>
      <Helmet>
        <title>About {siteBrand}</title>
        <meta
          name="description"
          content={`${siteBrand} is a cybersecurity and IAM blog with practical guides and analysis for security professionals.`}
        />
      </Helmet>

      <div className="min-h-screen bg-black">
        <PageHero
          icon={AcademicCapIcon}
          title={`About ${siteBrand}`}
          subtitle="Cybersecurity and IAM insights for practitioners and learners"
        />

        <GridSection className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-sm border border-[#00FBFF]/15 bg-black/50 p-8 backdrop-blur-sm">
              <h2 className="mb-6 text-2xl font-semibold text-white grid-hero-title-glow">
                Welcome to {siteBrand}
              </h2>
              <div className="space-y-4 text-white/75 leading-relaxed">
                <p>
                  {siteBrand} shares practical insights on cybersecurity and identity &amp; access
                  management (IAM).
                </p>
                <p>
                  This site exists to help security practitioners, IAM specialists, and curious learners
                  understand real-world challenges: how access is granted, how threats evolve, and how
                  to build more resilient systems without drowning in buzzwords. We welcome anyone interested
                  in contributing to the blog, having conversations, or saying hello. {siteBrand} is open
                  for collaboration and feedback, so please feel free to reach out.
                </p>
              </div>
            </div>
          </div>
        </GridSection>

        <section className="border-t border-[#00FBFF]/10 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-white grid-hero-title-glow sm:text-4xl">
                What you&apos;ll find here
              </h2>
              <p className="mt-4 text-lg text-white/60">
                Focused coverage of the topics covered most on {siteBrand}
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
              {focusAreas.map((area) => (
                <div
                  key={area.name}
                  className="rounded-sm border border-[#00FBFF]/15 bg-black/50 p-8 text-center backdrop-blur-sm"
                >
                  <area.icon className="mx-auto mb-4 h-12 w-12 text-[#00FBFF]" />
                  <h3 className="mb-2 text-xl font-semibold text-white">{area.name}</h3>
                  <p className="text-sm text-white/60">{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <GridSection className="py-16">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white grid-hero-title-glow">
              Get in touch
            </h2>
            <p className="mt-4 text-white/60">
              Questions, corrections, or collaboration ideas? We&apos;d love to hear from you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/blog"
                className="grid-hero-cta rounded-sm px-6 py-3 text-sm font-semibold uppercase tracking-wider"
              >
                Read the blog
              </Link>
              <Link
                to="/contact"
                className="rounded-sm border border-[#00FBFF]/30 px-6 py-3 text-sm font-semibold text-[#00FBFF] transition-colors hover:border-[#00FBFF] hover:bg-[#00FBFF]/10"
              >
                Contact us
              </Link>
            </div>
          </div>
        </GridSection>
      </div>
    </>
  )
}
