/**
 * Matriz de capturas obligatorias para documentación visual y gate de CI.
 * Cada `relativePath` es relativo a `ElectronInstaller/screenshots/`.
 * El mock usado es [installer-bridge.mock.js](fixtures/installer-bridge.mock.js) (mismo que E2E web).
 */
export type ScreenshotCategory = "wizard" | "admin" | "debug";

export interface ScreenshotMatrixEntry {
  readonly relativePath: string;
  readonly category: ScreenshotCategory;
  readonly description: string;
}

export const SCREENSHOT_CAPTURE_MATRIX: readonly ScreenshotMatrixEntry[] = [
  {
    relativePath: "wizard/01-welcome-light.png",
    category: "wizard",
    description: "Bienvenida tema claro",
  },
  {
    relativePath: "wizard/02-welcome-dark.png",
    category: "wizard",
    description: "Bienvenida tema oscuro",
  },
  {
    relativePath: "wizard/03-preflight-initial.png",
    category: "wizard",
    description: "Preflight antes de ejecutar",
  },
  {
    relativePath: "wizard/04-preflight-ok.png",
    category: "wizard",
    description: "Preflight con checks OK (mock E2E)",
  },
  {
    relativePath: "wizard/05-config-top.png",
    category: "wizard",
    description: "Configuración parte superior",
  },
  {
    relativePath: "wizard/06-config-env-paper.png",
    category: "wizard",
    description: "Sección entorno de ejecución",
  },
  {
    relativePath: "wizard/07-config-users-paper.png",
    category: "wizard",
    description: "Sección usuarios por defecto",
  },
  {
    relativePath: "wizard/08-config-backups-paper.png",
    category: "wizard",
    description: "Sección política de backups",
  },
  {
    relativePath: "wizard/09-config-advanced-secrets-paper.png",
    category: "wizard",
    description: "Secretos avanzados desplegados",
  },
  {
    relativePath: "wizard/10-config-validation-username-collision.png",
    category: "wizard",
    description: "Validación colisión admin/superadmin",
  },
  {
    relativePath: "wizard/11-smtp-initial.png",
    category: "wizard",
    description: "Formulario SMTP inicial",
  },
  {
    relativePath: "wizard/12-deploy-before-start.png",
    category: "wizard",
    description: "Despliegue antes de iniciar",
  },
  {
    relativePath: "wizard/13-deploy-progress.png",
    category: "wizard",
    description: "Despliegue con progreso",
  },
  {
    relativePath: "wizard/14-finish-success.png",
    category: "wizard",
    description: "Finalización exitosa",
  },
  {
    relativePath: "wizard/15-deploy-retry-error.png",
    category: "wizard",
    description: "Reintento de instalación con error simulado",
  },
  {
    relativePath: "admin/01-control-top.png",
    category: "admin",
    description: "Panel de control parte superior",
  },
  {
    relativePath: "admin/02-control-actions-band.png",
    category: "admin",
    description: "Panel acciones principales (scroll)",
  },
  {
    relativePath: "admin/03-control-services-band.png",
    category: "admin",
    description: "Panel tarjetas de servicios (scroll)",
  },
  {
    relativePath: "admin/04-control-logs-paper.png",
    category: "admin",
    description: "Bloque logs de aplicación",
  },
  {
    relativePath: "admin/05-control-backup-paper.png",
    category: "admin",
    description: "Bloque backup y restauración",
  },
  {
    relativePath: "admin/06-modal-prune-open.png",
    category: "admin",
    description: "Modal limpieza agresiva abierto",
  },
  {
    relativePath: "admin/07-modal-uninstall-open.png",
    category: "admin",
    description: "Modal desinstalación abierto",
  },
  {
    relativePath: "admin/08-modal-backup-destination.png",
    category: "admin",
    description: "Modal destino backup manual",
  },
  {
    relativePath: "debug/01-debug-console.png",
    category: "debug",
    description: "Ventana secundaria consola debug",
  },
] as const;
