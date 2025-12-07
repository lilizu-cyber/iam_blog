import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Disclosure } from '@headlessui/react'
import { 
  Bars3Icon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  KeyIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { useThemeStore } from '../../stores/themeStore'
import SearchModal from '../Search/SearchModal'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { 
    name: 'Security', 
    href: '/security',
    icon: ShieldCheckIcon,
    description: 'Cybersecurity insights and best practices'
  },
  { 
    name: 'IAM', 
    href: '/iam',
    icon: KeyIcon,
    description: 'Identity and Access Management topics'
  },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`)
    setIsSearchOpen(false)
  }

  return (
    <>
      <Disclosure as="nav" className={classNames(
        "sticky top-0 z-40 transition-all duration-200",
        isScrolled 
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700" 
          : "bg-white dark:bg-gray-900"
      )}>
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between">
                <div className="flex">
                  {/* Logo */}
                  <div className="flex flex-shrink-0 items-center">
                    <Link to="/" className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <ShieldCheckIcon className="h-8 w-8 text-security-600" />
                        <KeyIcon className="h-6 w-6 text-iam-600" />
                      </div>
                      <div className="hidden sm:block">
                        <span className="text-xl font-bold gradient-text">
                          CyberSec & IAM
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                          Security Insights
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Desktop navigation */}
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {navigation.map((item) => {
                      const isActive = location.pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={classNames(
                            isActive
                              ? 'border-primary-500 text-gray-900 dark:text-white'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100',
                            'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors duration-200'
                          )}
                        >
                          {item.icon && (
                            <item.icon className="mr-2 h-4 w-4" />
                          )}
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Right side */}
                <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                  {/* Search button */}
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="rounded-md p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <span className="sr-only">Search</span>
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>

                  {/* Theme toggle */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="rounded-md p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <span className="sr-only">Toggle theme</span>
                    {theme === 'dark' ? (
                      <SunIcon className="h-5 w-5" />
                    ) : (
                      <MoonIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Mobile menu button */}
                <div className="flex items-center sm:hidden">
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="mr-2 rounded-md p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                  
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            {/* Mobile menu */}
            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 pb-3 pt-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      to={item.href}
                      className={classNames(
                        isActive
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                          : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                        'block border-l-4 py-2 pl-3 pr-4 text-base font-medium transition-colors duration-200'
                      )}
                    >
                      <div className="flex items-center">
                        {item.icon && (
                          <item.icon className="mr-3 h-5 w-5" />
                        )}
                        <div>
                          <div>{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </Disclosure.Button>
                  )
                })}
                
                {/* Mobile theme toggle */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  >
                    {theme === 'dark' ? (
                      <>
                        <SunIcon className="mr-3 h-5 w-5" />
                        Light mode
                      </>
                    ) : (
                      <>
                        <MoonIcon className="mr-3 h-5 w-5" />
                        Dark mode
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
      />
    </>
  )
}
