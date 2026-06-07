import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'
import { KeyIcon } from '@heroicons/react/24/outline'
import { blogApi } from '../services/api'
import BlogGrid from '../components/Blog/BlogGrid'
import PageHero from '../components/UI/PageHero'

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
        <title>Identity & Access Management - cyberiam</title>
        <meta name="description" content="Comprehensive guides on identity and access management, authentication, authorization, and IAM best practices." />
      </Helmet>

      <div className="min-h-screen bg-black">
        <PageHero
          icon={KeyIcon}
          title="Identity & Access Management"
          subtitle="Master IAM concepts, best practices, and implementation strategies"
        />
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
