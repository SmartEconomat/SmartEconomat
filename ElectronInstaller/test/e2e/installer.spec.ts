import { expect, test } from "@playwright/test";

type BridgeCalls = {
  runPreflight: number;
  startInstallation: number;
  startStack: number;
  stopStack: number;
  restartStack: number;
  getHealth: number;
  tailLogs: number;
  stopLogStream: number;
  exportVisibleLogs: number;
  pruneSafe: number;
  backupNow: number;
  restoreFrom: number;
  diagnostics: number;
  pickInstallerFile: number;
};

test.describe("SmartEconomat Installer E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const listeners = {
        installerProgress: [] as Array<(event: unknown) => void>,
        runtimeLog: [] as Array<(event: unknown) => void>,
      };

      const bridgeCalls: BridgeCalls = {
        runPreflight: 0,
        startInstallation: 0,
        startStack: 0,
        stopStack: 0,
        restartStack: 0,
        getHealth: 0,
        tailLogs: 0,
        stopLogStream: 0,
        exportVisibleLogs: 0,
        pruneSafe: 0,
        backupNow: 0,
        restoreFrom: 0,
        diagnostics: 0,
        pickInstallerFile: 0,
      };

      const preflightReport = {
        generatedAt: new Date().toISOString(),
        checks: [
          {
            id: "docker-engine",
            label: "Docker Engine",
            status: "OK" as const,
            detail: "Docker operativo en entorno de prueba E2E.",
          },
          {
            id: "docker-compose",
            label: "Docker Compose",
            status: "OK" as const,
            detail: "Compose operativo en entorno de prueba E2E.",
          },
        ],
      };

      const healthyServices = [
        {
          service: "backend" as const,
          status: "healthy" as const,
          detail: "API lista para recibir peticiones.",
        },
        {
          service: "frontend" as const,
          status: "healthy" as const,
          detail: "UI y proxy HTTPS operativos.",
        },
      ];

      (window as Window & { __bridgeCalls?: BridgeCalls }).__bridgeCalls =
        bridgeCalls;

      window.smartEconomat = {
        runPreflight: async () => {
          bridgeCalls.runPreflight += 1;
          return {
            ok: true,
            message: "Preflight OK",
            data: preflightReport,
          };
        },
        runPreflightAutoRepair: async () => ({
          ok: true,
          message: "AutoRepair OK",
          data: preflightReport,
        }),
        testSmtp: async () => ({
          ok: true,
          message: "Mocked SMTP",
          data: true,
        }),
        releaseBusyPort: async () => ({
          ok: true,
          message: "Puerto liberado",
          data: preflightReport,
        }),
        startInstallation: async () => {
          bridgeCalls.startInstallation += 1;

          const snapshot = {
            state: "DONE" as const,
            timestamp: new Date().toISOString(),
            message: "Instalación completada en entorno de prueba.",
            stageLabel: "Finalizado",
            progressPercent: 100,
          };

          listeners.installerProgress.forEach((callback) => {
            callback({ snapshot });
          });

          return {
            ok: true,
            message: "Instalación finalizada",
            data: snapshot,
          };
        },
        pickInstallerFile: async (payload) => {
          bridgeCalls.pickInstallerFile += 1;
          const isBackupPicker = payload.title
            .toLowerCase()
            .includes("backup");
          return {
            ok: true,
            message: "Archivo seleccionado",
            data: isBackupPicker
              ? "C:/SmartEconomatRuntime/backups/backup-e2e.tar.gz"
              : "C:/SmartEconomatRuntime/certs/fullchain.pem",
          };
        },
        getInstallerState: async () => ({
          ok: true,
          message: "Estado disponible",
          data: {
            state: "IDLE",
            timestamp: new Date().toISOString(),
            message: "Sin actividad",
          },
        }),
        getInstallerBootState: async () => ({
          ok: true,
          message: "Sin instalación previa",
          data: {
            installed: false,
            runtimePath: "C:/SmartEconomatRuntime",
          },
        }),
        onInstallerProgress: (callback) => {
          listeners.installerProgress.push(callback as (event: unknown) => void);
          return () => {
            listeners.installerProgress = listeners.installerProgress.filter(
              (current) => current !== callback,
            );
          };
        },
        startStack: async () => {
          bridgeCalls.startStack += 1;
          return { ok: true, message: "Stack iniciado" };
        },
        stopStack: async () => {
          bridgeCalls.stopStack += 1;
          return { ok: true, message: "Stack detenido" };
        },
        restartStack: async () => {
          bridgeCalls.restartStack += 1;
          return { ok: true, message: "Stack reiniciado" };
        },
        getHealth: async () => {
          bridgeCalls.getHealth += 1;
          return {
            ok: true,
            message: "Health OK",
            data: healthyServices,
          };
        },
        tailLogs: async (payload) => {
          bridgeCalls.tailLogs += 1;
          listeners.runtimeLog.forEach((callback) => {
            callback({
              service: payload.service,
              line: `Log de ${payload.service} en prueba E2E.`,
              timestamp: new Date().toISOString(),
            });
          });
          return { ok: true, message: "Stream de logs activo" };
        },
        stopLogStream: async () => {
          bridgeCalls.stopLogStream += 1;
          return { ok: true, message: "Stream detenido" };
        },
        exportVisibleLogs: async () => {
          bridgeCalls.exportVisibleLogs += 1;
          return {
            ok: true,
            message: "Logs exportados",
            data: "C:/SmartEconomatRuntime/logs/smarteconomat-logs-e2e.txt",
          };
        },
        onRuntimeLog: (callback) => {
          listeners.runtimeLog.push(callback as (event: unknown) => void);
          return () => {
            listeners.runtimeLog = listeners.runtimeLog.filter(
              (current) => current !== callback,
            );
          };
        },
        pruneSafe: async () => {
          bridgeCalls.pruneSafe += 1;
          return { ok: true, message: "Limpieza ejecutada" };
        },
        uninstall: async () => {
          return { ok: true, message: "Desinstalación completada" };
        },
        backupNow: async () => {
          bridgeCalls.backupNow += 1;
          return {
            ok: true,
            message: "Backup generado",
            data: {
              appVersion: "1.0.0",
              schemaVersion: "v1",
              createdAt: new Date().toISOString(),
              checksum: "checksum-e2e",
              archiveName: "backup-e2e.tar.gz",
            },
          };
        },
        restoreFrom: async () => {
          bridgeCalls.restoreFrom += 1;
          return {
            ok: true,
            message: "Restore completado",
          };
        },
        diagnostics: async () => {
          bridgeCalls.diagnostics += 1;
          return {
            ok: true,
            message: "Diagnóstico generado",
            data: "C:/SmartEconomatRuntime/diagnostics/diag-e2e.zip",
          };
        },
        onDebugLog: () => () => undefined,
        getDebugLogs: async () => ({
          ok: true,
          message: "Sin logs de debug",
          data: [],
        }),
        clearDebugLogs: async () => ({
          ok: true,
          message: "Buffer de debug limpiado",
        }),
        isDebugModeEnabled: async () => ({
          ok: true,
          message: "Debug desactivado",
          data: false,
        }),
        sendDebugLog: () => undefined,
        getWatchdogStatus: async () => ({
          ok: true,
          message: "Watchdog status",
          data: {
            health: [],
            watchdog: {
              state: "idle" as const,
              consecutiveFailures: 0,
              currentRecoveryLevel: 1 as const,
              nextCheckInMs: 0,
              lastCheck: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          },
        }),
        getSupervisorSnapshot: async () => ({
          ok: true,
          message: "Supervisor snapshot",
          data: {
            overallState: "healthy" as const,
            checks: [],
            lastAutomaticActionAt: null,
            lastAutomaticAction: null,
            uptimeSeconds: 120,
          },
        }),
        restartDockerDesktop: async () => ({
          ok: true,
          message: "Docker reiniciado",
        }),
        runSupervisorRecovery: async () => ({
          ok: true,
          message: "Recuperación ejecutada",
        }),
        onHealthUpdate: () => () => {},
      };
    });

    await page.goto("/");
    await expect(page.getByRole("button", { name: "Iniciar instalación guiada" })).toBeVisible();
  });

  async function goToControlPanel(page: import("@playwright/test").Page) {
    await page.getByRole("button", { name: "Iniciar instalación guiada" }).click();
    await page.getByRole("button", { name: "Ejecutar preflight" }).click();
    await expect(page.getByText("Docker Engine")).toBeVisible();
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    const confirmNewInstallCheckbox = page.getByRole("checkbox", {
      name: /Entiendo las implicaciones y deseo continuar con la instalación nueva/i,
    });
    if (await confirmNewInstallCheckbox.isVisible()) {
      await confirmNewInstallCheckbox.check();
    }

    const scheduleTimeInput = page.getByLabel("Hora programada");
    if (await scheduleTimeInput.isVisible()) {
      await scheduleTimeInput.fill("02:00");
    }

    await page.getByRole("button", { name: /^Continuar$/ }).click();

    const smtpStepHeading = page.getByRole("heading", {
      name: "Configuración de Email (SMTP)",
    });
    if (await smtpStepHeading.isVisible()) {
      await page.getByRole("button", { name: /^Continuar$/ }).click();
    }

    await page.getByRole("button", { name: "Iniciar instalación" }).click();
    await expect(page.getByText("Instalación finalizada")).toBeVisible();
    await page.getByRole("button", { name: "Abrir panel de control local" }).click();
    await expect(
      page.getByRole("heading", { name: "Panel de Control" }),
    ).toBeVisible();
  }

  test("recorre wizard completo por clics hasta panel de control", async ({ page }) => {
    await goToControlPanel(page);

    const calls = await page.evaluate(() => {
      return (window as Window & { __bridgeCalls?: BridgeCalls }).__bridgeCalls;
    });

    expect(calls?.runPreflight).toBe(1);
    expect(calls?.startInstallation).toBe(1);
  });

  test("ejecuta operaciones principales del panel y actualiza logs", async ({ page }) => {
    await goToControlPanel(page);

    await page
      .getByRole("button", { name: "Iniciar Stack", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Detener Stack", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Reiniciar Stack", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Verificar Salud", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Logs Backend", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Detener Logs", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Generar Diagnóstico Completo",
        exact: true,
      })
      .click();

    await expect(page.getByText("Logs de la Aplicación")).toBeVisible();

    const calls = await page.evaluate(() => {
      return (window as Window & { __bridgeCalls?: BridgeCalls }).__bridgeCalls;
    });

    expect(calls?.startStack).toBe(1);
    expect(calls?.stopStack).toBe(1);
    expect(calls?.restartStack).toBe(1);
    expect(calls?.tailLogs).toBeGreaterThanOrEqual(1);
    expect(calls?.stopLogStream).toBe(1);
    expect(calls?.diagnostics).toBe(1);
  });

  test("valida salvaguardas de limpieza agresiva", async ({ page }) => {
    await goToControlPanel(page);

    await page.getByRole("button", { name: "Limpieza Agresiva" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const confirmButton = dialog.getByRole("button", {
      name: "Ejecutar limpieza agresiva",
    });
    await expect(confirmButton).toBeDisabled();

    await dialog.getByRole("textbox").fill("CONFIRMAR");
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    await expect(dialog).not.toBeVisible();

    const calls = await page.evaluate(() => {
      return (window as Window & { __bridgeCalls?: BridgeCalls }).__bridgeCalls;
    });

    expect(calls?.pruneSafe).toBe(1);
  });

  test("cubre backup, selección de artefacto y restauración con confirmación", async ({ page }) => {
    await goToControlPanel(page);

    await page.getByRole("button", { name: "Crear Backup Ahora" }).click();
    const backupDialog = page.getByRole("dialog", {
      name: "Destino del backup manual",
    });
    await expect(backupDialog).toBeVisible();
    await backupDialog.getByRole("button", { name: "Iniciar backup" }).click();
    await expect(backupDialog).not.toBeVisible();

    await page.getByRole("button", { name: "Seleccionar archivo..." }).click();
    await expect(
      page.locator(
        'input[value="C:/SmartEconomatRuntime/backups/backup-e2e.tar.gz"]',
      ),
    ).toBeVisible();

    const restoreButton = page.getByRole("button", {
      name: "Restaurar Backup Seleccionado",
    });
    await expect(restoreButton).toBeDisabled();

    await page
      .getByRole("checkbox", {
        name: "Entiendo que esta restauración sobrescribirá el estado actual de SmartEconomat.",
      })
      .check();
    await expect(restoreButton).toBeEnabled();
    await restoreButton.click();

    const calls = await page.evaluate(() => {
      return (window as Window & { __bridgeCalls?: BridgeCalls }).__bridgeCalls;
    });

    expect(calls?.backupNow).toBe(1);
    expect(calls?.pickInstallerFile).toBeGreaterThanOrEqual(1);
    expect(calls?.restoreFrom).toBe(1);
  });
});
