import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        show: resolve(__dirname, 'show.html'),
        admin: resolve(__dirname, 'admin.html')
      },
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    },
    chunkSizeWarningLimit: 1200
  }
});
