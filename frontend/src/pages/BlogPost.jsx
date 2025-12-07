import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'
import { 
  ClockIcon, 
  EyeIcon, 
  CalendarIcon,
  UserIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow, format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { blogApi } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import ErrorMessage from '../components/UI/ErrorMessage'
import OptimizedImage from '../components/UI/OptimizedImage'

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

  return (
    <>
      <Helmet>
        <title>{post.seo.title || post.title} - CyberSec & IAM Blog</title>
        <meta name="description" content={post.seo.description || post.excerpt} />
        <meta name="keywords" content={post.tags.join(', ')} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${window.location.origin}/blog/${post.slug}`} />
        {post.featuredImage && (
          <meta property="og:image" content={post.featuredImage.url} />
        )}
        
        {/* Article specific */}
        <meta property="article:published_time" content={post.timestamps.publishedAt} />
        <meta property="article:author" content={post.author.name} />
        {post.tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
      </Helmet>

      <article className="bg-white dark:bg-gray-900 min-h-screen">
        {/* Hero Section */}
        <div className="relative">
          {post.featuredImage ? (
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
          ) : (
            <div className="aspect-[21/9] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800" />
          )}
          
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
                    <span>{format(new Date(post.timestamps.publishedAt), 'MMMM d, yyyy')}</span>
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
              <div className="prose prose-lg dark:prose-dark max-w-none text-left [&>*]:text-left [&>*]:ml-0 [&>*]:pl-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Custom components for better styling
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4 text-left">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 text-left">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3 text-left">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed text-left indent-0">
                        {children}
                      </p>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20 p-4 my-6 italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, children, ...props }) => (
                      inline ? (
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto" {...props}>
                          {children}
                        </code>
                      )
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-4 ml-0 pl-4 text-left">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-700 dark:text-gray-300 mb-2 text-left pl-0 ml-0">
                        {children}
                      </li>
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>

              {/* Article Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Published {formatDistanceToNow(new Date(post.timestamps.publishedAt), { addSuffix: true })}
                    {post.timestamps.updatedAt && post.timestamps.updatedAt !== post.timestamps.publishedAt && (
                      <span className="ml-2">
                        • Updated {formatDistanceToNow(new Date(post.timestamps.updatedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button className="btn-ghost text-sm">
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
