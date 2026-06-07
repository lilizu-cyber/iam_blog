import { Link } from 'react-router-dom'
import { 
  ClockIcon, 
  EyeIcon, 
  ArrowRightIcon,
  ShieldCheckIcon,
  KeyIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { formatRelativeTime, getPostDisplayDate } from '../../utils/dateUtils'
import { motion } from 'framer-motion'
import LoadingSpinner from '../UI/LoadingSpinner'
import ErrorMessage from '../UI/ErrorMessage'
import OptimizedImage from '../UI/OptimizedImage'

export default function BlogGrid({ data, isLoading, error, emptyMessage }) {
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <ErrorMessage message="Failed to load articles" />
      </div>
    )
  }

  const posts = data?.data?.posts || []

  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-white/50 text-lg">
            {emptyMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="card-hover hover-lift group"
          >
            <Link to={`/blog/${post.slug}`}>
              {/* Featured Image */}
              {(() => {
                const imageUrl = post.featuredImage?.url || (typeof post.featuredImage === 'string' ? post.featuredImage : null);
                const isOktaImage = imageUrl && (imageUrl.includes('okta-featured-image.png') || imageUrl.includes('okta-featured-image'));
                
                if (isOktaImage || !post.featuredImage) {
                  return (
                    <div className="aspect-video flex items-center justify-center rounded-t-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                      <ShieldCheckIcon className="h-16 w-16 text-white" />
                    </div>
                  );
                }
                
                return (
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
                );
              })()}

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
                <h2 className="text-xl font-semibold text-white group-hover:text-[#00FBFF] transition-colors line-clamp-2">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="mt-3 text-white/65 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="mt-4 flex items-center justify-between text-sm text-white/45">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {post.metadata.readingTime} min
                    </div>
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {post.metadata.viewCount}
                    </div>
                  </div>
                  <div>
                    {formatRelativeTime(getPostDisplayDate(post.timestamps))}
                  </div>
                </div>

                {/* Read More */}
                <div className="mt-4 flex items-center text-[#00FBFF] font-medium group-hover:text-[#00FBFF]/80">
                  Read more
                  <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </div>
  )
}
