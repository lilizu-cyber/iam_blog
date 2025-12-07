import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import AdminHeader from '../../components/Admin/AdminHeader'
import { Link } from 'react-router-dom'
import { PlusIcon, PencilIcon, EyeIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { blogApi } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import ErrorMessage from '../../components/UI/ErrorMessage'
import toast from 'react-hot-toast'

export default function ManagePosts() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } = useQuery(
    ['admin-posts', page, statusFilter],
    () => blogApi.getAdminPosts({ 
      page, 
      limit: 20, 
      status: statusFilter || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }),
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  )

  const deletePostMutation = useMutation(
    (postId) => blogApi.deletePost(postId),
    {
      onSuccess: () => {
        toast.success('Post deleted successfully!')
        queryClient.invalidateQueries(['admin-posts'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete post')
      }
    }
  )

  const handleDelete = (postId, postTitle) => {
    if (window.confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      deletePostMutation.mutate(postId)
    }
  }

  const posts = data?.data?.posts || []
  const pagination = data?.data?.pagination || {}

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="badge-iam">Published</span>
      case 'draft':
        return <span className="badge-gray">Draft</span>
      case 'archived':
        return <span className="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Archived</span>
      default:
        return <span className="badge-gray">Unknown</span>
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Not published'
    return new Date(date).toLocaleDateString()
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message={error.message} />

  return (
    <>
      <Helmet>
        <title>Manage Posts - Admin Dashboard</title>
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <AdminHeader 
          title="Manage Posts" 
          subtitle="View and manage all blog posts"
        />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Posts</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {pagination.total || 0} total posts
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => refetch()}
                className="btn-outline flex items-center"
                title="Refresh"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh
              </button>
              <Link
                to="/admin/posts/new"
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Post
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select 
                  className="input w-full"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Author
                </label>
                <select className="input w-full">
                  <option value="">All Authors</option>
                  <option value="john">John Doe</option>
                  <option value="jane">Jane Smith</option>
                  <option value="mike">Mike Johnson</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select className="input w-full">
                  <option value="">All Categories</option>
                  <option value="security">Security</option>
                  <option value="iam">IAM</option>
                  <option value="ai">AI & Security</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search posts..."
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Posts Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No posts found. <Link to="/admin/posts/new" className="text-primary-600 dark:text-primary-400 hover:underline">Create your first post</Link>
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {post.title}
                          </div>
                          {post.excerpt && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-md">
                              {post.excerpt}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(post.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {post.author?.name || 'Admin'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(post.publishedAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {post.viewCount?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {post.status === 'published' && (
                              <Link
                                to={`/blog/${post.slug}`}
                                target="_blank"
                                className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                                title="View post"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Link>
                            )}
                            <Link
                              to={`/admin/posts/${post.id}/edit`}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Edit post"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button 
                              className="text-red-600 hover:text-red-900 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete post"
                              onClick={() => handleDelete(post.id, post.title)}
                              disabled={deletePostMutation.isLoading}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {(page - 1) * (pagination.limit || 20) + 1} to {Math.min(page * (pagination.limit || 20), pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button 
                  className="btn-outline disabled:opacity-50" 
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <button 
                  className="btn-outline disabled:opacity-50" 
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
