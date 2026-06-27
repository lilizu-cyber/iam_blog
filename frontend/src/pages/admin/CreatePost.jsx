import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { buildApiUrl } from '../../utils/apiUrl'
import { isEmptyHtml } from '../../utils/htmlContent'
import RichTextEditor from '../../components/Editor/RichTextEditor'
import { 
  PaperClipIcon, 
  XMarkIcon, 
  DocumentIcon,
  PhotoIcon,
  PlusIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { blogApi } from '../../services/api'
import AdminHeader from '../../components/Admin/AdminHeader'
import FeaturedImagePicker from '../../components/Admin/FeaturedImagePicker'
import { getFeaturedImageForPost, postMentionsOkta } from '../../utils/oktaFeaturedImage'

export default function CreatePost() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const editorRef = useRef(null)

  const createPostMutation = useMutation(blogApi.createPost, {
    onSuccess: (data) => {
      toast.success('Post created successfully!')
      // Invalidate and refetch admin posts query to refresh the list
      queryClient.invalidateQueries(['admin-posts'])
      // Wait a bit longer to ensure event projection has completed
      setTimeout(() => {
        // Force a refetch when navigating
        queryClient.refetchQueries(['admin-posts'])
        navigate('/admin/posts')
      }, 1000) // Increased delay to 1 second
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create post')
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedFormData = {
      ...formData,
      [name]: value
    }
    
    setFormData(updatedFormData)
    
    // Auto-assign Okta featured image if Okta is mentioned and no featured image is set
    if (postMentionsOkta(updatedFormData) && !updatedFormData.featuredImage) {
      const oktaImage = getFeaturedImageForPost(updatedFormData, null)
      if (oktaImage) {
        setFormData(prev => ({
          ...prev,
          featuredImage: oktaImage
        }))
      }
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    
    // Validate file types
    const validFiles = files.filter(file => {
      const isValidImage = file.type.startsWith('image/')
      const isValidPDF = file.type === 'application/pdf'
      return isValidImage || isValidPDF
    })

    if (validFiles.length !== files.length) {
      toast.error('Only images and PDF files are allowed')
      return
    }

    // Check file sizes (10MB max)
    const oversizedFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      validFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload/files', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setUploadedFiles(prev => [...prev, ...data.data.files])
        toast.success(`Successfully uploaded ${data.data.files.length} file(s)`)
      } else {
        toast.error(data.message || 'Failed to upload files')
      }
    } catch (error) {
      console.error('File upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleRemoveFile = async (file) => {
    try {
      const response = await fetch(`/api/upload/files/${file.filename}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        setUploadedFiles(prev => prev.filter(f => f.filename !== file.filename))
        toast.success('File removed successfully')
      } else {
        toast.error(data.message || 'Failed to remove file')
      }
    } catch (error) {
      console.error('File remove error:', error)
      toast.error('Failed to remove file')
    }
  }

  const handleInsertImage = (file) => {
    const inserted = editorRef.current?.insertImage(file.path)
    if (!inserted) {
      toast.error('Please click on the content area first')
      return
    }
    toast.success('Image inserted at cursor position')
  }

  const handleInsertPDFLink = (file) => {
    const inserted = editorRef.current?.insertLink(file.originalName, file.path)
    if (!inserted) {
      toast.error('Please click on the content area first')
      return
    }
    toast.success('PDF link inserted at cursor position')
  }

  const handleContentChange = (content) => {
    const updatedFormData = {
      ...formData,
      content,
    }

    setFormData(updatedFormData)

    if (postMentionsOkta(updatedFormData) && !updatedFormData.featuredImage) {
      const oktaImage = getFeaturedImageForPost(updatedFormData, null)
      if (oktaImage) {
        setFormData((prev) => ({
          ...prev,
          content,
          featuredImage: oktaImage,
        }))
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEmptyHtml(formData.content)) {
      toast.error('Content is required')
      return
    }

    const postData = {
      ...formData,
      content: formData.content,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      attachments: uploadedFiles,
      categoryId: formData.categoryId || undefined,
      featuredImage: formData.featuredImage || undefined,
    }

    Object.keys(postData).forEach(key => {
      if (postData[key] === undefined) {
        delete postData[key]
      }
    })

    createPostMutation.mutate(postData)
  }

  return (
    <>
      <Helmet>
        <title>Create New Post - Admin Dashboard</title>
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <AdminHeader 
          title="Create New Post" 
          subtitle="Write and publish a new article"
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
                    ref={editorRef}
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="Start writing your post content... Use the toolbar to format text, add code blocks, lists, images, and more."
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Use the toolbar to format your content. Click on uploaded images below to insert them at your cursor position.
                  </p>
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

            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Attachments
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Images & PDFs
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            disabled={uploading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF, PDF up to 10MB each
                      </p>
                    </div>
                  </div>
                  {uploading && (
                    <div className="mt-2 text-sm text-primary-600 dark:text-primary-400">
                      Uploading files...
                    </div>
                  )}
                </div>

                {uploadedFiles.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Uploaded Files ({uploadedFiles.length})
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="relative border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                        >
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                          
                          {file.type === 'image' ? (
                            <div className="space-y-2">
                              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative group">
                                <img
                                  src={file.path}
                                  alt={file.originalName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => handleInsertImage(file)}
                                    className="btn-primary flex items-center space-x-2 px-4 py-2 text-sm"
                                    title="Insert image at cursor position in content"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                    <span>Insert Image</span>
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                <PhotoIcon className="h-4 w-4" />
                                <span className="truncate">{file.originalName}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleInsertImage(file)}
                                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1"
                                  title="Insert at cursor position"
                                >
                                  <PlusIcon className="h-3 w-3" />
                                  <span>Insert</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                <DocumentIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                <DocumentIcon className="h-4 w-4" />
                                <span className="truncate">{file.originalName}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleInsertPDFLink(file)}
                                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1"
                                  title="Insert PDF link at cursor position"
                                >
                                  <LinkIcon className="h-3 w-3" />
                                  <span>Insert Link</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin/posts')}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createPostMutation.isLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPostMutation.isLoading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
