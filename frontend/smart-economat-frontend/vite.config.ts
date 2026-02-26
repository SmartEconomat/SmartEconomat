import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
    },
    plugins: [react()],
    server: {
        port: Number(process.env.FRONTEND_PORT) || 3000,
        host: true, // Needed for Docker
        open: false, // Prevent opening browser in Docker (xdg-open error)
        proxy: {
            '/api': {
                target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
    resolve: {
        alias: {
            // Add any aliases here if needed, for example:
            // '@': path.resolve(__dirname, './src'),
        },
    },
  };
});
