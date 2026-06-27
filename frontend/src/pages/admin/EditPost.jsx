import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import AdminHeader from '../../components/Admin/AdminHeader'
import FeaturedImagePicker from '../../components/Admin/FeaturedImagePicker'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { blogApi } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import ErrorMessage from '../../components/UI/ErrorMessage'
import { getFeaturedImageForPost, postMentionsOkta } from '../../utils/oktaFeaturedImage'
import { getPlainTextFromHtml, isEmptyHtml } from '../../utils/htmlContent'
import RichTextEditor from '../../components/Editor/RichTextEditor'

export default function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isPublishingRef = useRef(false)
  const editorRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    categoryId: '',
    seoTitle: '',
    seoDescription: '',
    featuredImage: null
  })

  // Fetch post data - refetch on mount to ensure fresh data
  const { data: response, isLoading, error } = useQuery(
    ['blog-post', id],
    () => blogApi.getPostById(id),
    {
      enabled: !!id,
      refetchOnMount: true, // Always refetch when component mounts
      refetchOnWindowFocus: false, // Don't refetch on window focus
      staleTime: 0, // Consider data stale immediately so it refetches
    }
  )

  // Update form data when query data changes
  useEffect(() => {
    if (response?.success && response?.data) {
      const post = response.data
      
      // Debug: Log the post data to see what we're receiving
      console.log('[EditPost] Loading post data:', {
        hasTitle: !!post.title,
        title: post.title,
        hasContent: !!post.content,
        contentLength: post.content ? post.content.length : 0,
        hasExcerpt: !!post.excerpt,
        excerpt: post.excerpt,
        hasTags: !!post.tags,
        tagsType: Array.isArray(post.tags) ? 'array' : typeof post.tags,
        tagsValue: post.tags,
        hasCategory: !!post.category,
        category: post.category,
        hasSeo: !!post.seo,
        seo: post.seo
      })
      
      // Safely handle tags - could be array, null, or undefined
      let tagsString = '';
      if (Array.isArray(post.tags) && post.tags.length > 0) {
        tagsString = post.tags.join(', ');
      } else if (post.tags && typeof post.tags === 'string') {
        tagsString = post.tags;
      }
      
      // Safely handle category
      const categoryId = post.category?.id || post.categoryId || '';
      
      // Safely handle SEO fields - ensure they exist
      const seoTitle = (post.seo && post.seo.title) ? post.seo.title : '';
      const seoDescription = (post.seo && post.seo.description) ? post.seo.description : '';
      
      // Build the form data object - ensure all fields have defaults
      const newFormData = {
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        tags: tagsString,
        categoryId: categoryId,
        seoTitle: seoTitle,
        seoDescription: seoDescription,
        featuredImage: post.featuredImage || null
      }
      
      // Debug: Log what we're setting
      console.log('[EditPost] Setting form data:', {
        title: newFormData.title,
        excerpt: newFormData.excerpt,
        tags: newFormData.tags,
        categoryId: newFormData.categoryId,
        seoTitle: newFormData.seoTitle,
        seoDescription: newFormData.seoDescription,
        hasContent: !!newFormData.content,
        contentLength: newFormData.content ? newFormData.content.length : 0
      })
      
      // Set all form data at once - don't do Okta image assignment here to avoid issues
      setFormData(newFormData)
    } else if (response && !response.success) {
      console.error('[EditPost] Failed to load post:', response)
    }
  }, [response])

  const updatePostMutation = useMutation(
    (postData) => blogApi.updatePost(id, postData),
    {
      onSuccess: () => {
        // Invalidate queries to ensure fresh data when navigating back
        queryClient.invalidateQueries(['blog-post', id])
        queryClient.invalidateQueries(['admin-posts'])
        
        // Only show toast if we're not in the middle of publishing
        if (!isPublishingRef.current) {
          toast.success('Post updated successfully!')
          navigate('/admin/posts')
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update post')
      }
    }
  )

  const publishPostMutation = useMutation(
    () => blogApi.publishPost(id),
    {
      onSuccess: () => {
        // Invalidate all relevant queries to ensure fresh data on Home page, Blog page, and everywhere
        queryClient.invalidateQueries(['blog-post', id])
        queryClient.invalidateQueries(['admin-posts'])
        queryClient.invalidateQueries(['recent-posts'])
        queryClient.invalidateQueries(['featured-posts'])
        queryClient.invalidateQueries(['blog-posts']) // This will invalidate all blog-posts queries with any parameters
        
        // Reset the flag
        isPublishingRef.current = false
        toast.success('Post published successfully!')
        navigate('/admin/posts')
      },
      onError: (error) => {
        // Reset the flag on error
        isPublishingRef.current = false
        toast.error(error.response?.data?.message || 'Failed to publish post')
      }
    }
  )

  const unpublishPostMutation = useMutation(
    () => blogApi.unpublishPost(id),
    {
      onSuccess: () => {
        // Invalidate all relevant queries to ensure fresh data
        queryClient.invalidateQueries(['blog-post', id])
        queryClient.invalidateQueries(['admin-posts'])
        queryClient.invalidateQueries(['recent-posts'])
        queryClient.invalidateQueries(['featured-posts'])
        queryClient.invalidateQueries(['blog-posts'])
        
        toast.success('Post unpublished successfully!')
        // Don't navigate away - let user continue editing
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to unpublish post')
      }
    }
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Use functional update to ensure we have the latest state
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        [name]: value
      }
      
      // Auto-assign Okta featured image if Okta is mentioned and no featured image is set
      if (postMentionsOkta(updatedFormData) && !updatedFormData.featuredImage) {
        try {
          const oktaImage = getFeaturedImageForPost(updatedFormData, null)
          if (oktaImage) {
            updatedFormData.featuredImage = oktaImage
          }
        } catch (error) {
          console.warn('[EditPost] Error in handleChange Okta check:', error)
        }
      }
      
      return updatedFormData
    })
  }

  const handleContentChange = (content) => {
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        content,
      }

      if (postMentionsOkta(updatedFormData) && !updatedFormData.featuredImage) {
        try {
          const oktaImage = getFeaturedImageForPost(updatedFormData, null)
          if (oktaImage) {
            updatedFormData.featuredImage = oktaImage
          }
        } catch (error) {
          console.warn('[EditPost] Error in content onChange Okta check:', error)
        }
      }

      return updatedFormData
    })
  }

  const buildPostData = () => {
    let processedTags = []
    if (Array.isArray(formData.tags)) {
      processedTags = formData.tags.filter(Boolean)
    } else if (typeof formData.tags === 'string') {
      processedTags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }

    const postData = {
      title: formData.title,
      content: formData.content,
      excerpt: formData.excerpt || '',
      tags: processedTags,
      categoryId: formData.categoryId || undefined,
      seoTitle: formData.seoTitle || undefined,
      seoDescription: formData.seoDescription || undefined,
      featuredImage: formData.featuredImage || undefined,
    }

    Object.keys(postData).forEach(key => {
      if (postData[key] === undefined) {
        delete postData[key]
      }
    })

    return postData
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEmptyHtml(formData.content)) {
      toast.error('Content is required')
      return
    }

    updatePostMutation.mutate(buildPostData())
  }

  const handlePublish = async () => {
    // First save the current changes, then publish
    try {
      // Set flag to suppress update toast
      isPublishingRef.current = true

      if (isEmptyHtml(formData.content)) {
        toast.error('Content is required')
        isPublishingRef.current = false
        return
      }

      const updateResult = await updatePostMutation.mutateAsync(buildPostData())
      
      if (updateResult.success) {
        // Then publish after successful save
        // This will show the "Post published successfully!" toast and navigate
        publishPostMutation.mutate()
      } else {
        isPublishingRef.current = false
        toast.error('Failed to save changes. Please try again.')
      }
    } catch (error) {
      isPublishingRef.current = false
      console.error('Error saving before publishing:', error)
      toast.error(error.response?.data?.message || 'Failed to save changes before publishing')
    }
  }

  const handleUnpublish = async () => {
    // Confirm before unpublishing
    if (!window.confirm('Are you sure you want to unpublish this post? It will no longer be visible to the public.')) {
      return
    }

    try {
      unpublishPostMutation.mutate()
    } catch (error) {
      console.error('Error unpublishing post:', error)
      toast.error(error.response?.data?.message || 'Failed to unpublish post')
    }
  }

  const getWordCount = (htmlContent) => {
    const text = getPlainTextFromHtml(htmlContent)
    if (!text) return 0
    return text.split(/\s+/).filter(Boolean).length
  }

  const getCharacterCount = (htmlContent) => getPlainTextFromHtml(htmlContent).length

  // Get current word and character counts (memoized for performance)
  const wordCount = useMemo(() => getWordCount(formData.content), [formData.content])
  const characterCount = useMemo(() => getCharacterCount(formData.content), [formData.content])
  
  // Calculate reading time (average reading speed: 200 words per minute)
  const readingTime = useMemo(() => {
    if (wordCount === 0) return 0
    return Math.ceil(wordCount / 200)
  }, [wordCount])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  if (error) {
    console.error('[EditPost] Error loading post:', error)
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ErrorMessage message="Failed to load post" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {error.message || 'An error occurred while loading the post'}
          </p>
        </div>
      </div>
    )
  }

  if (!response?.success || !response?.data) {
    console.warn('[EditPost] Invalid response structure:', response)
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ErrorMessage message="Post not found" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            The post data could not be loaded. Please try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  const post = response.data

  return (
    <>
      <Helmet>
        <title>Edit Post: {post.title} - Admin Dashboard</title>
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <AdminHeader 
          title="Edit Post" 
          subtitle="Update your article content and settings"
        />
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Basic Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Enter post title"
                  />
                </div>

                <div>
                  <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    rows={3}
                    value={formData.excerpt}
                    onChange={handleChange}
                    className="input w-full resize-none"
                    placeholder="Brief description of the post"
                  />
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content *
                  </label>
                  <RichTextEditor
                    key={id}
                    ref={editorRef}
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="Start writing your post content... Use the toolbar to format text, add code blocks, lists, images, and more."
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use the toolbar to format your content. Add code blocks, lists, images, and more.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">
                        <span className="text-primary-600 dark:text-primary-400">{wordCount.toLocaleString()}</span> words
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">•</span>
                      <span>
                        <span className="text-primary-600 dark:text-primary-400">{characterCount.toLocaleString()}</span> characters
                      </span>
                      {readingTime > 0 && (
                        <>
                          <span className="text-gray-400 dark:text-gray-500">•</span>
                          <span>
                            ~<span className="text-primary-600 dark:text-primary-400">{readingTime}</span> min read
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Featured Image
              </h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                This image represents the post on listing cards, the article hero, and social previews.
              </p>
              <FeaturedImagePicker
                value={formData.featuredImage}
                alt={formData.title}
                onChange={(featuredImage) =>
                  setFormData((prev) => ({ ...prev, featuredImage }))
                }
              />
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Categorization
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="input w-full"
                  >
                    <option value="">Select a category</option>
                    <option value="security">Cybersecurity</option>
                    <option value="iam">Identity & Access Management</option>
                    <option value="ai">AI & Security</option>
                    <option value="compliance">Compliance</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Separate tags with commas
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                SEO Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    id="seoTitle"
                    name="seoTitle"
                    value={formData.seoTitle}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="SEO optimized title"
                  />
                </div>

                <div>
                  <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    id="seoDescription"
                    name="seoDescription"
                    rows={3}
                    value={formData.seoDescription}
                    onChange={handleChange}
                    className="input w-full resize-none"
                    placeholder="SEO meta description"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/posts')}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePostMutation.isLoading}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatePostMutation.isLoading ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
              
              <div className="flex space-x-4">
                {post.status === 'published' && (
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    disabled={unpublishPostMutation.isLoading}
                    className="btn-outline border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unpublishPostMutation.isLoading ? 'Unpublishing...' : 'Unpublish'}
                  </button>
                )}
                
                {post.status !== 'published' && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishPostMutation.isLoading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {publishPostMutation.isLoading ? 'Publishing...' : 'Publish'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
