# 2026-05-03 · Vite + MUI: Missing "./esm" specifier

## Contexto
En frontend (`smart-economat-frontend`), `vite dev` podia fallar con:
`Error: Missing "./esm" specifier in "@mui/material" package`.

## Causa observada
El pre-bundling de Vite en modo desarrollo acaba intentando resolver el subpath privado/bloqueado `@mui/material/esm`.

## Regla aplicada
En `vite.config.ts`, mantener `optimizeDeps.include` sin wildcards de subpath para MUI.

- Permitido: `@mui/material`, `@mui/icons-material`
- Evitar: `@mui/material/*`, `@mui/icons-material/*`

## Verificacion
- `npm run dev` inicia correctamente (Vite ready).
- `npm run build` compila sin errores.
