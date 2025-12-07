import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'
import { KeyIcon } from '@heroicons/react/24/outline'
import { blogApi } from '../services/api'
import BlogGrid from '../components/Blog/BlogGrid'

export default function IAMPosts() {
  const { data, isLoading, error } = useQuery(
    'iam-posts',
    () => blogApi.getIAMPosts({ limit: 12 }),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  return (
    <>
      <Helmet>
        <title>Identity & Access Management - CyberSec & IAM Blog</title>
        <meta name="description" content="Comprehensive guides on identity and access management, authentication, authorization, and IAM best practices." />
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <KeyIcon className="mx-auto h-16 w-16 text-white mb-6" />
              <h1 className="text-4xl font-bold text-white sm:text-5xl">
                Identity & Access Management
              </h1>
              <p className="mt-4 text-xl text-iam-100">
                Master IAM concepts, best practices, and implementation strategies
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <BlogGrid
          data={data}
          isLoading={isLoading}
          error={error}
          emptyMessage="No IAM articles available at the moment."
        />
      </div>
    </>
  )
}
