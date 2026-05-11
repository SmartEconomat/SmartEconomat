import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  type ChipProps,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

import type { PreflightReport, RuntimeLogEvent } from "@shared/contracts";
import { WizardFooterNav } from "@renderer/components/WizardFooterNav";

interface PreflightPageProps {
  report: PreflightReport | null;
  busy: boolean;
  blockersCount: number;
  runtimeLogs: RuntimeLogEvent[];
  onRun: () => Promise<void>;
  onAutoRepair: () => Promise<void>;
  onCloseBusyPort: (port: number) => Promise<void>;
  onBack: () => void;
  onContinue: () => void;
}

export function PreflightPage({
  report,
  busy,
  blockersCount,
  runtimeLogs,
  onRun,
  onAutoRepair,
  onCloseBusyPort,
  onBack,
  onContinue,
}: PreflightPageProps) {
  const logsContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastLogCountRef = useRef(0);
  const [activeAction, setActiveAction] = useState<"run" | "repair" | null>(
    null,
  );

  const syncAutoScrollPreference = (): void => {
    const container = logsContainerRef.current;
    if (!container) {
      return;
    }

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceToBottom <= 24;
  };

  // Auto-scroll solo si el usuario ya estaba al final del panel.
  useEffect(() => {
    const container = logsContainerRef.current;
    if (!container) {
      return;
    }

    const hasNewLogs = runtimeLogs.length > lastLogCountRef.current;
    lastLogCountRef.current = runtimeLogs.length;

    if (hasNewLogs && shouldAutoScrollRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [runtimeLogs]);

  useEffect(() => {
    if (!busy) {
      setActiveAction(null);
    }
  }, [busy]);

  const latestLog = runtimeLogs.at(-1)?.line;
  const hasAutoRepairChecks =
    report?.checks.some(
      (check) => check.repairable && check.repairAction === "auto-repair",
    ) ?? false;
  const busyTitle =
    activeAction === "repair"
      ? "Aplicando soluciones automáticas..."
      : "Ejecutando preflight...";
  const busyReason =
    activeAction === "repair"
      ? "Se están ejecutando comandos de diagnóstico y reparación del entorno."
      : "Se están validando dependencias, Docker, puertos y TLS antes de continuar.";

  const waitingMessage = latestLog
    ? `Motivo de espera actual: ${latestLog}`
    : "Motivo de espera actual: iniciando comprobaciones y esperando respuesta del sistema.";

  const handleRunClick = async (): Promise<void> => {
    setActiveAction("run");
    await onRun();
  };

  const handleAutoRepairClick = async (): Promise<void> => {
    setActiveAction("repair");
    await onAutoRepair();
  };

  return (
    <Box component="section">
      <Box sx={{ textAlign: "center", mb: 2.5 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Preflight
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.2 }}>
          Comprobaciones del sistema, Docker, puertos y dependencias TLS.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <WizardFooterNav
            onBack={onBack}
            onContinue={onContinue}
            backDisabled={busy}
            continueDisabled={!report || busy}
            continueLabel={
              blockersCount > 0 ? "Continuar con advertencias" : "Continuar"
            }
            continueTooltip={
              blockersCount > 0
                ? "Continuar con advertencias"
                : "Continuar al formulario"
            }
            centerContent={
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{
                  width: "100%",
                  minWidth: 0,
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="contained"
                  disabled={busy}
                  onClick={() => void handleRunClick()}
                  sx={{
                    height: 42,
                    flex: 1,
                    minWidth: { xs: "100%", sm: 0 },
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                    textAlign: "center",
                    lineHeight: 1.15,
                    textTransform: "none",
                    px: { xs: 1.1, sm: 1.8 },
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  }}
                >
                  {busy ? "Validando..." : "Ejecutar preflight"}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={busy || !report || !hasAutoRepairChecks}
                  onClick={() => void handleAutoRepairClick()}
                  sx={{
                    height: 42,
                    flex: 1,
                    minWidth: { xs: "100%", sm: 0 },
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                    textAlign: "center",
                    lineHeight: 1.15,
                    textTransform: "none",
                    px: { xs: 1.1, sm: 1.8 },
                    fontSize: { xs: "0.76rem", sm: "0.875rem" },
                  }}
                >
                  {busy ? "Aplicando fixes..." : "Solucionar automáticamente"}
                </Button>
              </Stack>
            }
          />
        </Box>
      </Box>

      {busy && (
        <Alert
          icon={<CircularProgress size={18} color="inherit" />}
          severity="info"
          sx={{ mb: 2, alignItems: "center" }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {busyTitle}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.35 }}>
            {busyReason}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 0.4 }}>
            {waitingMessage}
          </Typography>
        </Alert>
      )}

      {busy && activeAction === "repair" && (
        <Paper
          ref={logsContainerRef}
          onScroll={syncAutoScrollPreference}
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: "#f5f5f5",
            maxHeight: 300,
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "0.9rem",
            lineHeight: 1.6,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontWeight: "bold", color: "#333" }}
          >
            Registros en tiempo real:
          </Typography>
          {runtimeLogs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Preparando ejecución... en cuanto haya salida del proceso se
              mostrará aquí.
            </Typography>
          ) : (
            runtimeLogs.map((log, index) => (
              <Box
                key={index}
                sx={{
                  color:
                    log.line.includes("✓") || log.line.includes("OK")
                      ? "#4caf50"
                      : log.line.includes("⚠️") || log.line.includes("WARN")
                        ? "#ff9800"
                        : log.line.includes("❌") || log.line.includes("ERROR")
                          ? "#f44336"
                          : "#333",
                  mb: 0.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {log.line}
              </Box>
            ))
          )}
        </Paper>
      )}

      {report && blockersCount > 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Se detectaron {blockersCount} bloqueantes. Puedes continuar, pero la
          instalación puede fallar hasta resolverlos.
        </Alert>
      ) : null}

      {report ? (
        <Stack
          component="ul"
          spacing={1.5}
          sx={{ listStyle: "none", m: 0, p: 0 }}
        >
          {report.checks.map((check) => {
            const busyPort = check.metadata?.port;

            return (
              <Paper
                key={check.id}
                component="li"
                variant="outlined"
                sx={{ p: 2 }}
              >
                <Chip
                  label={check.status}
                  size="small"
                  color={statusToChipColor(check.status)}
                  sx={{ mb: 1 }}
                />
                <Typography variant="subtitle2">{check.label}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {check.detail}
                </Typography>
                {check.recommendation ? (
                  <Typography variant="caption" color="text.secondary">
                    {check.recommendation}
                  </Typography>
                ) : null}
                {check.repairable &&
                check.repairAction === "release-port" &&
                busyPort ? (
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={busy}
                    onClick={() => void onCloseBusyPort(busyPort)}
                  >
                    Cerrar proceso automáticamente
                  </Button>
                ) : null}
                {check.repairHint ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {check.repairHint}
                  </Typography>
                ) : null}
              </Paper>
            );
          })}
        </Stack>
      ) : null}
    </Box>
  );
}

function statusToChipColor(
  status: PreflightReport["checks"][number]["status"],
): ChipProps["color"] {
  if (status === "OK") {
    return "success";
  }
  if (status === "WARN") {
    return "warning";
  }
  return "error";
}
