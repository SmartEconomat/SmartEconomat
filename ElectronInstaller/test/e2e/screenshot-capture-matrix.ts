/** Categorías de capturas automatizadas del instalador. */
export type ScreenshotCategory = "wizard" | "admin" | "debug";

/** Contrato tipado público (ScreenshotMatrixEntry). */
export interface ScreenshotMatrixEntry {
  readonly relativePath: string;
  readonly category: ScreenshotCategory;
  readonly description: string;
}

/** Constantes exportadas (SCREENSHOT_CAPTURE_MATRIX) compartidas por el instalador. */
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
    relativePath: "wizard/05-preflight-loading.png",
    category: "wizard",
    description: "Preflight ejecutando validaciones (loading)",
  },
  {
    relativePath: "wizard/06-preflight-warning-blockers.png",
    category: "wizard",
    description: "Preflight con warning de bloqueantes",
  },
  {
    relativePath: "wizard/07-config-top.png",
    category: "wizard",
    description: "Configuración parte superior",
  },
  {
    relativePath: "wizard/08-config-env-paper.png",
    category: "wizard",
    description: "Sección entorno de ejecución",
  },
  {
    relativePath: "wizard/09-config-users-paper.png",
    category: "wizard",
    description: "Sección usuarios por defecto",
  },
  {
    relativePath: "wizard/10-config-backups-paper.png",
    category: "wizard",
    description: "Sección política de backups",
  },
  {
    relativePath: "wizard/11-config-advanced-secrets-paper.png",
    category: "wizard",
    description: "Secretos avanzados desplegados",
  },
  {
    relativePath: "wizard/12-config-validation-username-collision.png",
    category: "wizard",
    description: "Validación colisión admin/superadmin",
  },
  {
    relativePath: "wizard/13-config-reinstall-info.png",
    category: "wizard",
    description: "Configuración en modo reinstalación",
  },
  {
    relativePath: "wizard/14-config-tls-custom-validation-error.png",
    category: "wizard",
    description: "Error validación TLS personalizado incompleto",
  },
  {
    relativePath: "wizard/15-smtp-initial.png",
    category: "wizard",
    description: "Formulario SMTP inicial",
  },
  {
    relativePath: "wizard/16-smtp-test-loading.png",
    category: "wizard",
    description: "SMTP probando conexión (loading)",
  },
  {
    relativePath: "wizard/17-smtp-test-success.png",
    category: "wizard",
    description: "SMTP prueba de conexión exitosa",
  },
  {
    relativePath: "wizard/18-deploy-before-start.png",
    category: "wizard",
    description: "Despliegue antes de iniciar",
  },
  {
    relativePath: "wizard/19-deploy-progress.png",
    category: "wizard",
    description: "Despliegue con progreso",
  },
  {
    relativePath: "wizard/20-finish-success.png",
    category: "wizard",
    description: "Finalización exitosa",
  },
  {
    relativePath: "wizard/21-deploy-retry-error.png",
    category: "wizard",
    description: "Reintento de instalación con error simulado",
  },
  {
    relativePath: "wizard/22-finish-error.png",
    category: "wizard",
    description: "Finalización con incidencias",
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
    relativePath: "admin/06-control-logs-empty-state.png",
    category: "admin",
    description: "Estado vacío del visor de logs",
  },
  {
    relativePath: "admin/07-control-logs-with-data.png",
    category: "admin",
    description: "Visor de logs con eventos cargados",
  },
  {
    relativePath: "admin/08-modal-prune-open.png",
    category: "admin",
    description: "Modal limpieza agresiva abierto",
  },
  {
    relativePath: "admin/09-modal-uninstall-open.png",
    category: "admin",
    description: "Modal desinstalación abierto",
  },
  {
    relativePath: "admin/10-modal-backup-destination-default.png",
    category: "admin",
    description: "Modal destino backup manual en modo por defecto",
  },
  {
    relativePath: "admin/11-modal-backup-destination-custom.png",
    category: "admin",
    description: "Modal destino backup manual en modo carpeta personalizada",
  },
  {
    relativePath: "admin/12-control-restore-selected-pending-confirmation.png",
    category: "admin",
    description: "Restore con backup seleccionado y confirmación pendiente",
  },
  {
    relativePath: "debug/01-debug-console.png",
    category: "debug",
    description: "Ventana secundaria consola debug",
  },
] as const;
