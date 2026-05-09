import { useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { Box, Paper, Typography } from "@mui/material";

import { BackupRestorePanel } from "@renderer/components/BackupRestorePanel";
import { ConfirmDangerDialog } from "@renderer/components/ConfirmDangerDialog";
import { LogsViewer } from "@renderer/components/LogsViewer";
import { ControlPanelPage } from "@renderer/pages/ControlPanelPage";
import { ThemeContextProvider } from "@renderer/store/ThemeContext";
import { useThemeContext } from "@renderer/store/theme.hooks";
import BrandLogo from "@renderer/assets/images/SVG/logo-smat-economato.svg";
import type {
  BackupMetadata,
  RuntimeLogEvent,
  ServiceHealth,
} from "@shared/contracts";

const mockHealth: ServiceHealth[] = [
  {
    service: "backend",
    status: "running",
    detail:
      "Servicio en ejecución. Docker reporta running y la API está respondiendo correctamente a peticiones internas.",
  },
  {
    service: "frontend",
    status: "running",
    detail:
      "Servicio en ejecución. Docker reporta running y el proxy HTTPS local publica la interfaz sin incidencias.",
  },
];

const mockLogs: RuntimeLogEvent[] = [
  {
    timestamp: "2026-04-13T12:42:10.000Z",
    service: "backend",
    line: "HTTP server listening on port 3000 and JWT auth subsystem ready.",
  },
  {
    timestamp: "2026-04-13T12:42:13.000Z",
    service: "backend",
    line: "Health endpoint /api/v1 responded in 48ms.",
  },
  {
    timestamp: "2026-04-13T12:42:17.000Z",
    service: "frontend",
    line: "Nginx HTTPS listener active on 0.0.0.0:443 with local certificate.",
  },
  {
    timestamp: "2026-04-13T12:42:21.000Z",
    service: "installer",
    line: "Control panel preview loaded with mock runtime state.",
  },
  {
    timestamp: "2026-04-13T12:42:24.000Z",
    service: "frontend",
    line: "Static assets delivered successfully for SmartEconomat UI shell.",
  },
];

const mockBackup: BackupMetadata = {
  appVersion: "1.0.0",
  schemaVersion: "v1",
  createdAt: "2026-04-13T12:36:50.000Z",
  checksum: "93fc4d8a7cfe3b1d2e5aa97ce440a8dc",
  archiveName: "backup-manual-20260413-123650.tar.gz",
};

function PreviewShell() {
  const [dangerOpen, setDangerOpen] = useState(false);

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
          sx={{
            p: { xs: 2, md: 3 },
            display: "grid",
            gap: 2,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          <ControlPanelPage
            busy={false}
            health={mockHealth}
            onStart={async () => {}}
            onStop={async () => {}}
            onRestart={async () => {}}
            onRefresh={async () => {}}
            onStartLogs={async () => {}}
            onStopLogs={async () => {}}
            onDiagnostics={async () => {}}
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
                logs={mockLogs}
                busy={false}
                onClearLogs={() => {}}
                onExportLogs={async () => {}}
              />
              <BackupRestorePanel
                lastBackup={mockBackup}
                busy={false}
                onBackup={async () => {}}
                onRestore={async () => {}}
                onPickRestoreArtifact={async () => null}
                initialBackupLabel="backup-20260413"
                initialArtifactPath="/tmp/smarteconomat-runtime/backups/backup-manual-20260413-123650.tar.gz"
                initialRestoreAcknowledged
              />
            </Box>
          </ControlPanelPage>
        </Box>

        <ConfirmDangerDialog
          open={dangerOpen}
          title="Confirmar limpieza agresiva"
          description="Se eliminarán volúmenes, imágenes no usadas y contenedores detenidos del entorno local. Revisa que no necesites esos datos antes de continuar."
          confirmationText="CONFIRMAR"
          onCancel={() => setDangerOpen(false)}
          onConfirm={async () => {
            setDangerOpen(false);
          }}
        />
      </Paper>
    </Box>
  );
}

function ThemedPreviewShell() {
  const { siteTheme } = useThemeContext();

  return (
    <ThemeProvider theme={siteTheme}>
      <CssBaseline />
      <PreviewShell />
    </ThemeProvider>
  );
}

/**
 * Expone la operación "ControlPanelPreviewApp" del instalador SmartEconomat.
 * @returns {import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/jsx-runtime").JSX.Element} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function ControlPanelPreviewApp() {
  return (
    <ThemeContextProvider>
      <ThemedPreviewShell />
    </ThemeContextProvider>
  );
}
