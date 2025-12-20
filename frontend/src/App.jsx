import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'

// Layout (eagerly loaded - used on all pages)
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/UI/LoadingSpinner'

// Lazy load public pages
const Home = lazy(() => import('./pages/Home'))
const BlogList = lazy(() => import('./pages/BlogList'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const SecurityPosts = lazy(() => import('./pages/SecurityPosts'))
const IAMPosts = lazy(() => import('./pages/IAMPosts'))
const Search = lazy(() => import('./pages/Search'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const Cookies = lazy(() => import('./pages/Cookies'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Lazy load admin pages (larger bundles)
const AdminLogin = lazy(() => import('./pages/admin/Login'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const CreatePost = lazy(() => import('./pages/admin/CreatePost'))
const EditPost = lazy(() => import('./pages/admin/EditPost'))
const ManagePosts = lazy(() => import('./pages/admin/ManagePosts').catch(() => ({ default: () => <div>Error loading Manage Posts</div> })))
const GeneratePost = lazy(() => import('./pages/admin/GeneratePost'))
const NewsletterSubscribers = lazy(() => import('./pages/admin/NewsletterSubscribers'))
const ContactMessages = lazy(() => import('./pages/admin/ContactMessages'))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
)

// Contexts
import { AuthProvider } from './contexts/AuthContext'

// Hooks
import { useThemeStore } from './stores/themeStore'

function App() {
  const { theme, initializeTheme } = useThemeStore()

  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public routes */}
              <Route index element={<Home />} />
              <Route path="blog" element={<BlogList />} />
              <Route path="blog/:slug" element={<BlogPost />} />
              <Route path="security" element={<SecurityPosts />} />
              <Route path="iam" element={<IAMPosts />} />
              <Route path="search" element={<Search />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="cookies" element={<Cookies />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>
            
            {/* Admin login route (outside Layout) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Protected admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              {/* Explicit redirect for dashboard/posts - must come before catch-all */}
              <Route path="dashboard/posts" element={<Navigate to="/admin/posts" replace />} />
              <Route path="dashboard/posts/*" element={<Navigate to="/admin/posts" replace />} />
              {/* Posts routes - must be before catch-all */}
              <Route path="posts" element={<ManagePosts />} />
              <Route path="posts/new" element={<CreatePost />} />
              <Route path="posts/generate" element={<GeneratePost />} />
              <Route path="posts/:id/edit" element={<EditPost />} />
              {/* Other admin routes */}
              <Route path="newsletter" element={<NewsletterSubscribers />} />
              <Route path="contact" element={<ContactMessages />} />
              {/* Catch-all for admin routes - redirect to dashboard (must be last) */}
              <Route path="*" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  )
}

export default App
