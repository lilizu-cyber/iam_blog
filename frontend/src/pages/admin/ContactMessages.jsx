import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { 
  EnvelopeIcon,
  EyeIcon,
  TrashIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import AdminHeader from '../../components/Admin/AdminHeader'

export default function ContactMessages() {
  const [messages, setMessages] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchMessages()
  }, [filters])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.priority) queryParams.append('priority', filters.priority)
      queryParams.append('page', filters.page)
      queryParams.append('limit', filters.limit)

      const response = await fetch(`/api/contact/messages?${queryParams}`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.data.messages)
        setStats(data.data.stats)
        setPagination(data.data.pagination)
      } else {
        toast.error('Failed to fetch contact messages')
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to fetch contact messages')
    } finally {
      setLoading(false)
    }
  }

  const viewMessage = async (messageId) => {
    if (!messageId) {
      toast.error('Invalid message ID')
      return
    }

    try {
      const response = await fetch(`/api/contact/messages/${messageId}`)
      const data = await response.json()

      if (data.success) {
        setSelectedMessage(data.data)
        setShowModal(true)
        // Refresh the list to update read status
        fetchMessages()
      } else {
        toast.error('Failed to fetch message details')
      }
    } catch (error) {
      console.error('Error fetching message:', error)
      toast.error('Failed to fetch message details')
    }
  }

  const updateMessageStatus = async (messageId, status) => {
    if (!messageId) {
      toast.error('Invalid message ID')
      return
    }

    try {
      const response = await fetch(`/api/contact/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Message status updated')
        fetchMessages()
        if (selectedMessage && (selectedMessage._id === messageId || selectedMessage.id === messageId)) {
          setSelectedMessage({ ...selectedMessage, status })
        }
      } else {
        toast.error('Failed to update message status')
      }
    } catch (error) {
      console.error('Error updating message:', error)
      toast.error('Failed to update message status')
    }
  }

  const deleteMessage = async (messageId) => {
    if (!messageId) {
      toast.error('Invalid message ID')
      return
    }

    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/contact/messages/${messageId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Message deleted successfully')
        fetchMessages()
        if (selectedMessage && (selectedMessage._id === messageId || selectedMessage.id === messageId)) {
          setShowModal(false)
          setSelectedMessage(null)
        }
      } else {
        toast.error('Failed to delete message')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'read':
        return <EyeIcon className="h-5 w-5 text-blue-500" />
      case 'replied':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'archived':
        return <ArchiveBoxIcon className="h-5 w-5 text-gray-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <>
      <Helmet>
        <title>Contact Messages - Admin Panel</title>
      </Helmet>

      <AdminHeader 
        title="Contact Messages" 
        subtitle="Manage and respond to customer inquiries" 
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <EnvelopeIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.new || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <EyeIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Read</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.read || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Replied</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.replied || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ArchiveBoxIcon className="h-8 w-8 text-gray-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Archived</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.archived || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="input"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>
            
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
              className="input"
            >
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center">
              <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No contact messages found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {messages.map((message, index) => (
                    <tr key={message._id || message.id || message.email || `message-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(message.status)}
                          <span className="ml-2 text-sm capitalize text-gray-900 dark:text-white">
                            {message.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {message.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {message.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {message.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getPriorityColor(message.priority)}`}>
                          {message.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(message.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewMessage(message._id || message.id)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            disabled={!message._id && !message.id}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => deleteMessage(message._id || message.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            disabled={!message._id && !message.id}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                    disabled={filters.page === 1}
                    className="btn-outline disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, filters.page + 1) })}
                    disabled={filters.page === pagination.pages}
                    className="btn-outline disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(filters.page * filters.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                        disabled={filters.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Page {filters.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, filters.page + 1) })}
                        disabled={filters.page === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Contact Message Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMessage.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMessage.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                  <div className="mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <div className="mt-1 flex items-center">
                      {getStatusIcon(selectedMessage.status)}
                      <span className="ml-2 text-sm capitalize text-gray-900 dark:text-white">
                        {selectedMessage.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getPriorityColor(selectedMessage.priority)}`}>
                      {selectedMessage.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Submitted At</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedMessage.submittedAt)}</p>
                </div>

                {selectedMessage.readAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Read At</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedMessage.readAt)}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <select
                  value={selectedMessage.status}
                  onChange={(e) => updateMessageStatus(selectedMessage._id || selectedMessage.id, e.target.value)}
                  className="input flex-1"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  onClick={() => deleteMessage(selectedMessage._id || selectedMessage.id)}
                  className="btn-danger"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}




