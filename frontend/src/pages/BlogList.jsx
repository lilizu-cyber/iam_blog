import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'
import { 
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  EyeIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import { formatRelativeTime, getPostDisplayDate } from '../utils/dateUtils'
import { motion } from 'framer-motion'
import { blogApi } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import ErrorMessage from '../components/UI/ErrorMessage'
import OptimizedImage from '../components/UI/OptimizedImage'
import PageHero from '../components/UI/PageHero'
import { BannerAd } from '../components/Ads/GoogleAdSense'
import { adsConfig } from '../config/ads'

const sortOptions = [
  { value: 'createdAt:desc', label: 'Latest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'title:asc', label: 'Title A-Z' },
  { value: 'title:desc', label: 'Title Z-A' },
  { value: 'viewCount:desc', label: 'Most Viewed' },
  { value: 'popularityScore:desc', label: 'Most Popular' },
]

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)

  // Get current filters from URL
  const currentPage = parseInt(searchParams.get('page')) || 1
  const currentSort = searchParams.get('sort') || 'createdAt:desc'
  const currentCategory = searchParams.get('category') || ''
  const currentTag = searchParams.get('tag') || ''
  const securityOnly = searchParams.get('security') === 'true'
  const iamOnly = searchParams.get('iam') === 'true'

  // Parse sort option
  const [sortBy, sortOrder] = currentSort.split(':')

  // Fetch posts
  const { data, isLoading, error } = useQuery(
    ['blog-posts', currentPage, sortBy, sortOrder, currentCategory, currentTag, securityOnly, iamOnly],
    () => blogApi.getPosts({
      page: currentPage,
      limit: 12,
      sortBy,
      sortOrder,
      ...(currentCategory && { categoryId: currentCategory }),
      ...(currentTag && { tag: currentTag }),
      ...(securityOnly && { securityOnly: true }),
      ...(iamOnly && { iamOnly: true }),
    }),
    {
      keepPreviousData: true,
      staleTime: 30 * 1000, // 30 seconds - reduced from 2 minutes to show new posts faster
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnMount: true, // Always refetch when component mounts
    }
  )

  const posts = data?.data?.posts || []
  const pagination = data?.data?.pagination || {}

  const updateFilters = (newFilters) => {
    const newParams = new URLSearchParams(searchParams)
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    
    // Reset to page 1 when filters change
    if (newFilters.page === undefined) {
      newParams.set('page', '1')
    }
    
    setSearchParams(newParams)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      updateFilters({ search: searchQuery.trim() })
    } else {
      updateFilters({ search: '' })
    }
  }

  const handlePageChange = (page) => {
    updateFilters({ page: page.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Helmet>
        <title>Blog - CyberSec & IAM Insights</title>
        <meta name="description" content="Browse all our cybersecurity and identity management articles. Find expert insights, tutorials, and industry analysis." />
        <link rel="canonical" href={`${window.location.origin}/blog`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/blog`} />
        <meta property="og:title" content="Blog - CyberSec & IAM Insights" />
        <meta property="og:description" content="Browse all our cybersecurity and identity management articles. Find expert insights, tutorials, and industry analysis." />
        <meta property="og:site_name" content="CyberSec & IAM Blog" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content={`${window.location.origin}/blog`} />
        <meta name="twitter:title" content="Blog - CyberSec & IAM Insights" />
        <meta name="twitter:description" content="Browse all our cybersecurity and identity management articles." />
        
        {/* SEO */}
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-black">
        <PageHero
          title="Security Insights Blog"
          subtitle="Expert analysis on cybersecurity and identity management"
        />

        {/* Search and Filters */}
        <div className="border-b border-[#00FBFF]/10 bg-black/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </form>

              {/* Sort and Filter Controls */}
              <div className="flex items-center gap-4">
                <select
                  value={currentSort}
                  onChange={(e) => updateFilters({ sort: e.target.value })}
                  className="input"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn-outline flex items-center"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={currentCategory}
                      onChange={(e) => updateFilters({ category: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">All Categories</option>
                      <option value="security">Security</option>
                      <option value="iam">Identity Management</option>
                      <option value="ai">AI & Security</option>
                      <option value="compliance">Compliance</option>
                    </select>
                  </div>

                  {/* Topic Filters */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Topic Focus
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={securityOnly}
                          onChange={(e) => updateFilters({ security: e.target.checked ? 'true' : '' })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <ShieldCheckIcon className="ml-2 mr-1 h-4 w-4 text-security-600" />
                        <span className="text-sm">Security Only</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={iamOnly}
                          onChange={(e) => updateFilters({ iam: e.target.checked ? 'true' : '' })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <KeyIcon className="ml-2 mr-1 h-4 w-4 text-iam-600" />
                        <span className="text-sm">IAM Only</span>
                      </label>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchParams({})
                        setSearchQuery('')
                      }}
                      className="btn-ghost w-full"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <ErrorMessage message="Failed to load blog posts" />
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/50 text-lg">
                No articles found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSearchParams({})
                  setSearchQuery('')
                }}
                className="mt-4 btn-primary"
              >
                View All Articles
              </button>
            </div>
          ) : (
            <>
              {/* Results Info */}
              <div className="mb-8">
                <p className="text-white/60">
                  Showing {posts.length} of {pagination.total} articles
                  {(securityOnly || iamOnly || currentCategory || currentTag) && (
                    <span className="ml-2 text-sm">
                      (filtered)
                    </span>
                  )}
                </p>
              </div>

              {adsConfig.slots.blogListBanner && (
                <div className="mb-8">
                  <BannerAd adSlot={adsConfig.slots.blogListBanner} />
                </div>
              )}

              {/* Posts Grid */}
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
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        <p className="mt-3 text-gray-600 dark:text-gray-300 line-clamp-3">
                          {post.excerpt}
                        </p>

                        {/* Meta */}
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
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
                        <div className="mt-4 flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300">
                          Read more
                          <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-12 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            page === currentPage
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
