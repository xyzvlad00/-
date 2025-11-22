import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6001,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Group React and related libraries
          'react-vendor': ['react', 'react-dom'],
          // Group state management
          'zustand': ['zustand'],
        },
      },
    },
    // Enable source maps for better debugging
    sourcemap: true,
    // Set chunk size warning limit (main bundle is 237KB minified, 74KB gzipped - acceptable for visual app)
    chunkSizeWarningLimit: 250,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'clsx'],
  },
})

