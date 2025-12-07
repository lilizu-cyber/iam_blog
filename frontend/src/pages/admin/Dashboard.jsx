import { Helmet } from 'react-helmet-async'
import { 
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  UserGroupIcon,
  ChartBarIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/admin/login')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - CyberSec & IAM Blog</title>
        <meta name="description" content="Admin dashboard for managing blog content and analytics." />
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Welcome back, {user?.username}! Manage your blog content and monitor performance
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Link
              to="/admin/posts/new"
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PlusIcon className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    New Post
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create article
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/posts/generate"
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SparklesIcon className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Generate with AI
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    AI-powered posts
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/posts"
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-security-600 group-hover:text-security-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Manage Posts
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Edit & organize
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/newsletter"
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-8 w-8 text-iam-600 group-hover:text-iam-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Newsletter
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    View subscribers
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/contact"
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600 group-hover:text-green-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Contact Messages
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    View inquiries
                  </p>
                </div>
              </div>
            </Link>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeIcon className="h-8 w-8 text-cyber-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Analytics
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    View insights
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-cyber-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Users
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage access
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Posts
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    156
                  </p>
                </div>
                <DocumentTextIcon className="h-8 w-8 text-primary-600" />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Views
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    45.2K
                  </p>
                </div>
                <EyeIcon className="h-8 w-8 text-security-600" />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Subscribers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    2.1K
                  </p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-iam-600" />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Engagement
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    8.5%
                  </p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-cyber-600" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      New article published: "Advanced IAM Strategies"
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      2 hours ago
                    </p>
                  </div>
                  <span className="badge-iam">Published</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Draft saved: "Zero Trust Architecture Guide"
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      5 hours ago
                    </p>
                  </div>
                  <span className="badge-gray">Draft</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Comment moderated on "Threat Hunting Basics"
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      1 day ago
                    </p>
                  </div>
                  <span className="badge-security">Moderated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
