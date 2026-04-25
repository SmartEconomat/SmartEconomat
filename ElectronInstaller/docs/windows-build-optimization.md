# Windows build optimization notes

## Recommended local setup

- Exclude these folders from real-time antivirus scanning when building locally:
  - `ElectronInstaller/dist`
  - `ElectronInstaller/out`
  - `ElectronInstaller/node_modules`
  - `%USERPROFILE%\\.cache\\electron`
  - `%USERPROFILE%\\.cache\\electron-builder`
- Keep the repository in a short path (example: `C:\\src\\SmartEconomat`) to reduce Windows path traversal overhead.
- Enable long paths on Windows (`LongPathsEnabled=1`) to avoid edge-case packaging failures.

## Build behavior in this repository

- `scripts/build-win-fast-local.mjs` now emits timing reports at:
  - `dist/build-metrics/build-win-fast-last.json`
- `scripts/pre-build-project.mjs` emits prebuild metrics at:
  - `ElectronInstaller/dist/build-metrics/prebuild-last.json`
- `scripts/ensure-win-icons.mjs` uses fingerprint-based cache and skips icon regeneration when assets are unchanged.
- `scripts/maybe-electron-rebuild.mjs` only rebuilds native modules when lockfile/native fingerprint changes.

## Troubleshooting Windows file locks

- Close Explorer windows pointing to `dist` during packaging.
- If a build fails with locked binaries, terminate lingering processes:
  - `SmartEconomat.exe`
  - `app-builder.exe`
  - `rcedit.exe`
  - `electron.exe`
