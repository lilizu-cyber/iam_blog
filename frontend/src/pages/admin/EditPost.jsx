import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import AdminHeader from '../../components/Admin/AdminHeader'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { blogApi } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import ErrorMessage from '../../components/UI/ErrorMessage'
import { getFeaturedImageForPost, postMentionsOkta } from '../../utils/oktaFeaturedImage'

export default function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isPublishingRef = useRef(false)
  const quillRef = useRef(null)
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

  // Set up Quill text-change handler to clean duplicates in real-time
  useEffect(() => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return

    let isCleaning = false

    const handleTextChange = () => {
      // Prevent infinite loops
      if (isCleaning) return
      
      const html = quill.root.innerHTML
      const cleaned = cleanListContent(html)
      
      // Only update if content changed
      if (cleaned !== html) {
        isCleaning = true
        const selection = quill.getSelection()
        const length = quill.getLength()
        
        quill.root.innerHTML = cleaned
        const newLength = quill.getLength()
        
        // Restore cursor position (adjust if content length changed)
        if (selection) {
          setTimeout(() => {
            const adjustedIndex = Math.min(selection.index, newLength - 1)
            quill.setSelection(adjustedIndex, selection.length)
            isCleaning = false
          }, 0)
        } else {
          isCleaning = false
        }
      }
    }

    quill.on('text-change', handleTextChange)
    
    return () => {
      quill.off('text-change', handleTextChange)
    }
  }, []) // Empty dependency array - only set up once

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

  // Clean HTML content to remove duplicate list numbers/dots that Quill adds
  // This uses aggressive regex and DOM manipulation to catch all patterns
  const cleanListContent = (html) => {
    if (!html || typeof html !== 'string') return html
    
    try {
      // Use DOM manipulation for more reliable cleaning
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      
      // Clean ordered list items - remove duplicate numbers
      const olItems = tempDiv.querySelectorAll('ol li')
      olItems.forEach(li => {
        try {
          // Get the first text node (which often contains the duplicate number)
          const walker = document.createTreeWalker(
            li,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            {
              acceptNode: function(node) {
                // Only process text nodes and non-list elements
                if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT
                if (node.nodeType === Node.ELEMENT_NODE && 
                    !['OL', 'UL', 'LI'].includes(node.tagName)) {
                  return NodeFilter.FILTER_ACCEPT
                }
                return NodeFilter.FILTER_REJECT
              }
            },
            false
          )
          
          let firstTextNode = true
          let node
          while (node = walker.nextNode()) {
            if (node.nodeType === Node.TEXT_NODE) {
              let text = node.textContent
              
              // More aggressive patterns to catch duplicates like "1. 1. " or "2. 2."
              if (firstTextNode) {
                // Remove patterns like: "1. 1. ", "2. 2. ", "10. 10. "
                text = text.replace(/^(\s*)(\d+)\.\s*(\d+)\.\s*/g, '$1')
                // Remove patterns like: "1. 1 ", "2. 2 "
                text = text.replace(/^(\s*)(\d+)\.\s*(\d+)\s+/g, '$1')
                // Remove single number patterns at start: "1. ", "2. ", etc.
                text = text.replace(/^(\s*)(\d+)\.\s+/g, '$1')
                // Remove just numbers at start: "1 ", "2 "
                text = text.replace(/^(\s*)(\d+)\s+/g, '$1')
                // Remove any leading number
                text = text.replace(/^(\s*)(\d+)/g, '$1')
                firstTextNode = false
              }
              
              node.textContent = text
            }
          }
          
          // Also check if the first child is a text node with duplicate numbers
          if (li.firstChild && li.firstChild.nodeType === Node.TEXT_NODE) {
            let firstText = li.firstChild.textContent
            const originalText = firstText
            // Remove duplicate number patterns
            firstText = firstText.replace(/^(\s*)(\d+)\.\s*(\d+)\.\s*/g, '$1')
            firstText = firstText.replace(/^(\s*)(\d+)\.\s*(\d+)\s+/g, '$1')
            firstText = firstText.replace(/^(\s*)(\d+)\.\s+/g, '$1')
            firstText = firstText.replace(/^(\s*)(\d+)\s+/g, '$1')
            if (firstText !== originalText) {
              li.firstChild.textContent = firstText
            }
          }
        } catch (e) {
          console.warn('Error cleaning ordered list item:', e)
        }
      })
      
      // Clean unordered list items - remove duplicate bullets
      const ulItems = tempDiv.querySelectorAll('ul li')
      ulItems.forEach(li => {
        try {
          const walker = document.createTreeWalker(
            li,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            {
              acceptNode: function(node) {
                if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT
                if (node.nodeType === Node.ELEMENT_NODE && 
                    !['OL', 'UL', 'LI'].includes(node.tagName)) {
                  return NodeFilter.FILTER_ACCEPT
                }
                return NodeFilter.FILTER_REJECT
              }
            },
            false
          )
          
          let firstTextNode = true
          let node
          while (node = walker.nextNode()) {
            if (node.nodeType === Node.TEXT_NODE) {
              let text = node.textContent
              
              if (firstTextNode) {
                // Remove all bullet patterns at the start
                text = text.replace(/^(\s*)[•·▪▫◦‣⁃▪▫○●]\s*/g, '$1')
                text = text.replace(/^(\s*)[\u2022\u2023\u25E6\u25AA\u25AB\u25CF\u25CB\u25A1\u25A0\u25C6\u25C7]\s*/g, '$1')
                // Remove common bullet characters
                text = text.replace(/^(\s*)[-*+]\s+/g, '$1')
                firstTextNode = false
              }
              
              node.textContent = text
            }
          }
          
          // Also check first child
          if (li.firstChild && li.firstChild.nodeType === Node.TEXT_NODE) {
            let firstText = li.firstChild.textContent
            firstText = firstText.replace(/^(\s*)[•·▪▫◦‣⁃▪▫○●]\s*/g, '$1')
            firstText = firstText.replace(/^(\s*)[\u2022\u2023\u25E6\u25AA\u25AB\u25CF\u25CB\u25A1\u25A0\u25C6\u25C7]\s*/g, '$1')
            firstText = firstText.replace(/^(\s*)[-*+]\s+/g, '$1')
            li.firstChild.textContent = firstText
          }
        } catch (e) {
          console.warn('Error cleaning unordered list item:', e)
        }
      })
      
      return tempDiv.innerHTML
    } catch (error) {
      // If anything fails, return original HTML
      console.warn('Error in cleanListContent:', error)
      return html
    }
  }

  // ReactQuill modules configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ]
    },
    syntax: {
      highlight: text => text // Basic syntax highlighting
    }
  }), [])

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video',
    'clean'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Clean content one more time before submitting to remove any duplicate numbers/dots
    const cleanedContent = cleanListContent(formData.content)
    
    // Validate content (ReactQuill returns HTML, check if it's not just empty tags)
    const contentText = cleanedContent.replace(/<[^>]*>/g, '').trim()
    if (!contentText) {
      toast.error('Content is required')
      return
    }
    
    // Process tags - handle both string (comma-separated) and array formats
    let processedTags = [];
    if (Array.isArray(formData.tags)) {
      processedTags = formData.tags.filter(Boolean);
    } else if (typeof formData.tags === 'string') {
      processedTags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    
    const postData = {
      title: formData.title,
      content: cleanedContent,
      excerpt: formData.excerpt || '',
      tags: processedTags,
      categoryId: formData.categoryId || undefined,
      seoTitle: formData.seoTitle || undefined,
      seoDescription: formData.seoDescription || undefined,
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
      
      // Clean content before saving
      const cleanedContent = cleanListContent(formData.content)
      
      // Validate content before saving
      const contentText = cleanedContent.replace(/<[^>]*>/g, '').trim()
      if (!contentText) {
        toast.error('Content is required')
        isPublishingRef.current = false
        return
      }
      
      // Process tags - handle both string (comma-separated) and array formats
      let processedTags = [];
      if (Array.isArray(formData.tags)) {
        processedTags = formData.tags.filter(Boolean);
      } else if (typeof formData.tags === 'string') {
        processedTags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      }
      
      const postData = {
        title: formData.title,
        content: cleanedContent,
        excerpt: formData.excerpt || '',
        tags: processedTags,
        categoryId: formData.categoryId || undefined,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
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
                  <div className="rich-text-editor-wrapper">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={formData.content}
                      onChange={(value) => {
                        setFormData(prev => {
                          try {
                            // Clean the content to remove duplicate list numbers/dots
                            const cleanedValue = cleanListContent(value)
                            const updatedFormData = {
                              ...prev,
                              content: cleanedValue
                            }
                            
                            // Auto-assign Okta featured image if Okta is mentioned and no featured image is set
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
                          } catch (error) {
                            // If cleaning fails, just use the original value
                            console.warn('[EditPost] Error cleaning list content:', error)
                            const updatedFormData = {
                              ...prev,
                              content: value
                            }
                            
                            // Auto-assign Okta featured image if Okta is mentioned
                            if (postMentionsOkta(updatedFormData) && !updatedFormData.featuredImage) {
                              try {
                                const oktaImage = getFeaturedImageForPost(updatedFormData, null)
                                if (oktaImage) {
                                  updatedFormData.featuredImage = oktaImage
                                }
                              } catch (error) {
                                console.warn('[EditPost] Error in content onChange Okta check (fallback):', error)
                              }
                            }
                            
                            return updatedFormData
                          }
                        })
                      }}
                      modules={modules}
                      formats={formats}
                      placeholder="Start writing your post content... Use the toolbar to format text, add code blocks, lists, images, and more."
                      style={{
                        minHeight: '400px',
                        marginBottom: '42px'
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Use the toolbar to format your content. Add code blocks, lists, images, and more.
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
