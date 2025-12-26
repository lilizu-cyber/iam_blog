import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { 
  ClockIcon, 
  EyeIcon, 
  CalendarIcon,
  UserIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline'
import { formatRelativeTime, formatAbsoluteTime } from '../utils/dateUtils'
// Note: We're using HTML rendering instead of Markdown since ReactQuill outputs HTML
// The backend sanitizes the HTML content, so it's safe to render
import { blogApi } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import ErrorMessage from '../components/UI/ErrorMessage'
import OptimizedImage from '../components/UI/OptimizedImage'
import { trackEvents } from '../services/analytics'
import toast from 'react-hot-toast'

export default function BlogPost() {
  const { slug } = useParams()

  const { data: response, isLoading, error } = useQuery(
    ['blog-post', slug],
    () => blogApi.getPostBySlug(slug),
    {
      enabled: !!slug,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  // Track page view when post is loaded (only if analytics consent given)
  useEffect(() => {
    if (response?.success && response?.data) {
      const post = response.data
      trackEvents.postView(post.id, post.title)
    }
  }, [response])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  if (error || !response?.success) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ErrorMessage message="Article not found" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            The article you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const post = response.data
  const postUrl = `${window.location.origin}/blog/${post.slug}`
  const siteUrl = window.location.origin

  // Handle share functionality
  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.excerpt || post.title,
      url: postUrl
    }

    try {
      // Check if Web Share API is available (mobile browsers)
      if (navigator.share) {
        await navigator.share(shareData)
        // Track share event
        trackEvents.postShare(post.id, 'native')
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(postUrl)
        // Show toast notification
        toast.success('Link copied to clipboard!')
        // Track share event
        trackEvents.postShare(post.id, 'copy')
      }
    } catch (error) {
      // User cancelled share or error occurred
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error)
        // Fallback to copy if share fails
        try {
          await navigator.clipboard.writeText(postUrl)
          toast.success('Link copied to clipboard!')
          trackEvents.postShare(post.id, 'copy')
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError)
        }
      }
    }
  }

  // Generate JSON-LD structured data for SEO and AI models
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.seo.description || post.excerpt,
    "image": post.featuredImage ? post.featuredImage.url : `${siteUrl}/og-image.jpg`,
    "datePublished": post.timestamps.publishedAt,
    "dateModified": post.timestamps.updatedAt || post.timestamps.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.author.name,
      "email": post.author.email,
      ...(post.author.avatar && { "image": post.author.avatar })
    },
    "publisher": {
      "@type": "Organization",
      "name": "CyberSec & IAM Blog",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/images/icon-512x512.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "articleSection": post.category?.name || "Cybersecurity",
    "keywords": post.tags.join(', '),
    "wordCount": post.metadata.wordCount,
    "timeRequired": `PT${post.metadata.readingTime}M`,
    "inLanguage": "en-US",
    "isAccessibleForFree": true,
    ...(post.category && {
      "articleSection": post.category.name
    })
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${siteUrl}/blog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl
      }
    ]
  }

  return (
    <>
      <Helmet>
        <title>{post.seo.title || post.title} - CyberSec & IAM Blog</title>
        <meta name="description" content={post.seo.description || post.excerpt} />
        <meta name="keywords" content={post.tags.join(', ')} />
        <link rel="canonical" href={postUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
        <meta property="og:title" content={post.seo.title || post.title} />
        <meta property="og:description" content={post.seo.description || post.excerpt} />
        <meta property="og:site_name" content="CyberSec & IAM Blog" />
        {post.featuredImage && (
          <>
            <meta property="og:image" content={post.featuredImage.url} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={post.featuredImage.alt || post.title} />
          </>
        )}
        <meta property="og:locale" content="en_US" />
        
        {/* Article specific Open Graph */}
        <meta property="article:published_time" content={post.timestamps.publishedAt} />
        <meta property="article:modified_time" content={post.timestamps.updatedAt || post.timestamps.publishedAt} />
        <meta property="article:author" content={post.author.name} />
        <meta property="article:section" content={post.category?.name || "Cybersecurity"} />
        {post.tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={postUrl} />
        <meta name="twitter:title" content={post.seo.title || post.title} />
        <meta name="twitter:description" content={post.seo.description || post.excerpt} />
        {post.featuredImage && (
          <meta name="twitter:image" content={post.featuredImage.url} />
        )}
        <meta name="twitter:creator" content="@cybersec_iam" />
        <meta name="twitter:site" content="@cybersec_iam" />
        
        {/* Additional SEO meta tags */}
        <meta name="author" content={post.author.name} />
        <meta name="article:author" content={post.author.name} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <article className="bg-white dark:bg-gray-900 min-h-screen">
        {/* Hero Section */}
        <div className="relative">
          {(() => {
            const imageUrl = post.featuredImage?.url || (typeof post.featuredImage === 'string' ? post.featuredImage : null);
            const isOktaImage = imageUrl && (imageUrl.includes('okta-featured-image.png') || imageUrl.includes('okta-featured-image'));
            
            if (isOktaImage || !post.featuredImage) {
              return (
                <div className="aspect-[21/9] bg-gradient-to-br from-cyan-500 to-blue-600 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              );
            }
            
            return (
              <div className="aspect-[21/9] overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                <OptimizedImage
                  src={post.featuredImage}
                  alt={post.featuredImage.alt || post.title}
                  size="large"
                  className="h-full w-full object-cover"
                  lazy={false}
                  aspectRatio="21/9"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            );
          })()}
          
          {/* Article Header Overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="w-full bg-gradient-to-t from-black/80 to-transparent">
              <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.flags.isSecurityRelated && (
                    <span className="badge bg-security-600 text-white">Security</span>
                  )}
                  {post.flags.isIAMRelated && (
                    <span className="badge bg-iam-600 text-white">IAM</span>
                  )}
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="badge bg-white/20 text-white backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                  {post.title}
                </h1>

                {/* Excerpt */}
                <p className="mt-4 text-xl text-gray-200 max-w-3xl">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="mt-8 flex flex-wrap items-center gap-6 text-gray-300">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    <span>{post.author.name}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    <span>{formatAbsoluteTime(post.timestamps.publishedAt, 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>{post.metadata.readingTime} min read</span>
                  </div>
                  <div className="flex items-center">
                    <EyeIcon className="h-5 w-5 mr-2" />
                    <span>{post.metadata.viewCount} views</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {post.content && post.content.trim() ? (
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none text-left blog-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              ) : (
                <div className="prose prose-lg dark:prose-invert max-w-none text-left">
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    Content is not available for this article. Please try refreshing the page or contact support if the issue persists.
                  </p>
                </div>
              )}

              {/* Article Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Published {formatRelativeTime(post.timestamps.publishedAt)}
                    {post.timestamps.updatedAt && post.timestamps.updatedAt !== post.timestamps.publishedAt && (
                      <span className="ml-2">
                        • Updated {formatRelativeTime(post.timestamps.updatedAt)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={handleShare}
                      className="btn-ghost text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="Share this article"
                    >
                      <ShareIcon className="h-4 w-4 mr-2" />
                      Share
                    </button>
                    <button className="btn-ghost text-sm">
                      <BookmarkIcon className="h-4 w-4 mr-2" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-8">
                {/* Author Info */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    About the Author
                  </h3>
                  <div className="flex items-center space-x-3">
                    {post.author.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                        {post.author.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {post.author.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Security Expert
                      </div>
                    </div>
                  </div>
                </div>

                {/* Article Stats */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Article Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Views</span>
                      <span className="font-medium">{post.metadata.viewCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Reading Time</span>
                      <span className="font-medium">{post.metadata.readingTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Word Count</span>
                      <span className="font-medium">{post.metadata.wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Likes</span>
                      <span className="font-medium">{post.metadata.likeCount}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="badge-gray">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
