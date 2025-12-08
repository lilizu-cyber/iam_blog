import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { 
  SparklesIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { blogApi } from '../../services/api'
import AdminHeader from '../../components/Admin/AdminHeader'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

export default function GeneratePost() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [prompt, setPrompt] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [generatedPost, setGeneratedPost] = useState(null)

  const generateMutation = useMutation(
    (data) => blogApi.generatePost(data),
    {
      onSuccess: (response) => {
        if (response.success) {
          setGeneratedPost(response.data)
          toast.success('Post generated successfully!')
          // Invalidate admin posts query to refresh the list
          queryClient.invalidateQueries(['admin-posts'])
        } else {
          toast.error(response.message || 'Failed to generate post')
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate post')
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    if (prompt.trim().length < 10) {
      toast.error('Prompt must be at least 10 characters')
      return
    }

    generateMutation.mutate({
      prompt: prompt.trim(),
      categoryId: categoryId || null
    })
  }

  const handleSaveAsDraft = () => {
    if (generatedPost?.postId) {
      navigate(`/admin/posts/${generatedPost.postId}/edit`)
    }
  }

  const handleNewGeneration = () => {
    setGeneratedPost(null)
    setPrompt('')
    setCategoryId('')
  }

  return (
    <>
      <Helmet>
        <title>Generate Post with AI - Admin Dashboard</title>
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <AdminHeader />
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="mb-4 inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Generate Post with AI
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Use AI to generate blog posts about cybersecurity, IAM, and AI security
                </p>
              </div>
            </div>
          </div>

          {!generatedPost ? (
            /* Generation Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="card p-6">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What would you like to write about?
                </label>
                <textarea
                  id="prompt"
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., Write a comprehensive guide about implementing zero-trust security architecture in enterprise environments..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {prompt.length}/1000 characters (minimum 10)
                </p>
              </div>

              <div className="card p-6">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category (Optional)
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select a category (optional)</option>
                  <option value="security">Cybersecurity</option>
                  <option value="iam">Identity & Access Management</option>
                  <option value="ai">AI in Security</option>
                  <option value="compliance">Compliance & Governance</option>
                </select>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Selecting a category helps the AI focus on relevant topics
                </p>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateMutation.isLoading || prompt.trim().length < 10}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
                >
                  {generateMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Generate Post
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Generated Post Preview */
            <div className="space-y-6">
              <div className="card p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <SparklesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Post Generated Successfully!
                    </h2>
                  </div>
                  <span className="badge-iam">Draft</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {generatedPost.generatedData?.title || 'Generated Post'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {generatedPost.generatedData?.excerpt || 'No excerpt available'}
                    </p>
                  </div>
                  
                  {generatedPost.generatedData?.tags && generatedPost.generatedData.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {generatedPost.generatedData.tags.map((tag, index) => (
                          <span key={index} className="badge-gray">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={handleNewGeneration}
                  className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Generate Another
                </button>
                <button
                  onClick={handleSaveAsDraft}
                  className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Edit & Save as Draft
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 card p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  How it works
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The AI will generate a complete blog post based on your prompt. The post will be saved as a draft, 
                  which you can then review, edit, and publish when ready. You can refine the content, add images, 
                  and make any necessary changes before publishing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}






