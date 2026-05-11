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

/** True mientras el state machine del instalador no está en un estado terminal (defensa si `busy` se desincroniza). */
function isInstallerPipelineRunning(
  snapshot: InstallerStateSnapshot | null,
): boolean {
  if (!snapshot) {
    return false;
  }
  switch (snapshot.state) {
    case "IDLE":
    case "FAILED":
    case "DONE":
    case "DONE_WITH_WARNINGS":
      return false;
    default:
      return true;
  }
}

const sampleLogLines = [
  "[sin actividad] Pulsa 'Iniciar instalación' para ejecutar el flujo transaccional.",
  "[sin actividad] El instalador validará WSL2, Docker Desktop, generará .env.prod y verificará accesibilidad real al final.",
];

type InstallPhase = {
  state: InstallerStateSnapshot["state"];
  title: string;
  detail: string;
};

const installPhases: InstallPhase[] = [
  {
    state: "PREFLIGHT",
    title: "1. Comprobaciones del sistema",
    detail:
      "Se revisa espacio en disco, escritura, WSL2, Docker Desktop/Engine y puertos 80/443.",
  },
  {
    state: "CONFIG_VALIDATION",
    title: "2. Validación de configuración",
    detail:
      "Se validan instancias, rutas, puertos, backups, TLS y credenciales de despliegue.",
  },
  {
    state: "ENV_RENDER",
    title: "3. Generación de entorno",
    detail:
      "Se crea .env.prod con secretos, URLs, puertos y variables que usará Docker Compose.",
  },
  {
    state: "TLS_SETUP",
    title: "4. Certificados y TLS",
    detail:
      "Se generan o limpian certificados locales y se deja preparado el acceso HTTP/HTTPS.",
  },
  {
    state: "DOCKER_DEPLOY",
    title: "5. Despliegue de servicios",
    detail:
      "Se arranca WSL2 si hace falta, Docker Desktop, y el stack de base de datos, backend y frontend.",
  },
  {
    state: "INITIALIZE_APP",
    title: "6. Inicialización interna",
    detail:
      "El backend aplica migraciones, arranca bootstrap y prepara el estado operativo.",
  },
  {
    state: "VERIFY",
    title: "7. Verificación final",
    detail:
      "Se comprueba la salud de backend, frontend, DB y Redis, y la respuesta real del sitio.",
  },
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

function getPhaseIndex(state: InstallerStateSnapshot["state"] | null): number {
  if (!state) {
    return -1;
  }

  return installPhases.findIndex((phase) => phase.state === state);
}

interface DeployPageProps {
  config: InstallerConfigPayload;
  state: InstallerStateSnapshot | null;
  logs: RuntimeLogEvent[];
  busy: boolean;
  onBack: () => void;
  onDeploy: () => Promise<void>;
}

export function DeployPage({
  config,
  state,
  logs,
  busy,
  onBack,
  onDeploy,
}: DeployPageProps) {
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastLogCountRef = useRef(0);

  const syncAutoScrollPreference = (): void => {
    const container = logContainerRef.current;
    if (!container) {
      return;
    }

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceToBottom <= 24;
  };

  const visibleLogs = useMemo(() => {
    if (logs.length === 0) {
      return sampleLogLines;
    }

    return logs.map((log) => formatLogLine(log));
  }, [logs]);

  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) {
      return;
    }

    const hasNewLogs = visibleLogs.length > lastLogCountRef.current;
    lastLogCountRef.current = visibleLogs.length;

    if (hasNewLogs && shouldAutoScrollRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [visibleLogs]);

  const installerStatus = state
    ? `${state.state} · ${state.message}`
    : "Pendiente de iniciar flujo transaccional";

  const installerStateLabel = state ? state.state : "IDLE";
  const progressPercent = state?.progressPercent ?? 0;
  const progressLabel = state?.stageLabel ?? "Esperando inicio de instalación";
  const currentPhaseIndex = getPhaseIndex(state?.state ?? null);
  const currentPhase =
    currentPhaseIndex >= 0 ? installPhases[currentPhaseIndex] : null;
  const nextPhase =
    currentPhaseIndex >= 0 && currentPhaseIndex + 1 < installPhases.length
      ? installPhases[currentPhaseIndex + 1]
      : null;
  const completedPhases =
    currentPhaseIndex >= 0 ? installPhases.slice(0, currentPhaseIndex) : [];
  const pendingPhases =
    currentPhaseIndex >= 0
      ? installPhases.slice(currentPhaseIndex + 1)
      : installPhases;

  const deployInteractionLocked = busy || isInstallerPipelineRunning(state);

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
            {state?.state === "DONE" || state?.state === "DONE_WITH_WARNINGS"
              ? "Instalación validada; puedes continuar al panel de control"
              : "Instalando dependencias, configurando entorno y verificando salud del sistema"}
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Qué está haciendo ahora
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
          Esta vista muestra de forma explícita la fase actual, la siguiente y
          el orden completo de instalación para que el usuario sepa en todo
          momento qué ocurre.
        </Typography>

        <Stack spacing={1.25}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "rgba(148, 163, 184, 0.28)",
              backgroundColor: "rgba(15, 23, 42, 0.03)",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Fase actual
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentPhase
                ? `${currentPhase.title}: ${currentPhase.detail}`
                : "Pendiente de iniciar instalación."}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "rgba(148, 163, 184, 0.28)",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Siguiente paso
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {nextPhase
                  ? `${nextPhase.title}: ${nextPhase.detail}`
                  : state?.state === "DONE" ||
                      state?.state === "DONE_WITH_WARNINGS"
                    ? "No quedan pasos. La instalación ya terminó."
                    : "Aún no se ha iniciado el flujo."}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "rgba(148, 163, 184, 0.28)",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Fases ya completadas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completedPhases.length > 0
                  ? completedPhases.map((phase) => phase.title).join(" · ")
                  : "Ninguna por ahora."}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 0.75,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            {installPhases.map((phase) => {
              const phaseIndex = installPhases.findIndex(
                (item) => item.state === phase.state,
              );
              const phaseStateLabel =
                currentPhaseIndex === phaseIndex
                  ? "En curso"
                  : currentPhaseIndex > phaseIndex
                    ? "Completada"
                    : "Pendiente";

              return (
                <Box
                  key={phase.state}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor:
                      currentPhaseIndex === phaseIndex
                        ? "rgba(21, 128, 61, 0.5)"
                        : "rgba(148, 163, 184, 0.28)",
                    backgroundColor:
                      currentPhaseIndex === phaseIndex
                        ? "rgba(34, 197, 94, 0.08)"
                        : "transparent",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {phase.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={phaseStateLabel}
                      color={
                        currentPhaseIndex === phaseIndex
                          ? "success"
                          : currentPhaseIndex > phaseIndex
                            ? "default"
                            : "warning"
                      }
                      variant="outlined"
                    />
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {phase.detail}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {pendingPhases.length > 0 ? (
            <Typography variant="caption" color="text.secondary">
              Pendiente: {pendingPhases.map((phase) => phase.title).join(" · ")}
            </Typography>
          ) : null}
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
          onScroll={syncAutoScrollPreference}
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

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1.5,
          mt: 0.5,
        }}
      >
        <Button
          variant="outlined"
          disabled={deployInteractionLocked}
          onClick={onBack}
        >
          Atrás
        </Button>
        <Button
          variant="contained"
          disabled={deployInteractionLocked}
          onClick={() => void onDeploy()}
          sx={{ minWidth: 196, fontWeight: 700 }}
        >
          {deployInteractionLocked ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} color="inherit" />
              <span>Ejecutando...</span>
            </Stack>
          ) : (
            "Iniciar instalación"
          )}
        </Button>
      </Box>
    </Box>
  );
}
