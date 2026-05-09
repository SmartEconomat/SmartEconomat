import { useEffect, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import type {
  InstallerConfigPayload,
  RuntimeLogEvent,
  InstallerStateSnapshot,
} from "@shared/contracts";

const sampleLogLines = [
  "[2026-04-13 10:45:12] Iniciando despliegue Docker...",
  "[2026-04-13 10:45:13] Construyendo imagen smarteconomat-app:latest...",
  "[2026-04-13 10:45:28] Imagen construida correctamente.",
  "[2026-04-13 10:45:30] Levantando stack Docker Compose...",
  "[2026-04-13 10:45:45] Servicio postgres iniciado correctamente.",
  "[2026-04-13 10:45:52] Servicio backend iniciado correctamente.",
  "[2026-04-13 10:46:01] Servicio frontend iniciado correctamente.",
  "[2026-04-13 10:46:03] Aplicación SmartEconomat desplegada y accesible en https://smarteconomat.app",
];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatTimestamp(timestamp: string): string {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
}

function formatLogLine(log: RuntimeLogEvent): string {
  return `[${formatTimestamp(log.timestamp)}] ${log.line}`;
}

interface DeployPageProps {
  config: InstallerConfigPayload;
  state: InstallerStateSnapshot | null;
  logs: RuntimeLogEvent[];
  busy: boolean;
  onBack: () => void;
  onDeploy: () => Promise<void>;
}

/**
 * Expone la operación "DeployPage" del instalador SmartEconomat.
 * @returns {DeployPageProps} {
 *   config,
 *   state,
 *   logs,
 *   busy,
 *   onBack,
 *   onDeploy,
 * } - Entrada esperada por la función.
 * @returns {import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/jsx-runtime").JSX.Element} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function DeployPage({
  config,
  state,
  logs,
  busy,
  onBack,
  onDeploy,
}: DeployPageProps) {
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const visibleLogs = useMemo(() => {
    if (logs.length === 0) {
      return sampleLogLines;
    }

    return logs.map((log) => formatLogLine(log));
  }, [logs]);

  useEffect(() => {
    if (!logContainerRef.current) {
      return;
    }

    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [visibleLogs]);

  const installerStatus = state
    ? `${state.state} · ${state.message}`
    : "Pendiente de iniciar flujo transaccional";

  const installerStateLabel = state ? state.state : "IDLE";
  const progressPercent = state?.progressPercent ?? 0;
  const progressLabel = state?.stageLabel ?? "Esperando inicio de instalación";

  return (
    <Box component="section" sx={{ display: "grid", gap: 2 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Runtime path: <strong>{config.runtimePath}</strong>
          </Typography>
          <Chip
            label={installerStateLabel}
            size="small"
            color={state?.state === "FAILED" ? "error" : "primary"}
            variant="outlined"
          />
        </Stack>

        <Typography variant="body2" sx={{ mt: 1 }}>
          Ruta de ejecución: {config.runtimePath}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Durante el despliegue se ejecutarán scripts de Docker Compose. Esta
          vista muestra el log completo en tiempo real.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
          Estado actual: {installerStatus}
        </Typography>

        <Stack spacing={0.8} sx={{ mt: 1.5 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {progressLabel}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {progressPercent}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            color={state?.state === "FAILED" ? "error" : "primary"}
            sx={{ height: 9, borderRadius: 999 }}
          />
          <Typography variant="caption" color="text.secondary">
            {state?.state === "DONE"
              ? "Finalizando instalación y validando servicios"
              : "Instalando dependencias, configurando entorno y verificando salud del sistema"}
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Log de despliegue
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
          Salida detallada de la instalación con timestamps para diagnóstico.
        </Typography>

        <Box
          ref={logContainerRef}
          sx={{
            height: { xs: 140, md: 150 },
            overflowY: "auto",
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "rgba(148, 163, 184, 0.28)",
            backgroundColor: "#10151f",
            color: "#e2e8f0",
            p: 1.5,
            fontFamily:
              "'JetBrains Mono', 'Consolas', 'Menlo', 'Monaco', monospace",
            fontSize: "0.78rem",
            lineHeight: 1.7,
          }}
        >
          {visibleLogs.map((line, index) => (
            <Typography
              key={`${line}-${index}`}
              component="p"
              sx={{
                m: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: index % 2 === 0 ? "#dbe4f3" : "#c5d0e4",
              }}
            >
              {line}
            </Typography>
          ))}
        </Box>
      </Paper>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 0.5 }}
      >
        <Button variant="outlined" disabled={busy} onClick={onBack}>
          VOLVER
        </Button>
        <Button
          variant="contained"
          disabled={busy}
          onClick={() => void onDeploy()}
          sx={{ minWidth: 196, fontWeight: 700 }}
        >
          {busy ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} color="inherit" />
              <span>Ejecutando...</span>
            </Stack>
          ) : (
            "Iniciar instalación"
          )}
        </Button>
      </Stack>
    </Box>
  );
}
