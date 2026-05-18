/**
 * Mock de `window.smartEconomat` para E2E web (Vite preview).
 * Se inyecta con page.addInitScript({ path: ... }).
 */
(() => {
  const listeners = {
    installerProgress: [],
    runtimeLog: [],
  };

  const bridgeCalls = {
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
    testSmtp: 0,
    uninstall: 0,
    restartDockerDesktop: 0,
    runSupervisorRecovery: 0,
  };

  const preflightReport = {
    generatedAt: new Date().toISOString(),
    checks: [
      {
        id: "docker-engine",
        label: "Docker Engine",
        status: "OK",
        detail: "Docker operativo en entorno de prueba E2E.",
      },
      {
        id: "docker-compose",
        label: "Docker Compose",
        status: "OK",
        detail: "Compose operativo en entorno de prueba E2E.",
      },
    ],
  };

  const healthyServices = [
    {
      service: "backend",
      status: "healthy",
      detail: "API lista para recibir peticiones.",
    },
    {
      service: "frontend",
      status: "healthy",
      detail: "UI y proxy HTTPS operativos.",
    },
    {
      service: "db",
      status: "running",
      detail: "PostgreSQL en ejecución (mock capturas).",
    },
    {
      service: "redis",
      status: "healthy",
      detail: "Redis operativo (mock capturas).",
    },
  ];

  window.__bridgeCalls = bridgeCalls;

  window.__mockBridgeFlags = Object.assign(
    { installFailMessage: "" },
    window.__mockBridgeFlags || {},
  );

  window.smartEconomat = {
    setCaptureMockFlags: async (flags) => {
      if (!window.__mockBridgeFlags) {
        window.__mockBridgeFlags = {};
      }
      for (const [key, value] of Object.entries(flags)) {
        window.__mockBridgeFlags[key] = value;
      }
      return { ok: true, message: "Flags de mock actualizadas" };
    },
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
    testSmtp: async () => {
      bridgeCalls.testSmtp += 1;
      return {
        ok: true,
        message: "Mocked SMTP",
        data: true,
      };
    },
    releaseBusyPort: async () => ({
      ok: true,
      message: "Puerto liberado",
      data: preflightReport,
    }),
    startInstallation: async () => {
      bridgeCalls.startInstallation += 1;

      const failMessage = String(
        window.__mockBridgeFlags?.installFailMessage || "",
      ).trim();
      if (failMessage.length > 0) {
        return {
          ok: false,
          message: failMessage,
          data: null,
        };
      }

      const inProgressSnapshot = {
        state: "DOCKER_DEPLOY",
        timestamp: new Date().toISOString(),
        message: "Desplegando servicios del stack.",
        stageLabel: "Desplegando",
        progressPercent: 55,
      };
      listeners.installerProgress.forEach((callback) => {
        callback({ snapshot: inProgressSnapshot });
      });
      await new Promise((resolve) => setTimeout(resolve, 900));

      const snapshot = {
        state: "DONE",
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
      const isBackupPicker = String(payload.title || "")
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
      listeners.installerProgress.push(callback);
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
      listeners.runtimeLog.push(callback);
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
      bridgeCalls.uninstall += 1;
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
          state: "idle",
          consecutiveFailures: 0,
          currentRecoveryLevel: 1,
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
        overallState: "healthy",
        checks: [],
        lastAutomaticActionAt: null,
        lastAutomaticAction: null,
        uptimeSeconds: 120,
        incidentsResolved: 0,
        incidentsOpen: 0,
        lastIncidentAt: null,
        latestIncident: null,
        recentIncidents: [],
        healthModel: {
          systemState: "healthy",
          sourceOfTruth: "hybrid",
          summary: "Stack operativo en entorno de prueba E2E.",
          primaryIssues: [],
          auxiliaryIssues: [],
        },
      },
    }),
    restartDockerDesktop: async () => {
      bridgeCalls.restartDockerDesktop += 1;
      return {
        ok: true,
        message: "Docker reiniciado",
      };
    },
    runSupervisorRecovery: async () => {
      bridgeCalls.runSupervisorRecovery += 1;
      return {
        ok: true,
        message: "Recuperación ejecutada",
      };
    },
    onHealthUpdate: () => () => {},
  };
})();
