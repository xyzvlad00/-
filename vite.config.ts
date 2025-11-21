import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Three.js into its own chunk (only used by GeometricPulse)
          'three': ['three'],
          // Group React and related libraries
          'react-vendor': ['react', 'react-dom'],
          // Group state management
          'zustand': ['zustand'],
        },
      },
    },
    // Enable source maps for better debugging
    sourcemap: true,
    // Increase chunk size warning limit (visual effects can be large)
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'clsx'],
    // Exclude Three.js from pre-bundling since it's lazy loaded
    exclude: ['three'],
  },
})

