import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add user headers for demo purposes
    const userId = localStorage.getItem('userId')
    const userEmail = localStorage.getItem('userEmail')
    const userRole = localStorage.getItem('userRole')
    
    if (userId) config.headers['x-user-id'] = userId
    if (userEmail) config.headers['x-user-email'] = userEmail
    if (userRole) config.headers['x-user-role'] = userRole
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Check if we're already on the login page to avoid redirect loops
      if (window.location.pathname === '/admin/login') {
        return Promise.reject(error)
      }
      
      // Handle unauthorized access
      localStorage.removeItem('authToken')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userRole')
      
      // Only redirect if we're not already being redirected
      // Use a small delay to allow React Router to handle navigation first
      setTimeout(() => {
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login'
        }
      }, 100)
    }
    return Promise.reject(error)
  }
)

// Create a separate axios instance for blog post queries with longer timeout
// Blog queries can take longer due to database operations (find + count)
const blogApiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // 30 seconds for blog queries (allows for database operations)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Apply same interceptors to blog API instance
blogApiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

blogApiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if we're already on the login page to avoid redirect loops
      if (window.location.pathname === '/admin/login') {
        return Promise.reject(error)
      }
      
      localStorage.removeItem('authToken')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userRole')
      
      // Only redirect if we're not already being redirected
      // Use a small delay to allow React Router to handle navigation first
      setTimeout(() => {
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login'
        }
      }, 100)
    }
    return Promise.reject(error)
  }
)

// Blog API endpoints
export const blogApi = {
  // Get blog posts (uses longer timeout instance)
  getPosts: async (params = {}) => {
    const response = await blogApiInstance.get('/blog/posts', { params })
    return response.data
  },

  // Get blog post by ID (uses longer timeout instance)
  getPostById: async (id) => {
    const response = await blogApiInstance.get(`/blog/posts/${id}`)
    return response.data
  },

  // Get blog post by slug (uses longer timeout instance)
  getPostBySlug: async (slug) => {
    const response = await blogApiInstance.get(`/blog/posts/slug/${slug}`)
    return response.data
  },

  // Get posts by author (uses longer timeout instance)
  getPostsByAuthor: async (authorId, params = {}) => {
    const response = await blogApiInstance.get(`/blog/authors/${authorId}/posts`, { params })
    return response.data
  },

  // Search posts (uses longer timeout instance)
  searchPosts: async (params = {}) => {
    const response = await blogApiInstance.get('/blog/search', { params })
    return response.data
  },

  // Get popular posts (uses longer timeout instance)
  getPopularPosts: async (params = {}) => {
    const response = await blogApiInstance.get('/blog/popular', { params })
    return response.data
  },

  // Get security posts (uses longer timeout instance)
  getSecurityPosts: async (params = {}) => {
    const response = await blogApiInstance.get('/blog/security', { params })
    return response.data
  },

  // Admin: Get all posts (including drafts)
  getAdminPosts: async (params = {}) => {
    const response = await api.get('/blog/admin/posts', { 
      params,
      withCredentials: true 
    })
    return response.data
  },

  // Get IAM posts
  getIAMPosts: async (params = {}) => {
    const response = await blogApiInstance.get('/blog/iam', { params })
    return response.data
  },

  // Get blog statistics
  getBlogStats: async () => {
    const response = await api.get('/blog/stats')
    return response.data
  },

  // Create blog post
  createPost: async (postData) => {
    const response = await api.post('/blog/posts', postData)
    return response.data
  },

  // Update blog post
  updatePost: async (id, postData) => {
    const response = await api.put(`/blog/posts/${id}`, postData)
    return response.data
  },

  // Publish blog post
  publishPost: async (id) => {
    const response = await api.post(`/blog/posts/${id}/publish`)
    return response.data
  },

  // Unpublish blog post
  unpublishPost: async (id) => {
    const response = await api.post(`/blog/posts/${id}/unpublish`)
    return response.data
  },

  // Delete blog post
  deletePost: async (id) => {
    const response = await api.delete(`/blog/posts/${id}`)
    return response.data
  },

  // Add tag to post
  addTag: async (id, tag) => {
    const response = await api.post(`/blog/posts/${id}/tags`, { tag })
    return response.data
  },

  // Remove tag from post
  removeTag: async (id, tag) => {
    const response = await api.delete(`/blog/posts/${id}/tags/${tag}`)
    return response.data
  },

  // Generate post with AI (longer timeout for AI generation)
  generatePost: async (data) => {
    // Create a separate axios instance with longer timeout for AI generation
    // This ensures the timeout override works properly
    const generateApi = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 180000, // 3 minutes for AI generation
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
    
    // Apply the same request interceptor to include auth headers
    generateApi.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userRole = localStorage.getItem('userRole');
        if (userId) config.headers['x-user-id'] = userId;
        if (userEmail) config.headers['x-user-email'] = userEmail;
        if (userRole) config.headers['x-user-role'] = userRole;
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Apply the same response interceptor
    generateApi.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userRole');
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }
    );
    
    const response = await generateApi.post('/blog/generate', data);
    return response.data;
  },
}

// User API endpoints (placeholder for future implementation)
export const userApi = {
  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },
}

// Newsletter API endpoints
export const newsletterApi = {
  // Subscribe to newsletter
  subscribe: async (email) => {
    const response = await api.post('/newsletter/subscribe', { email })
    return response.data
  },

  // Unsubscribe from newsletter
  unsubscribe: async (email) => {
    const response = await api.post('/newsletter/unsubscribe', { email })
    return response.data
  },
}

// Analytics API endpoints
export const analyticsApi = {
  // Track page view
  trackPageView: async (data) => {
    const response = await api.post('/analytics/pageview', data)
    return response.data
  },

  // Track user engagement
  trackEngagement: async (data) => {
    const response = await api.post('/analytics/engagement', data)
    return response.data
  },
}

export default api
