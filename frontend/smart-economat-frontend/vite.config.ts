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
    },
    resolve: {
        alias: {
            // Add any aliases here if needed, for example:
            // '@': path.resolve(__dirname, './src'),
        },
    },
  };
});
