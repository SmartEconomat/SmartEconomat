import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  type ChipProps,
} from "@mui/material";
import { useEffect, useRef } from "react";

import type { PreflightReport, RuntimeLogEvent } from "@shared/contracts";

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

  return (
    <Box component="section">
      <Box sx={{ textAlign: "center", mb: 2.5 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Preflight
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.2 }}>
          Comprobaciones del sistema, Docker, puertos y dependencias TLS.
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            mb: 2,
          }}
        >
          <Button variant="outlined" onClick={onBack}>
            Atrás
          </Button>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              disabled={busy}
              onClick={() => void onRun()}
            >
              {busy ? "Validando..." : "Ejecutar preflight"}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              disabled={busy || !report || blockersCount === 0}
              onClick={() => void onAutoRepair()}
            >
              {busy
                ? "Aplicando fixes..."
                : "Intentar solucionar automáticamente"}
            </Button>
            <Button
              variant="contained"
              color={blockersCount > 0 ? "warning" : "primary"}
              disabled={!report}
              onClick={onContinue}
              title={
                blockersCount > 0
                  ? "Continuar con advertencias"
                  : "Continuar al formulario"
              }
            >
              {blockersCount > 0 ? "Continuar con advertencias" : "Continuar"}
            </Button>
          </Stack>
        </Box>
      </Box>

      {busy && runtimeLogs.length > 0 && (
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
          {runtimeLogs.map((log, index) => (
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
          ))}
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
