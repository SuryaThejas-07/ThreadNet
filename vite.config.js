import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lucide-react') || id.includes('react-hot-toast')) return 'vendor-ui';
          if (id.includes('@google/generative-ai')) return 'vendor-ai';

          const parts = id.split('node_modules/')[1]?.split('/') || [];
          const packageName = parts[0]?.startsWith('@') ? `${parts[0]}-${parts[1] || 'pkg'}` : parts[0] || 'misc';
          return `vendor-${packageName.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: true,
    setupFiles: './src/test/setup.js',
  },
});
