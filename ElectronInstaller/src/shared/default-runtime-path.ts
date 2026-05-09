/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Obtiene el estado o valor solicitado.
 * @param {NodeJS.Platform} platform - Entrada esperada por la función.
 * @param {string} homeDir - Entrada esperada por la función.
 * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
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
