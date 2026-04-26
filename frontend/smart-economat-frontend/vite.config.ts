import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Declaración mínima de process para que TypeScript resuelva process.env en este
// archivo de configuración. @types/node está listado como devDependency y se
// instala dentro del contenedor Docker; en el host no hay node_modules por diseño.
declare const process: { env: Record<string, string | undefined> };

const DEVTOOLS_SOURCEMAP_PATHS = new Set([
  '/installHook.js.map',
  '/react_devtools_backend_compact.js.map',
]);

function createSyntheticSourceMap(pathname: string): string {
  const fileName = pathname.slice(1, -4);
  const syntheticSource = `synthetic-devtools-sourcemap://${fileName}`;

  return JSON.stringify({
    version: 3,
    file: fileName,
    sources: [syntheticSource],
    sourcesContent: [''],
    names: [],
    mappings: 'AAAA',
  });
}

function createSyntheticSourceMapPlugin(): Plugin {
  const respondWithSyntheticMap = (
    url: string | undefined,
    end: (chunk: string) => void,
    setHeader: (name: string, value: string) => void
  ): boolean => {
    if (!url) {
      return false;
    }

    const pathname = url.split('?')[0];
    if (!DEVTOOLS_SOURCEMAP_PATHS.has(pathname)) {
      return false;
    }

    setHeader('Content-Type', 'application/json; charset=utf-8');
    setHeader('Cache-Control', 'no-store');
    end(createSyntheticSourceMap(pathname));
    return true;
  };

  return {
    name: 'sherlock-auth-synthetic-devtools-sourcemaps',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const handled = respondWithSyntheticMap(
          req.url,
          (chunk) => res.end(chunk),
          (name, value) => res.setHeader(name, value)
        );

        if (handled) {
          return;
        }

        next();
      });
    },
  };
}

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
  const backendPort = Number(process.env.BACKEND_PORT) || 3000;
  const proxyTarget = `http://backend:${backendPort}`;

  return {
    cacheDir: '/tmp/.vite-smarteconomat',
    optimizeDeps: {
      // Forzar re-optimización con: VITE_FORCE_OPTIMIZE=true docker compose up
      force: process.env.VITE_FORCE_OPTIMIZE === 'true',
    },
    build: {
      outDir: 'build',
      sourcemap: false,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks: getManualChunk,
        },
      },
    },
    plugins: [createSyntheticSourceMapPlugin(), react()],
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
          target: proxyTarget,
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
    test: {
      environment: 'jsdom',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: './coverage',
      },
    },
  };
});
