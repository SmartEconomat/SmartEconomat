# NSIS: cierre de SmartEconomat durante instalación

## Problema
electron-builder muestra "No se puede cerrar SmartEconomat… reintentar" porque la app Electron usa `preventDefault` en `close` y queda en bandeja; el cierre suave de NSIS no termina el proceso.

## Solución
- `ElectronInstaller/resources/nsis/installer-hooks.nsh`: `customCheckAppRunning`, `customInit`, `customPageAfterChangeDir`; cierre cooperativo vía `%TEMP%\smarteconomat-installer-shutdown.signal`; parada de `SmartEconomatSupervisor` + `SmartEconomat.WindowsSupervisor.exe`; espera activa de procesos; reintento de unzip si `useZip` (macro `decompress` custom).
- `ElectronInstaller/package.json` → `nsis.useZip: false` (7z con reintentos al copiar a `$INSTDIR`, más robusto que zip directo).
- `ElectronInstaller/src/main/index.ts`: polling 200 ms (y 100 ms antes de `app.ready`); destruye ventanas/tray; `app.exit(0)` a los 1,2 s si `quit` no termina.
- Bucle `old-uninstaller.exe`: parche en `installUtil.nsh` (script `scripts/patch-electron-builder-nsis-uninstall.mjs`, corre en `prebuild:project`) — llama `customCheckAppRunning` antes de cada intento; tras 8 fallos continúa sin MessageBox bloqueante.

## Iconos vs logo (no mezclar)
- Iconos (.ico): `favicon.svg` / `favicon-uninstall.svg` vía `scripts/ensure-win-icons.mjs`.
- Logos BMP NSIS: `logo-smat-economato.svg` / `full-uninstall.svg`.
- UI interna: `logo-smat-economato.svg`.

## Versión instalador
`ElectronInstaller/package.json` → `1.0.4`.
