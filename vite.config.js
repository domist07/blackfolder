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
        manualChunks: (id) => {
          // Split jsPDF into its own chunk
          if (id.includes('jspdf')) {
            return 'jspdf';
          }
          // Split React and ReactDOM into vendor chunks
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600 // Increase warning limit to 600kB if you want to suppress the warning
  }
});