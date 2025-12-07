import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery } from 'react-query'
import { 
  EnvelopeIcon,
  UsersIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import ErrorMessage from '../../components/UI/ErrorMessage'
import AdminHeader from '../../components/Admin/AdminHeader'

// API function to fetch subscribers
const fetchSubscribers = async ({ queryKey }) => {
  const [_key, { page, status }] = queryKey
  const response = await fetch(`/api/newsletter/subscribers?page=${page}&status=${status}`)
  if (!response.ok) {
    throw new Error('Failed to fetch subscribers')
  }
  return response.json()
}

export default function NewsletterSubscribers() {
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('active')

  const { data, isLoading, error, refetch } = useQuery(
    ['newsletter-subscribers', { page: currentPage, status: statusFilter }],
    fetchSubscribers,
    {
      keepPreviousData: true,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      unsubscribed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      bounced: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || badges.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const { subscribers = [], pagination = {}, stats = {} } = data?.data || {}

  return (
    <>
      <Helmet>
        <title>Newsletter Subscribers - Admin Dashboard</title>
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <AdminHeader 
          title="Newsletter Subscribers" 
          subtitle="Manage and view your newsletter subscription list"
        />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Subscribers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Subscribers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.active || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Unsubscribed
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.unsubscribed || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="input"
              >
                <option value="active">Active Subscribers</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="all">All Subscribers</option>
              </select>
              
              <button
                onClick={() => refetch()}
                className="btn-outline"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subscribed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <EnvelopeIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg">No subscribers found</p>
                        <p className="text-sm">Subscribers will appear here once people sign up for your newsletter.</p>
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((subscriber, index) => (
                      <tr key={subscriber._id || subscriber.id || subscriber.email || `subscriber-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {subscriber.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(subscriber.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {formatDate(subscriber.subscribedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {subscriber.source}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                      disabled={currentPage === pagination.pages}
                      className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pagination.limit, pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="btn-outline rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                          disabled={currentPage === pagination.pages}
                          className="btn-outline rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
