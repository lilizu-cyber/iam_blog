import GridBackground from './GridBackground'

/**
 * Section wrapper matching the home hero cyber grid aesthetic.
 */
export default function GridSection({ children, className = 'py-16' }) {
  return (
    <section className={`relative overflow-hidden bg-black ${className}`}>
      <GridBackground />
      <div className="relative z-10">{children}</div>
    </section>
  )
}
