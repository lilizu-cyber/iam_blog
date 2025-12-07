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
import { formatDistanceToNow } from 'date-fns'
import { blogApi } from '../../services/api'
import LoadingSpinner from '../UI/LoadingSpinner'
import ErrorMessage from '../UI/ErrorMessage'
import OptimizedImage from '../UI/OptimizedImage'

export default function FeaturedPosts() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const { data: posts, isLoading, error } = useQuery(
    'featured-posts',
    () => blogApi.getPosts({ limit: 3, sortBy: 'publishedAt', sortOrder: 'desc' }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Articles</h2>
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
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Articles</h2>
            <div className="mt-8">
              <ErrorMessage message="Failed to load featured posts" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  const featuredPosts = posts?.data?.posts || []

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Featured Articles
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Most popular security insights from this week
          </p>
        </motion.div>

        {featuredPosts.length > 0 ? (
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {featuredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative card-hover hover-lift"
              >
                <Link to={`/blog/${post.slug}`} className="block">
                  {/* Featured Image */}
                  {post.featuredImage ? (
                    <div className="aspect-video overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700">
                      <OptimizedImage
                        src={post.featuredImage}
                        alt={post.featuredImage.alt || post.title}
                        size="medium"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        lazy={true}
                        aspectRatio="16/9"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center rounded-t-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                      {post.category?.id === 'security' || post.flags.isSecurityRelated ? (
                        <ShieldCheckIcon className="h-16 w-16 text-white" />
                      ) : post.category?.id === 'iam' || post.flags.isIAMRelated ? (
                        <KeyIcon className="h-16 w-16 text-white" />
                      ) : post.category?.id === 'ai' ? (
                        <CpuChipIcon className="h-16 w-16 text-white" />
                      ) : (
                        <div className="text-white text-2xl font-bold">
                          {post.title.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.flags.isSecurityRelated && (
                        <span className="badge-security">Security</span>
                      )}
                      {post.flags.isIAMRelated && (
                        <span className="badge-iam">IAM</span>
                      )}
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="badge-gray">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="mt-3 text-gray-600 dark:text-gray-300 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {post.metadata.readingTime} min read
                        </div>
                        <div className="flex items-center">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {post.metadata.viewCount}
                        </div>
                      </div>
                      <div>
                        {formatDistanceToNow(new Date(post.timestamps.publishedAt), { addSuffix: true })}
                      </div>
                    </div>

                    {/* Read More */}
                    <div className="mt-4 flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300">
                      Read article
                      <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No featured articles available at the moment.</p>
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
            className="btn-outline hover-lift"
          >
            View All Articles
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
