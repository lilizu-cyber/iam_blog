import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { 
  ClockIcon, 
  EyeIcon, 
  ArrowRightIcon,
  ShieldCheckIcon,
  KeyIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { formatRelativeTime } from '../../utils/dateUtils'
import { blogApi } from '../../services/api'
import LoadingSpinner from '../UI/LoadingSpinner'
import ErrorMessage from '../UI/ErrorMessage'
import OptimizedImage from '../UI/OptimizedImage'

export default function RecentPosts() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const { data: posts, isLoading, error } = useQuery(
    'recent-posts',
    () => blogApi.getPosts({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
    {
      staleTime: 30 * 1000, // 30 seconds - reduced from 5 minutes to show new posts faster
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnMount: true, // Always refetch when component mounts
    }
  )

  if (isLoading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Latest Articles</h2>
            <div className="mt-8">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Latest Articles</h2>
            <div className="mt-8">
              <ErrorMessage message="Failed to load recent posts" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  const recentPosts = posts?.data?.posts || []

  return (
    <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Latest Articles
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Fresh insights and analysis from our security experts
          </p>
        </motion.div>

        {recentPosts.length > 0 ? (
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {recentPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="group flex flex-col sm:flex-row card-hover hover-lift"
              >
                <Link to={`/blog/${post.slug}`} className="flex flex-col sm:flex-row w-full">
                  {/* Image */}
                  <div className="sm:w-48 flex-shrink-0">
                    {(() => {
                      const imageUrl = post.featuredImage?.url || (typeof post.featuredImage === 'string' ? post.featuredImage : null);
                      const isOktaImage = imageUrl && (imageUrl.includes('okta-featured-image.png') || imageUrl.includes('okta-featured-image'));
                      
                      if (isOktaImage || !post.featuredImage) {
                        return (
                          <div className="aspect-video sm:aspect-square flex items-center justify-center rounded-t-lg sm:rounded-l-lg sm:rounded-t-none bg-gradient-to-br from-cyan-500 to-blue-600">
                            <ShieldCheckIcon className="h-12 w-12 text-white" />
                          </div>
                        );
                      }
                      
                      return (
                        <div className="aspect-video sm:aspect-square overflow-hidden rounded-t-lg sm:rounded-l-lg sm:rounded-t-none bg-gray-100 dark:bg-gray-700">
                          <OptimizedImage
                            src={post.featuredImage}
                            alt={post.featuredImage.alt || post.title}
                            size="small"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            lazy={true}
                            aspectRatio="16/9"
                          />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.flags.isSecurityRelated && (
                        <span className="badge-security text-xs">Security</span>
                      )}
                      {post.flags.isIAMRelated && (
                        <span className="badge-iam text-xs">IAM</span>
                      )}
                      {post.tags.slice(0, 1).map((tag) => (
                        <span key={tag} className="badge-gray text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2 text-sm">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {post.metadata.readingTime} min
                        </div>
                        <div className="flex items-center">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          {post.metadata.viewCount}
                        </div>
                      </div>
                      <div>
                        {formatRelativeTime(post.timestamps.publishedAt)}
                      </div>
                    </div>

                    {/* Read More */}
                    <div className="mt-3 flex items-center text-primary-600 dark:text-primary-400 font-medium text-sm group-hover:text-primary-700 dark:group-hover:text-primary-300">
                      Read article
                      <ArrowRightIcon className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No recent articles available.</p>
          </div>
        )}

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Link
            to="/blog"
            className="btn-primary hover-lift"
          >
            View All Articles
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
