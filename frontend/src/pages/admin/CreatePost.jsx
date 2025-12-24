import { useState, useRef, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { buildApiUrl } from '../../utils/apiUrl'
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
  const quillRef = useRef(null)

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

  // Insert content at cursor position in Quill editor
  const insertAtCursor = (content, isImage = false) => {
    const quill = quillRef.current?.getEditor()
    if (!quill) {
      toast.error('Please click on the content area first')
      return
    }

    const range = quill.getSelection(true)
    if (!range) {
      // If no selection, place cursor at the end
      const length = quill.getLength()
      quill.setSelection(length, 0)
    }

    if (isImage) {
      // Insert image
      quill.insertEmbed(range.index, 'image', content, 'user')
      // Move cursor after the image
      quill.setSelection(range.index + 1, 0)
    } else {
      // Insert text/HTML
      quill.insertText(range.index, content, 'user')
      // Move cursor after inserted content
      quill.setSelection(range.index + content.length, 0)
    }

    quill.focus()
    toast.success(isImage ? 'Image inserted at cursor position' : 'Content inserted at cursor position')
  }

  // Insert image in Quill editor
  const handleInsertImage = (file) => {
    insertAtCursor(file.path, true)
  }

  // Insert PDF link in Quill editor
  const handleInsertPDFLink = (file) => {
    const quill = quillRef.current?.getEditor()
    if (!quill) {
      toast.error('Please click on the content area first')
      return
    }

    const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 }
    quill.insertText(range.index, file.originalName, 'link', file.path, 'user')
    quill.setSelection(range.index + file.originalName.length, 0)
    quill.focus()
    toast.success('PDF link inserted at cursor position')
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
      ],
      handlers: {
        image: function() {
          // Custom image handler - show uploaded images
          if (uploadedFiles.filter(f => f.type === 'image').length === 0) {
            toast.error('Please upload an image first')
            return
          }
          // For now, use default behavior and let users insert via the uploaded files section
          // Or we could show a modal with uploaded images
        }
      }
    },
    syntax: {
      highlight: text => text // Basic syntax highlighting
    }
  }), [uploadedFiles])

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
    
    // Clean up the data before sending
    const postData = {
      ...formData,
      content: cleanedContent,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      attachments: uploadedFiles, // Include uploaded files
      // Only include categoryId if it's not empty
      categoryId: formData.categoryId || undefined,
      // Only include featuredImage if it's not null
      featuredImage: formData.featuredImage || undefined
    }
    
    // Remove undefined values
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
                  <div className="rich-text-editor-wrapper">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={formData.content}
                      onChange={(value) => {
                        try {
                          // Clean the content to remove duplicate list numbers/dots
                          const cleanedValue = cleanListContent(value)
                          const updatedFormData = {
                            ...formData,
                            content: cleanedValue
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
                        } catch (error) {
                          // If cleaning fails, just use the original value
                          console.warn('Error cleaning list content:', error)
                          const updatedFormData = {
                            ...formData,
                            content: value
                          }
                          
                          setFormData(updatedFormData)
                          
                          // Auto-assign Okta featured image if Okta is mentioned
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
                    Use the toolbar to format your content. Click on uploaded images below to insert them at your cursor position.
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
