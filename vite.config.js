import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split jsPDF into its own chunk
          jspdf: ['jspdf'],
          // Split React and ReactDOM into vendor chunks
          'react-vendor': ['react', 'react-dom']
        }
      }
    },
    chunkSizeWarningLimit: 600 // Increase warning limit to 600kB if you want to suppress the warning
  }
});