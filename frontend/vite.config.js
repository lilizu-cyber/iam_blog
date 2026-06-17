import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom/client',
      '@auth0/auth0-spa-js',
      'zustand',
      'use-sync-external-store/shim/with-selector',
      '@tiptap/react',
      '@tiptap/starter-kit',
    ],
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        ws: true,
        configure: (proxy, _options) => {
          // Track errors to avoid spam
          let lastErrorTime = 0;
          const ERROR_THROTTLE_MS = 5000; // Only log errors every 5 seconds
          
          // Only log errors, not every request
          proxy.on('error', (err, req, res) => {
            const now = Date.now();
            if (now - lastErrorTime > ERROR_THROTTLE_MS) {
              console.error('⚠️  Proxy error: Backend server may not be running');
              console.error('   Make sure the backend is started on port 3001');
              console.error('   Error:', err.code === 'ECONNREFUSED' ? 'Connection refused' : err.message);
              lastErrorTime = now;
            }
            if (res && !res.headersSent) {
              res.writeHead(503, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({
                success: false,
                message: 'Backend server is unavailable. Please wait for it to start.'
              }));
            }
          });
          
          // Optionally log only failed requests or reduce verbosity
          // Remove the proxyReq logging to reduce terminal spam
          // Uncomment below for debugging only
          // proxy.on('proxyReq', (proxyReq, req, _res) => {
          //   if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
          //     console.log('Proxying request:', req.method, req.url);
          //   }
          // });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Only log errors (5xx status codes)
            if (proxyRes.statusCode >= 500) {
              console.error(`Proxy error response: ${req.method} ${req.url} - ${proxyRes.statusCode}`);
            }
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: process.env.NODE_ENV === 'production' ? false : true, // Disable sourcemaps in production for smaller bundles
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react', 'framer-motion'],
          'query-vendor': ['react-query', 'axios'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'rehype-highlight'],
          // Admin chunk (separate from public pages)
          'admin': [
            './src/pages/admin/Dashboard',
            './src/pages/admin/CreatePost',
            './src/pages/admin/EditPost',
            './src/pages/admin/ManagePosts',
            './src/pages/admin/GeneratePost',
            './src/pages/admin/NewsletterSubscribers',
            './src/pages/admin/ContactMessages',
          ],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000, // Warn if chunk exceeds 1MB
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
})
