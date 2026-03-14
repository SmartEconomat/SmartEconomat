import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

function getManualChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  if (
    id.includes('/node_modules/react/') ||
    id.includes('/node_modules/react-dom/') ||
    id.includes('/node_modules/scheduler/')
  ) {
    return 'react-vendor';
  }

  if (
    id.includes('/node_modules/react-router/') ||
    id.includes('/node_modules/react-router-dom/')
  ) {
    return 'router-vendor';
  }

  if (
    id.includes('/node_modules/@emotion/') ||
    id.includes('/node_modules/stylis/') ||
    id.includes('/node_modules/hoist-non-react-statics/')
  ) {
    return 'emotion-vendor';
  }

  if (id.includes('/node_modules/@mui/icons-material/')) {
    return 'mui-icons-vendor';
  }

  if (
    id.includes('/node_modules/@mui/material/') ||
    id.includes('/node_modules/@mui/system/') ||
    id.includes('/node_modules/@mui/utils/') ||
    id.includes('/node_modules/@mui/private-theming/') ||
    id.includes('/node_modules/@mui/styled-engine/') ||
    id.includes('/node_modules/@mui/styled-engine-sc/') ||
    id.includes('/node_modules/@mui/base/') ||
    id.includes('/node_modules/@popperjs/')
  ) {
    return 'mui-core-vendor';
  }

  if (id.includes('/node_modules/react-transition-group/')) {
    return 'vendor';
  }

  if (
    id.includes('/node_modules/dayjs/') ||
    id.includes('/node_modules/@mui/x-date-pickers/')
  ) {
    return 'date-vendor';
  }

  if (id.includes('/node_modules/')) {
    return 'vendor';
  }

  return undefined;
}

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
      rollupOptions: {
        output: {
          manualChunks: getManualChunk,
        },
      },
    },
    plugins: [react()],
    server: {
      port: Number(process.env.FRONTEND_PORT) || 5173,
      host: true, // Needed for Docker
      open: false, // Prevent opening browser in Docker (xdg-open error)
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
      watch: {
        usePolling: true, // Required for Docker volume mounts to detect file changes (HMR)
        interval: 300,
      },
    },
    resolve: {
      alias: {
        // Add any aliases here if needed, for example:
        // '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: './coverage',
      },
    },
  };
});
