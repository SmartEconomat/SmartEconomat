/**
 * Documentación en español.
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
