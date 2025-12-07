import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { blogApi } from '../services/api'
import BlogGrid from '../components/Blog/BlogGrid'

export default function SecurityPosts() {
  const { data, isLoading, error } = useQuery(
    'security-posts',
    () => blogApi.getSecurityPosts({ limit: 12 }),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  return (
    <>
      <Helmet>
        <title>Cybersecurity Articles - CyberSec & IAM Blog</title>
        <meta name="description" content="Explore our comprehensive collection of cybersecurity articles, threat analysis, and security best practices." />
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <ShieldCheckIcon className="mx-auto h-16 w-16 text-white mb-6" />
              <h1 className="text-4xl font-bold text-white sm:text-5xl">
                Cybersecurity Insights
              </h1>
              <p className="mt-4 text-xl text-security-100">
                Stay ahead of threats with expert analysis and security best practices
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <BlogGrid
          data={data}
          isLoading={isLoading}
          error={error}
          emptyMessage="No cybersecurity articles available at the moment."
        />
      </div>
    </>
  )
}
