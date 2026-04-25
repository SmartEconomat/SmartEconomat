/**
 * Ruta por defecto del runtime del instalador.
 * Debe coincidir con la lógica de resolución en `boot-guardian.service.ts`.
 *
 * @param platform — `process.platform` en main/preload/renderer (Electron).
 * @param homeDir — directorio home del usuario (p. ej. `app.getPath("home")` o `HOME`).
 */
export function getDefaultRuntimePath(
  platform: NodeJS.Platform,
  homeDir: string,
): string {
  if (platform === "win32") {
    return "C:/SmartEconomatRuntime";
  }

  const trimmed = homeDir.trim();
  if (!trimmed) {
    return "/tmp/smarteconomat-runtime";
  }

  if (platform === "darwin") {
    return `${trimmed}/Library/Application Support/SmartEconomatRuntime`;
  }

  return `${trimmed}/.smarteconomat-runtime`;
}
