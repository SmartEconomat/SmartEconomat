import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Declaración mínima de process para que TypeScript resuelva process.env en este
// archivo de configuración. @types/node está listado como devDependency y se
// instala dentro del contenedor Docker; en el host no hay node_modules por diseño.
declare const process: { env: Record<string, string | undefined> };

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
    cacheDir: '/tmp/.vite-smarteconomat',
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
      host: '0.0.0.0', // Bind en todas las interfaces: obligatorio en Docker
      open: false, // No abrir browser en Docker (xdg-open falla en contenedor)
      // HMR: configuración explícita del WebSocket.
      // Sin esto, en Docker Desktop (macOS/Windows) el cliente intenta conectar
      // a la IP interna del contenedor en lugar del host, rompiendo el HMR.
      hmr: {
        host: 'localhost',
        // clientPort: puerto que el BROWSER usa para conectar al WS de HMR.
        // En Docker Desktop, el navegador está en el host y accede via port-forward.
        // Dejarlo igual que el port del server es correcto para la mayoría de casos.
        clientPort: Number(process.env.FRONTEND_PORT) || 5173,
        protocol: 'ws',
      },
      historyApiFallback: true,
      proxy: {
        '/api': {
          target:
            process.env.VITE_API_PROXY_TARGET ||
            process.env.BACKEND_API_URL ||
            'http://localhost:3000',
          changeOrigin: true,
          secure: false, // En dev, el backend puede no tener TLS
        },
      },
      watch: {
        // En Linux nativo inotify es eficiente y preferible.
        // Solo usar polling si se observa que los cambios NO se detectan.
        usePolling: false,
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
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
