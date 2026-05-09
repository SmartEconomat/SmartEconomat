import { useEffect, useRef, useState } from "react";
import { Alert, Box, Paper, Typography } from "@mui/material";

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
import BrandLogo from "@renderer/assets/images/SVG/logo-smat-economato.svg";

/**
 * Expone la operación "App" del instalador SmartEconomat.
 * @returns {import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/jsx-runtime").JSX.Element} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function App() {
  const flow = useInstallerFlow();
  const [dangerOpen, setDangerOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

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
        minHeight: "100vh",
        p: { xs: 1, sm: 2, md: 3 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, rgba(15, 23, 42, 0.18) 0%, rgba(15, 23, 42, 0.08) 100%)",
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: "min(1040px, 100%)",
          maxHeight: "calc(100vh - 16px)",
          borderRadius: { xs: 2, md: 3 },
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto minmax(0, 1fr)",
        }}
      >
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            borderBottom: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(135deg, rgba(229, 0, 70, 0.08) 0%, rgba(255,255,255,0.96) 54%, rgba(255,255,255,1) 100%)",
          }}
        >
          <Box
            component="img"
            src={BrandLogo}
            alt="SmartEconomat"
            sx={{
              display: "block",
              height: { xs: 50, md: 60 },
              width: "auto",
              maxWidth: "100%",
              mb: 1.15,
            }}
          />
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: 1.6, fontWeight: 800 }}
          >
            SmartEconomat
          </Typography>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.08,
              fontFamily: '"Manrope", "Segoe UI", sans-serif',
              mb: 1.1,
            }}
          >
            Installer Plug-and-Play
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 820, lineHeight: 1.72, fontSize: "1.02rem" }}
          >
            Instalación guiada transaccional con hardening mínimo, diagnóstico
            operativo y control local de lifecycle.
          </Typography>
        </Box>

        <Box
          ref={contentRef}
          sx={{
            p: { xs: 2, md: 3 },
            display: "grid",
            gap: 2,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {flow.error ? (
            <Alert severity="error" sx={{ m: 0 }}>
              {flow.error}
            </Alert>
          ) : null}

          <Box
            component="section"
            sx={{ display: "grid", gap: 2, minWidth: 0 }}
          >
            {flow.step === "welcome" ? (
              <WelcomePage onContinue={() => flow.setStep("preflight")} />
            ) : null}

            {flow.step === "preflight" ? (
              <PreflightPage
                report={flow.preflightReport}
                busy={flow.busy}
                blockersCount={flow.blockersCount}
                onRun={flow.runPreflight}
                onAutoRepair={flow.runAutoRepair}
                onCloseBusyPort={flow.closeBusyPort}
                onBack={() => flow.setStep("welcome")}
                onContinue={() => flow.setStep("config")}
              />
            ) : null}

            {flow.step === "config" ? (
              <ConfigPage
                config={flow.config}
                busy={flow.busy}
                onChange={flow.setConfig}
                onBack={() => flow.setStep("preflight")}
                onContinue={() => flow.setStep("deploy")}
                onPickInstallerFile={flow.pickInstallerFile}
              />
            ) : null}

            {flow.step === "deploy" ? (
              <DeployPage
                config={flow.config}
                busy={flow.busy}
                logs={flow.logs}
                state={flow.installerState}
                onBack={() => flow.setStep("config")}
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
                onStart={flow.startStack}
                onStop={flow.stopStack}
                onRestart={flow.restartStack}
                onRefresh={flow.refreshHealth}
                onStartLogs={flow.tailLogs}
                onStopLogs={flow.stopLogs}
                onDiagnostics={flow.generateDiagnostics}
                onOpenDanger={() => setDangerOpen(true)}
              >
                <Box
                  sx={{
                    mt: 0.25,
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "minmax(0, 1.5fr) minmax(320px, 1fr)",
                    },
                  }}
                >
                  <LogsViewer
                    logs={flow.logs}
                    busy={flow.busy}
                    onClearLogs={flow.clearVisibleLogs}
                    onExportLogs={flow.exportVisibleLogs}
                  />
                  <BackupRestorePanel
                    lastBackup={flow.lastBackup}
                    busy={flow.busy}
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
      </Paper>
    </Box>
  );
}
