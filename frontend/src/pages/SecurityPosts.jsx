import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { blogApi } from '../services/api'
import BlogGrid from '../components/Blog/BlogGrid'
import PageHero from '../components/UI/PageHero'

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
        <title>Cybersecurity Articles - cyberiam</title>
        <meta name="description" content="Explore our comprehensive collection of cybersecurity articles, threat analysis, and security best practices." />
      </Helmet>

      <div className="min-h-screen bg-black">
        <PageHero
          icon={ShieldCheckIcon}
          title="Cybersecurity Insights"
          subtitle="Stay ahead of threats with expert analysis and security best practices"
        />
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
