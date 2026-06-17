import { Link } from 'react-router-dom'

const navigation = {
  main: [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: 'Security', href: '/security' },
    { name: 'IAM', href: '/iam' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
  categories: [
    { name: 'Cybersecurity', href: '/security' },
    { name: 'Identity Management', href: '/iam' },
    { name: 'AI & Security', href: '/blog?tag=ai-security' },
    { name: 'Compliance', href: '/blog?tag=compliance' },
    { name: 'Best Practices', href: '/blog?tag=best-practices' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Disclaimer', href: '/disclaimer' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-[#00FBFF]/10 bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="xl:col-span-1">
            <Link to="/" className="inline-block">
              <span className="text-xl font-bold uppercase tracking-[0.2em] text-[#00FBFF] grid-logo-glow">
                cyberiam.blog
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-white/60">
              Cybersecurity and IAM insights. Practical guides and analysis for security
              professionals.
            </p>
          </div>

          {/* Links */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#00FBFF]">
                  Navigation
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.main.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm text-white/60 transition-colors hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#00FBFF]">
                  Categories
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.categories.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm text-white/60 transition-colors hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#00FBFF]">
                  Legal
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm text-white/60 transition-colors hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-[#00FBFF]/10 pt-8">
          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} cyberiam.blog
          </p>
        </div>
      </div>
    </footer>
  )
}
