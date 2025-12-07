import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ExclamationTriangleIcon, HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found - CyberSec & IAM Blog</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to our cybersecurity and IAM blog homepage." />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <ExclamationTriangleIcon className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Page Not Found
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back to exploring our security insights.
          </p>
          
          <div className="space-y-4">
            <Link
              to="/"
              className="btn-primary w-full flex items-center justify-center"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Back to Homepage
            </Link>
            
            <Link
              to="/blog"
              className="btn-outline w-full flex items-center justify-center"
            >
              Browse Articles
            </Link>
            
            <Link
              to="/search"
              className="btn-ghost w-full flex items-center justify-center"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Search Articles
            </Link>
          </div>
          
          <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
            <p>Popular sections:</p>
            <div className="mt-2 space-x-4">
              <Link to="/security" className="text-security-600 hover:text-security-700">
                Security
              </Link>
              <Link to="/iam" className="text-iam-600 hover:text-iam-700">
                IAM
              </Link>
              <Link to="/about" className="text-primary-600 hover:text-primary-700">
                About
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
