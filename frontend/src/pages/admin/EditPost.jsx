import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import AdminHeader from '../../components/Admin/AdminHeader'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { blogApi } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import ErrorMessage from '../../components/UI/ErrorMessage'

export default function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isPublishingRef = useRef(false)
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
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        tags: post.tags.join(', ') || '',
        categoryId: post.category?.id || '',
        seoTitle: post.seo.title || '',
        seoDescription: post.seo.description || '',
        featuredImage: post.featuredImage
      })
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
        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries(['blog-post', id])
        queryClient.invalidateQueries(['admin-posts'])
        
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const postData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      categoryId: formData.categoryId || undefined,
      featuredImage: formData.featuredImage || undefined
    }
    
    // Remove undefined values
    Object.keys(postData).forEach(key => {
      if (postData[key] === undefined) {
        delete postData[key]
      }
    })
    
    updatePostMutation.mutate(postData)
  }

  const handlePublish = async () => {
    // First save the current changes, then publish
    try {
      // Set flag to suppress update toast
      isPublishingRef.current = true
      
      const postData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        categoryId: formData.categoryId || undefined,
        featuredImage: formData.featuredImage || undefined
      }
      
      // Remove undefined values
      Object.keys(postData).forEach(key => {
        if (postData[key] === undefined) {
          delete postData[key]
        }
      })

      // Save changes first (wait for it to complete)
      const updateResult = await updatePostMutation.mutateAsync(postData)
      
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
        <ErrorMessage message="Post not found" />
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
                  <textarea
                    id="content"
                    name="content"
                    rows={20}
                    required
                    value={formData.content}
                    onChange={handleChange}
                    className="input w-full resize-none font-mono text-sm"
                    placeholder="Write your post content in Markdown..."
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Supports Markdown formatting
                  </p>
                </div>
              </div>
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
          </form>
        </div>
      </div>
    </>
  )
}
