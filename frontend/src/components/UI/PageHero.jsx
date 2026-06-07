import GridBackground from './GridBackground'

/**
 * Page title banner matching the home hero cyber grid aesthetic.
 */
export default function PageHero({ title, subtitle, icon: Icon, className = 'py-20' }) {
  return (
    <section className={`relative overflow-hidden bg-black ${className}`}>
      <GridBackground />
      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        {Icon && (
          <Icon className="mx-auto mb-6 h-12 w-12 text-[#00FBFF] grid-hero-title-glow sm:h-14 sm:w-14" />
        )}
        <h1 className="text-4xl font-semibold text-white sm:text-5xl grid-hero-title-glow">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">{subtitle}</p>
        )}
      </div>
    </section>
  )
}
