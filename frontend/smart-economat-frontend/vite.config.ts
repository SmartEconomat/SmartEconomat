import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { configDefaults } from 'vitest/config';

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

/**
 * Estrategia de manualChunks para Rollup/Vite.
 *
 * Objetivo: reducir el número total de chunks agrupando código de app
 * por dominio funcional y consolidando vendors por familia de librería.
 *
 * Grupos de vendor:
 *   react-vendor     → react + react-dom + scheduler (núcleo React, muy cacheado)
 *   router-vendor    → react-router-dom (cambia poco, cache largo)
 *   mui-core-vendor  → @mui/material + sistema base (grande pero estable)
 *   mui-icons-vendor → @mui/icons-material (grande, estable, separado para cache)
 *   emotion-vendor   → @emotion/* + stylis (motor CSS-in-JS de MUI)
 *   date-vendor      → dayjs + @mui/x-date-pickers (feature opcional)
 *   i18n-vendor      → i18next + react-i18next + detectores
 *   sentry-vendor    → @sentry/* + @sentry-internal/* (monitoring y paquetes internos del mismo runtime)
 *   zxing-vendor     → @zxing/* (barcode scanner, feature opcional)
 *   vendor           → resto de node_modules (redux, wicg-inert, etc.)
 *
 * Código en `src/`: sin `manualChunks` (valor `undefined`). Partir por ruta cuando
 * hay imports cruzados (UI ↔ servicios ↔ features) fuerza “Circular chunk” en Rollup.
 * Se puede volver al split por dominio tras desacoplar capas (p. ej. dependency-cruiser).
 */
function getManualChunk(id: string): string | undefined {
  // ── Vendors ─────────────────────────────────────────────────────────────
  if (id.includes('/node_modules/')) {
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
      id.includes('/node_modules/@mui/base/') ||
      id.includes('/node_modules/@popperjs/') ||
      id.includes('/node_modules/react-transition-group/')
    ) {
      return 'mui-core-vendor';
    }

    if (
      id.includes('/node_modules/dayjs/') ||
      id.includes('/node_modules/@mui/x-date-pickers/')
    ) {
      return 'date-vendor';
    }

    if (
      id.includes('/node_modules/i18next') ||
      id.includes('/node_modules/react-i18next') ||
      id.includes('/node_modules/i18next-browser-languagedetector')
    ) {
      return 'i18n-vendor';
    }

    if (
      id.includes('/node_modules/@sentry/') ||
      id.includes('/node_modules/@sentry-internal/')
    ) {
      return 'sentry-vendor';
    }

    // Barcode scanner: grande y de carga diferida, chunk propio para mejor caché
    if (id.includes('/node_modules/@zxing/')) {
      return 'zxing-vendor';
    }

    // Resto de node_modules (web-vitals, wicg-inert, @nestjs/common, etc.)
    return 'vendor';
  }

  // Código aplicación: dejar que Rollup asigne chunks (evita particiones cíclicas).
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
      // Pre-bundlear de forma EAGER todas las dependencias runtime importantes.
      // Si una dep aparece "lazy" (solo importada por una ruta diferida), Vite
      // dispara una re-optimización en caliente que renombra los chunks
      // intermedios de esbuild ("chunk-XXXXXXX.js"). Mientras la optimización
      // termina, el navegador puede solicitar chunks viejos por su nombre
      // anterior y aparece el error:
      //   The file does not exist at "/tmp/.vite-smarteconomat/deps/chunk-...js?v=..."
      // Listar aquí todo lo que el bundle final necesita evita esa carrera.
      // Importante: NO usar wildcards de subpath en MUI (rompe el resolver
      // contra "./esm"). Ver .github/memories/2026-05-03-vite-mui-esm-specifier.md.
      include: [
        '@emotion/react',
        '@emotion/styled',
        '@mui/material',
        '@mui/icons-material',
        '@mui/x-date-pickers',
        '@mui/x-date-pickers/AdapterDayjs',
        '@reduxjs/toolkit',
        'react-redux',
        'react-router-dom',
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-dev-runtime',
        'react/jsx-runtime',
        'dayjs',
        'i18next',
        'react-i18next',
        'i18next-browser-languagedetector',
        '@sentry/react',
        '@zxing/browser',
        '@zxing/library',
      ],
    },
    build: {
      outDir: 'build',
      sourcemap: false,
      reportCompressedSize: false,
      // Aumentar el warning limit ya que algunos vendor chunks son inevitablemente grandes
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: getManualChunk,
          // Tamaño mínimo de chunk: evita micro-fragmentación de módulos compartidos
          // que Rollup generaría por defecto al detectar imports dinámicos.
          // 20 KB es un balance entre granularidad y número de requests HTTP.
          experimentalMinChunkSize: 20_000,
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
      globals: true,
      environment: 'jsdom' as const,
      setupFiles: ['./src/setupTests.ts'],
      /** Todos los tests unitarios/integration Vitest deben vivir en `test/`. Playwright permanece en `test/e2e`. */
      include: ['test/**/*.{test,spec}.{ts,tsx}'],
      exclude: [...configDefaults.exclude, 'test/e2e/**'],
      // Node 22 + pool=forks ha provocado IPC "Channel closed" / cuelgues con tinypool.
      // Threads evita child_process y suele ser estable en CI y local.
      pool: 'threads',
      maxWorkers: 1,
      fileParallelism: false,
      coverage: {
        provider: 'v8' as const,
        reporter: ['text', 'html'],
        reportsDirectory: './coverage',
      },
    },
  };
});
