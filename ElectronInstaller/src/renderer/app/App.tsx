import { useEffect, useRef, useState } from "react";
import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";

import { BackupRestorePanel } from "@renderer/components/BackupRestorePanel";
import { ConfirmDangerDialog } from "@renderer/components/ConfirmDangerDialog";
import { LogsViewer } from "@renderer/components/LogsViewer";
import { useInstallerFlow } from "@renderer/hooks/use-installer-flow";
import { ConfigPage } from "@renderer/pages/ConfigPage";
import { ControlPanelPage } from "@renderer/pages/ControlPanelPage";
import { DeployPage } from "@renderer/pages/DeployPage";
import { FinishPage } from "@renderer/pages/FinishPage";
import { PreflightPage } from "@renderer/pages/PreflightPage";
import { WelcomePage } from "@renderer/pages/WelcomePage";
import { SmtpConfigPage } from "@renderer/pages/SmtpConfigPage";
import BrandLogo from "@renderer/assets/images/SVG/logo-smat-economato.svg";
import type { SupervisorSnapshot } from "@shared/contracts";
import { countOperationalServices } from "@shared/service-health";

function supervisorStatusChip(snapshot: SupervisorSnapshot | null): {
  label: string;
  color: "default" | "success" | "warning" | "error" | "info";
} {
  if (!snapshot) {
    return { label: "Supervisor: sin datos", color: "default" };
  }

  if (
    snapshot.overallState === "healthy" &&
    (snapshot.healthModel?.auxiliaryIssues.length ?? 0) > 0
  ) {
    return {
      label: "Supervisor: operativo con observaciones",
      color: "info",
    };
  }

  switch (snapshot.overallState) {
    case "healthy":
      return { label: "Supervisor: operativo", color: "success" };
    case "stabilizing":
      return {
        label: "Inicializando entorno Docker…",
        color: "info",
      };
    case "recovering":
      return { label: "Supervisor: recuperando", color: "warning" };
    default:
      return { label: "Supervisor: degradado", color: "error" };
  }
}

export function App() {
  const flow = useInstallerFlow();
  const [dangerOpen, setDangerOpen] = useState(false);
  const [uninstallOpen, setUninstallOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isWelcomeStep = flow.step === "welcome";
  const isPreflightStep = flow.step === "preflight";
  const isFinishStep = flow.step === "finish";
  const isControlStep = flow.step === "control";
  const isSmtpStep = flow.step === "smtp";
  const isPreflightPending = isPreflightStep && !flow.preflightReport;
  const isCompactStep =
    !isControlStep && (isWelcomeStep || isPreflightPending || isFinishStep);
  const useContentHeightLayout = !isControlStep && !isSmtpStep;
  const shouldCenterMainCard = isCompactStep;
  const lastBackupLabel = flow.lastBackup ? "Disponible" : "Sin backup";
  const supervisorChip = supervisorStatusChip(flow.supervisorSnapshot);
  const { up: servicesUp, total: servicesTotal } = countOperationalServices(
    flow.health,
  );

  useEffect(() => {
    if (flow.step === "control") {
      void flow.refreshHealth();
    }
  }, [flow.step]);

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    contentRef.current.scrollTop = 0;
  }, [flow.step]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        p: 0,
        m: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 12% 18%, rgba(229, 0, 70, 0.11) 0%, rgba(229, 0, 70, 0) 42%), linear-gradient(180deg, #eef2f7 0%, #e7ebf2 100%)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 20,
          width: "100%",
          borderBottom: "1px solid",
          borderColor: "rgba(15, 23, 42, 0.08)",
          background:
            "linear-gradient(130deg, rgba(255, 248, 252, 0.98) 0%, rgba(255, 255, 255, 0.94) 60%, rgba(255, 255, 255, 0.98) 100%)",
        }}
      >
        <Box
          sx={{
            width: "min(1180px, 100%)",
            mx: "auto",
            px: { xs: 2, sm: 2.5, md: 4 },
            py: { xs: 1, sm: 1.15, md: 1.35 },
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            gap: { xs: 1.2, sm: 1.6, md: 2 },
          }}
        >
          <Box
            component="img"
            src={BrandLogo}
            alt="SmartEconomat"
            sx={{
              display: "block",
              height: { xs: 34, sm: 40, md: 46 },
              width: "auto",
              maxWidth: "100%",
              flexShrink: 0,
            }}
          />
          <Box
            sx={{
              minWidth: 0,
              display: "grid",
              alignContent: "center",
              gap: 0.35,
              textAlign: "center",
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.03,
                fontSize: { xs: "1.5rem", sm: "1.95rem", md: "2.35rem" },
                fontFamily: '"Manrope", "Segoe UI", sans-serif',
                mb: 0,
              }}
            >
              Installer Plug-and-Play
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: 860,
                lineHeight: 1.45,
                fontSize: { xs: "0.9rem", md: "0.98rem" },
              }}
            >
              Instalación guiada transaccional con hardening mínimo, diagnóstico
              operativo y control local de lifecycle.
            </Typography>
          </Box>
          <Box
            aria-hidden
            sx={{
              height: 1,
              width: { xs: 34, sm: 40, md: 46 },
              flexShrink: 0,
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          flex: 1,
          minHeight: 0,
          display: "grid",
          alignItems: shouldCenterMainCard ? "center" : "start",
          px: { xs: 0, sm: 1.5, md: 2.25 },
          py: { xs: 0, sm: 1.5, md: 2.25 },
          // Único scroll bajo la cabecera: antes overflow visible + Paper hidden recortaba sin scroll
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        <Paper
          elevation={useContentHeightLayout ? 0 : 10}
          sx={{
            width: useContentHeightLayout
              ? "min(980px, 100%)"
              : "min(1180px, 100%)",
            height: useContentHeightLayout ? "auto" : "100%",
            minHeight: useContentHeightLayout ? "unset" : 0,
            mx: "auto",
            borderRadius: { xs: 0, sm: 2.5 },
            boxShadow: useContentHeightLayout
              ? "none"
              : "0 22px 52px rgba(15, 23, 42, 0.14)",
            border: "1px solid",
            borderColor: "rgba(15, 23, 42, 0.08)",
            backgroundColor: "#ffffff",
            backdropFilter: "none",
            overflow: "hidden",
            display: "grid",
            gridTemplateRows: "minmax(0, 1fr)",
          }}
        >
          <Box
            ref={contentRef}
            sx={{
              p: isCompactStep
                ? { xs: 2.5, sm: 3.25, md: 4 }
                : { xs: 2, sm: 2.5, md: 3 },
              display: "grid",
              gap: 2,
              minHeight: useContentHeightLayout ? "auto" : 0,
              overflowY: useContentHeightLayout ? "visible" : "auto",
              overscrollBehavior: "contain",
              alignContent: shouldCenterMainCard ? "center" : "start",
            }}
          >
            {flow.error ? (
              <Alert severity="error" sx={{ m: 0 }}>
                {flow.error}
              </Alert>
            ) : null}

            <Box
              component="section"
              sx={{
                display: "grid",
                gap: 2,
                minWidth: 0,
                width: "100%",
                maxWidth: isWelcomeStep
                  ? 780
                  : isPreflightPending
                    ? 900
                    : "100%",
                mx: isCompactStep ? "auto" : 0,
              }}
            >
              {flow.step === "welcome" ? (
                <WelcomePage onContinue={() => flow.setStep("preflight")} />
              ) : null}

              {flow.step === "preflight" ? (
                <PreflightPage
                  report={flow.preflightReport}
                  busy={flow.busy}
                  blockersCount={flow.blockersCount}
                  runtimeLogs={flow.logs.filter(
                    (log) =>
                      log.line.includes("AUTO_REPAIR") ||
                      log.line.includes("[PREFLIGHT") ||
                      log.line.includes("[CLEANUP") ||
                      log.line.includes("[PORTS") ||
                      log.line.includes("[WINDOWS-REPAIR"),
                  )}
                  onRun={flow.runPreflight}
                  onAutoRepair={flow.runAutoRepair}
                  onTrustWindowsRootCertificate={
                    flow.trustWindowsRootCertificate
                  }
                  onCloseBusyPort={flow.closeBusyPort}
                  onBack={() => {
                    if (flow.busy) {
                      return;
                    }
                    flow.setStep("welcome");
                  }}
                  onContinue={() => {
                    if (flow.busy) {
                      return;
                    }
                    flow.setStep("config");
                  }}
                />
              ) : null}

              {flow.step === "config" ? (
                <ConfigPage
                  config={flow.config}
                  busy={flow.busy}
                  backupDefaultDirectory={flow.backupDefaultDirectory}
                  onChange={flow.setConfig}
                  onSaveBackupDefaultDirectory={flow.setBackupDefaultDirectory}
                  onPickBackupDirectory={flow.pickBackupDirectory}
                  onBack={() => flow.setStep("preflight")}
                  onContinue={() => flow.setStep("smtp")}
                  onPickInstallerFile={flow.pickInstallerFile}
                />
              ) : null}

              {flow.step === "smtp" ? (
                <SmtpConfigPage
                  config={flow.config}
                  busy={flow.busy}
                  onChange={flow.setConfig}
                  onBack={() => flow.setStep("config")}
                  onContinue={() => flow.setStep("deploy")}
                />
              ) : null}

              {flow.step === "deploy" ? (
                <DeployPage
                  config={flow.config}
                  busy={flow.busy}
                  logs={flow.logs}
                  state={flow.installerState}
                  onBack={() => flow.setStep("smtp")}
                  onDeploy={flow.startInstallation}
                />
              ) : null}

              {flow.step === "finish" ? (
                <FinishPage
                  snapshot={flow.installerState}
                  onOpenPanel={() => flow.setStep("control")}
                  onRestart={() => flow.setStep("deploy")}
                />
              ) : null}

              {flow.step === "control" ? (
                <ControlPanelPage
                  busy={flow.busy}
                  health={flow.health}
                  watchdogStatus={flow.watchdogStatus}
                  supervisorSnapshot={flow.supervisorSnapshot}
                  onStart={flow.startStack}
                  onStop={flow.stopStack}
                  onRestart={flow.restartStack}
                  onRefresh={flow.refreshHealth}
                  onRestartDockerDesktop={flow.restartDockerDesktop}
                  onRunSupervisorRecovery={flow.runSupervisorRecovery}
                  onStartLogs={flow.tailLogs}
                  onStopLogs={flow.stopLogs}
                  onDiagnostics={flow.generateDiagnostics}
                  onOpenDanger={() => setDangerOpen(true)}
                  onOpenUninstall={() => setUninstallOpen(true)}
                >
                  <Box
                    sx={{
                      mt: 0.25,
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "minmax(0, 1.15fr) minmax(0, 1fr)",
                      },
                      alignItems: "start",
                    }}
                  >
                    <Box sx={{ display: "grid", gap: 2 }}>
                      <LogsViewer
                        logs={flow.logs}
                        busy={flow.busy}
                        onClearLogs={flow.clearVisibleLogs}
                        onExportLogs={flow.exportVisibleLogs}
                      />

                      <Paper
                        variant="outlined"
                        sx={{
                          p: { xs: 1.6, sm: 1.85 },
                          borderRadius: 3,
                          borderColor: "rgba(148, 163, 184, 0.28)",
                        }}
                      >
                        <Stack spacing={1.2}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={0.8}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 800 }}
                            >
                              Estado rápido del runtime
                            </Typography>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap">
                              <Chip
                                size="small"
                                label={supervisorChip.label}
                                color={supervisorChip.color}
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={lastBackupLabel}
                                color={flow.lastBackup ? "success" : "default"}
                                variant={flow.lastBackup ? "filled" : "outlined"}
                              />
                            </Stack>
                          </Stack>

                          <Box
                            sx={{
                              display: "grid",
                              gap: 1,
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                lg: "repeat(4, minmax(0, 1fr))",
                              },
                            }}
                          >
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1.1,
                                borderRadius: 2,
                                bgcolor: "grey.50",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Eventos en buffer
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {flow.logs.length}
                              </Typography>
                            </Paper>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1.1,
                                borderRadius: 2,
                                bgcolor: "grey.50",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Servicios activos
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {servicesUp}/{servicesTotal}
                              </Typography>
                            </Paper>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1.1,
                                borderRadius: 2,
                                bgcolor: "grey.50",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Watchdog
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {flow.watchdogStatus?.state ?? "N/A"}
                              </Typography>
                            </Paper>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1.1,
                                borderRadius: 2,
                                bgcolor: "grey.50",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Backups
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {flow.lastBackup ? "1+" : "0"}
                              </Typography>
                            </Paper>
                          </Box>
                        </Stack>
                      </Paper>
                    </Box>

                    <BackupRestorePanel
                      lastBackup={flow.lastBackup}
                      busy={flow.busy}
                      backupDefaultDirectory={flow.backupDefaultDirectory}
                      onSaveBackupDefaultDirectory={
                        flow.setBackupDefaultDirectory
                      }
                      onPickBackupDirectory={flow.pickBackupDirectory}
                      onBackup={flow.backupNow}
                      onRestore={flow.restoreFrom}
                      onPickRestoreArtifact={flow.pickRestoreArtifact}
                    />
                  </Box>
                </ControlPanelPage>
              ) : null}
            </Box>
          </Box>

          <ConfirmDangerDialog
            open={dangerOpen}
            title="Confirmar limpieza agresiva"
            description="Se eliminarán volúmenes, imágenes no usadas y contenedores detenidos del entorno local. Revisa que no necesites esos datos antes de continuar."
            confirmationText="CONFIRMAR"
            onCancel={() => setDangerOpen(false)}
            onConfirm={async (phrase) => {
              await flow.prune("aggressive", phrase);
              setDangerOpen(false);
            }}
          />

          <ConfirmDangerDialog
            open={uninstallOpen}
            title="Confirmar desinstalación completa"
            description="Esta acción eliminará completamente SmartEconomat del sistema: contenedores Docker, volúmenes de datos, imágenes, certificados de confianza, entradas del registro de Windows, atajos y tareas programadas. Los datos almacenados en la base de datos se perderán de forma irreversible."
            confirmationText="CONFIRMAR"
            confirmButtonLabel="Desinstalar SmartEconomat"
            onCancel={() => setUninstallOpen(false)}
            onConfirm={async (phrase) => {
              await flow.uninstall(phrase);
              setUninstallOpen(false);
            }}
          />
        </Paper>
      </Box>
    </Box>
  );
}
