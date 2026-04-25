import type { ReactElement, ReactNode } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import PlayCircleFilledWhiteRoundedIcon from "@mui/icons-material/PlayCircleFilledWhiteRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import type {
  ServiceHealth,
  SupervisorSnapshot,
  WatchdogStatus,
} from "@shared/contracts";
import { ServiceStatusCard } from "@renderer/components/ServiceStatusCard";

interface ControlPanelPageProps {
  busy: boolean;
  health: ServiceHealth[];
  watchdogStatus: WatchdogStatus | null;
  supervisorSnapshot: SupervisorSnapshot | null;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onRestart: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onRestartDockerDesktop: () => Promise<void>;
  onRunSupervisorRecovery: () => Promise<void>;
  onStartLogs: (
    service: "frontend" | "backend" | "db" | "redis",
  ) => Promise<void>;
  onStopLogs: () => Promise<void>;
  onDiagnostics: () => Promise<void>;
  onOpenDanger: () => void;
  onOpenUninstall: () => void;
  children: ReactNode;
}

interface ActionPalette {
  buttonBg: string;
  buttonHover: string;
  buttonText: string;
  surface: string;
  border: string;
  iconSurface: string;
  iconColor: string;
}

type ActionPaletteName =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "destructive";

interface ActionCardProps {
  title: string;
  description: string;
  palette: ActionPalette;
  icon: ReactElement;
  disabled: boolean;
  onClick: () => void;
}

interface ActionDefinition {
  title: string;
  description: string;
  palette: ActionPalette;
  icon: ReactElement;
  onClick: () => void;
}

const actionPalettes: Record<ActionPaletteName, ActionPalette> = {
  success: {
    buttonBg: "#188754",
    buttonHover: "#126740",
    buttonText: "#ffffff",
    surface: "rgba(24, 135, 84, 0.05)",
    border: "rgba(24, 135, 84, 0.18)",
    iconSurface: "rgba(24, 135, 84, 0.12)",
    iconColor: "#188754",
  },
  danger: {
    buttonBg: "#d83a52",
    buttonHover: "#b52c42",
    buttonText: "#ffffff",
    surface: "rgba(216, 58, 82, 0.05)",
    border: "rgba(216, 58, 82, 0.18)",
    iconSurface: "rgba(216, 58, 82, 0.12)",
    iconColor: "#c62828",
  },
  warning: {
    buttonBg: "#ef8f1a",
    buttonHover: "#d97706",
    buttonText: "#ffffff",
    surface: "rgba(239, 143, 26, 0.05)",
    border: "rgba(239, 143, 26, 0.18)",
    iconSurface: "rgba(239, 143, 26, 0.12)",
    iconColor: "#b45309",
  },
  info: {
    buttonBg: "#246bce",
    buttonHover: "#1d56a6",
    buttonText: "#ffffff",
    surface: "rgba(36, 107, 206, 0.05)",
    border: "rgba(36, 107, 206, 0.18)",
    iconSurface: "rgba(36, 107, 206, 0.12)",
    iconColor: "#1d4ed8",
  },
  neutral: {
    buttonBg: "#475569",
    buttonHover: "#334155",
    buttonText: "#ffffff",
    surface: "rgba(71, 85, 105, 0.05)",
    border: "rgba(71, 85, 105, 0.18)",
    iconSurface: "rgba(71, 85, 105, 0.12)",
    iconColor: "#334155",
  },
  destructive: {
    buttonBg: "#7f1d1d",
    buttonHover: "#5f1515",
    buttonText: "#ffffff",
    surface: "rgba(127, 29, 29, 0.06)",
    border: "rgba(127, 29, 29, 0.20)",
    iconSurface: "rgba(127, 29, 29, 0.12)",
    iconColor: "#7f1d1d",
  },
};

function buildMonitoredServices(health: ServiceHealth[]): ServiceHealth[] {
  const orderedServices: ServiceHealth["service"][] = [
    "backend",
    "frontend",
    "db",
    "redis",
  ];

  return orderedServices.map((serviceName) => {
    const matched = health.find((service) => service.service === serviceName);
    if (matched) {
      return matched;
    }

    const placeholderDetails: Record<ServiceHealth["service"], string> = {
      backend:
        "Ejecuta Verificar Salud para consultar el estado de la API y la capa de negocio.",
      frontend:
        "Ejecuta Verificar Salud para consultar el estado de la interfaz y el proxy HTTPS local.",
      db: "Ejecuta Verificar Salud para consultar el estado de PostgreSQL y la persistencia.",
      redis:
        "Ejecuta Verificar Salud para consultar el estado de Redis y las colas auxiliares.",
    };

    return {
      service: serviceName,
      status: "unknown",
      detail: placeholderDetails[serviceName],
    } as ServiceHealth;
  });
}

function resolveOverallState(services: ServiceHealth[]): {
  label: "Healthy" | "Warning" | "Error";
  color: "success" | "warning" | "error";
  text: string;
} {
  if (services.some((service) => service.status === "unhealthy")) {
    return {
      label: "Error",
      color: "error",
      text: "Hay al menos un servicio con incidencia y requiere atención inmediata.",
    };
  }

  if (
    services.every(
      (service) => service.status === "healthy" || service.status === "running",
    )
  ) {
    return {
      label: "Healthy",
      color: "success",
      text: "Backend, Frontend, Base de datos y Redis están operativos y preparados para atender tráfico.",
    };
  }

  return {
    label: "Warning",
    color: "warning",
    text: "El stack está arrancando o pendiente de verificación completa.",
  };
}

function ActionCard({
  title,
  description,
  palette,
  icon,
  disabled,
  onClick,
}: ActionCardProps) {
  return (
    <Tooltip title={description} arrow placement="top">
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2.75,
          borderColor: palette.border,
          bgcolor: palette.surface,
          minHeight: 154,
          display: "grid",
          alignContent: "space-between",
          gap: 1.25,
        }}
      >
        <Stack spacing={1.1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: palette.iconSurface,
                color: palette.iconColor,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, lineHeight: 1.2 }}
            >
              {title}
            </Typography>
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.55 }}
          >
            {description}
          </Typography>
        </Stack>

        <Button
          fullWidth
          variant="contained"
          disableElevation
          disabled={disabled}
          onClick={onClick}
          startIcon={icon}
          sx={{
            bgcolor: palette.buttonBg,
            color: palette.buttonText,
            fontWeight: 800,
            borderRadius: 2,
            py: 1,
            textTransform: "none",
            boxShadow: "0 10px 20px rgba(15, 23, 42, 0.10)",
            "&:hover": {
              bgcolor: palette.buttonHover,
            },
          }}
        >
          {title}
        </Button>
      </Paper>
    </Tooltip>
  );
}

export function ControlPanelPage({
  busy,
  health,
  watchdogStatus,
  supervisorSnapshot,
  onStart,
  onStop,
  onRestart,
  onRefresh,
  onRestartDockerDesktop,
  onRunSupervisorRecovery,
  onStartLogs,
  onStopLogs,
  onDiagnostics,
  onOpenDanger,
  onOpenUninstall,
  children,
}: ControlPanelPageProps) {
  const monitoredServices = buildMonitoredServices(health);
  const overallState = resolveOverallState(monitoredServices);

  const primaryActions: ActionDefinition[] = [
    {
      title: "Iniciar Stack",
      description: "Levanta todos los contenedores Docker de SmartEconomat.",
      palette: actionPalettes.success,
      icon: <PlayCircleFilledWhiteRoundedIcon fontSize="small" />,
      onClick: () => void onStart(),
    },
    {
      title: "Detener Stack",
      description: "Detiene todos los contenedores de la instalación activa.",
      palette: actionPalettes.danger,
      icon: <StopCircleRoundedIcon fontSize="small" />,
      onClick: () => void onStop(),
    },
    {
      title: "Reiniciar Stack",
      description:
        "Reinicia los servicios para aplicar cambios o recuperar el stack.",
      palette: actionPalettes.warning,
      icon: <RestartAltRoundedIcon fontSize="small" />,
      onClick: () => void onRestart(),
    },
    {
      title: "Verificar Salud",
      description: "Ejecuta healthcheck en todos los servicios monitorizados.",
      palette: actionPalettes.info,
      icon: <HealthAndSafetyRoundedIcon fontSize="small" />,
      onClick: () => void onRefresh(),
    },
    {
      title: "Logs Backend",
      description:
        "Abre el stream de logs de la API, auth y procesos del backend.",
      palette: actionPalettes.neutral,
      icon: <TerminalRoundedIcon fontSize="small" />,
      onClick: () => void onStartLogs("backend"),
    },
    {
      title: "Logs Frontend",
      description:
        "Abre el stream de logs del frontend y del proxy HTTPS local.",
      palette: actionPalettes.neutral,
      icon: <TerminalRoundedIcon fontSize="small" />,
      onClick: () => void onStartLogs("frontend"),
    },
    {
      title: "Logs DB",
      description: "Abre el stream de logs de PostgreSQL en el contenedor db.",
      palette: actionPalettes.neutral,
      icon: <TerminalRoundedIcon fontSize="small" />,
      onClick: () => void onStartLogs("db"),
    },
    {
      title: "Logs Redis",
      description: "Abre el stream de logs del contenedor Redis.",
      palette: actionPalettes.neutral,
      icon: <TerminalRoundedIcon fontSize="small" />,
      onClick: () => void onStartLogs("redis"),
    },
  ];

  const advancedActions: ActionDefinition[] = [
    {
      title: "Reparar ahora",
      description:
        "Ejecuta de inmediato la recuperación automática del supervisor.",
      palette: actionPalettes.warning,
      icon: <RestartAltRoundedIcon fontSize="small" />,
      onClick: () => void onRunSupervisorRecovery(),
    },
    {
      title: "Reiniciar Docker",
      description: "Reinicia Docker Desktop y vuelve a verificar el stack.",
      palette: actionPalettes.info,
      icon: <RestartAltRoundedIcon fontSize="small" />,
      onClick: () => void onRestartDockerDesktop(),
    },
    {
      title: "Detener Logs",
      description: "Cierra cualquier stream activo de logs en tiempo real.",
      palette: actionPalettes.neutral,
      icon: <StopCircleRoundedIcon fontSize="small" />,
      onClick: () => void onStopLogs(),
    },
    {
      title: "Generar Diagnóstico Completo",
      description:
        "Recopila logs, estado de contenedores e información del sistema para diagnóstico.",
      palette: actionPalettes.info,
      icon: <FactCheckRoundedIcon fontSize="small" />,
      onClick: () => void onDiagnostics(),
    },
    {
      title: "Limpieza Agresiva",
      description:
        "Elimina volúmenes, imágenes no usadas y contenedores detenidos tras confirmación.",
      palette: actionPalettes.destructive,
      icon: <DeleteSweepRoundedIcon fontSize="small" />,
      onClick: onOpenDanger,
    },
    {
      title: "Desinstalar SmartEconomat",
      description:
        "Elimina completamente la instalación: contenedores, volúmenes, certificados, registro y atajos.",
      palette: actionPalettes.destructive,
      icon: <DeleteForeverRoundedIcon fontSize="small" />,
      onClick: onOpenUninstall,
    },
  ];

  return (
    <Box component="section" sx={{ display: "grid", gap: 2 }}>
      <Stack spacing={0.85}>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.03em",
            fontFamily: '"Manrope", "Segoe UI", sans-serif',
          }}
        >
          Panel de Control
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ maxWidth: 860, lineHeight: 1.65 }}
        >
          Gestiona el ciclo de vida del stack local, supervisa todos los
          contenedores levantados y lanza operaciones de soporte con acciones
          claras, seguras y auditables.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" },
        }}
      >
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 3, borderColor: "rgba(229, 0, 70, 0.18)" }}
        >
          <Typography
            variant="overline"
            sx={{ color: "#c2185b", fontWeight: 800, letterSpacing: 1.3 }}
          >
            Monitorización principal
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            Servicios monitorizados: {monitoredServices.length} (Stack completo)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            La vista principal resume el estado operativo de todos los
            contenedores del stack: backend, frontend, base de datos, Redis y
            cualquier servicio que el healthcheck exponga.
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
            borderColor: "rgba(148, 163, 184, 0.24)",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={1}
            alignItems="center"
          >
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: 1.1 }}
              >
                Estado general
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {overallState.text}
              </Typography>
            </Box>
            <Chip
              label={overallState.label}
              color={overallState.color}
              sx={{ fontWeight: 800 }}
            />
          </Stack>
        </Paper>
      </Box>

      {watchdogStatus && (
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 3,
            borderColor:
              watchdogStatus.state === "active"
                ? "rgba(24, 135, 84, 0.25)"
                : watchdogStatus.state === "recovering"
                  ? "rgba(239, 143, 26, 0.25)"
                  : watchdogStatus.state === "backoff"
                    ? "rgba(216, 58, 82, 0.25)"
                    : "rgba(148, 163, 184, 0.24)",
            bgcolor:
              watchdogStatus.state === "active"
                ? "rgba(24, 135, 84, 0.04)"
                : watchdogStatus.state === "recovering"
                  ? "rgba(239, 143, 26, 0.04)"
                  : watchdogStatus.state === "backoff"
                    ? "rgba(216, 58, 82, 0.04)"
                    : "transparent",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <HealthAndSafetyRoundedIcon
                fontSize="small"
                sx={{
                  color:
                    watchdogStatus.state === "active"
                      ? "#188754"
                      : watchdogStatus.state === "recovering"
                        ? "#ef8f1a"
                        : watchdogStatus.state === "backoff"
                          ? "#d83a52"
                          : "#475569",
                }}
              />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Boot Guardian
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {watchdogStatus.state === "active" &&
                    "Vigilancia activa — todos los servicios bajo monitorización."}
                  {watchdogStatus.state === "recovering" &&
                    `Recuperación en curso — nivel ${watchdogStatus.currentRecoveryLevel}/3, ${watchdogStatus.consecutiveFailures} fallo(s).`}
                  {watchdogStatus.state === "backoff" &&
                    `Backoff activo — esperando ${Math.round(watchdogStatus.nextCheckInMs / 1000)}s antes del próximo intento.`}
                  {watchdogStatus.state === "idle" &&
                    "Guardian inactivo — no se está monitorizando el stack."}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={
                  watchdogStatus.state === "active"
                    ? "Activo"
                    : watchdogStatus.state === "recovering"
                      ? "Recuperando"
                      : watchdogStatus.state === "backoff"
                        ? "Backoff"
                        : "Inactivo"
                }
                size="small"
                color={
                  watchdogStatus.state === "active"
                    ? "success"
                    : watchdogStatus.state === "recovering"
                      ? "warning"
                      : watchdogStatus.state === "backoff"
                        ? "error"
                        : "default"
                }
                sx={{ fontWeight: 800 }}
              />
              {watchdogStatus.currentRecoveryLevel > 1 && (
                <Chip
                  label={`Nivel ${watchdogStatus.currentRecoveryLevel}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Stack>
          </Stack>
        </Paper>
      )}

      {supervisorSnapshot && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
            borderColor: "rgba(148, 163, 184, 0.24)",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Supervisor autónomo
            </Typography>
            <Chip
              size="small"
              color={
                supervisorSnapshot.overallState === "healthy"
                  ? "success"
                  : supervisorSnapshot.overallState === "recovering"
                    ? "warning"
                    : "error"
              }
              label={
                supervisorSnapshot.overallState === "healthy"
                  ? "Todo correcto"
                  : supervisorSnapshot.overallState === "recovering"
                    ? "Recuperando"
                    : "Error crítico"
              }
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Uptime: {Math.floor(supervisorSnapshot.uptimeSeconds / 60)} min ·
            Última reparación automática:{" "}
            {supervisorSnapshot.lastAutomaticAction ?? "Sin acciones aún"}
          </Typography>
        </Paper>
      )}

      <Paper
        variant="outlined"
        sx={{
          p: 2.25,
          borderRadius: 3,
          borderColor: "rgba(148, 163, 184, 0.24)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,250,252,1) 100%)",
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: "#c2185b", fontWeight: 800, letterSpacing: 1.2 }}
        >
          Operaciones
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.4 }}>
          Gestión de Servicios
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.8 }}>
          Dos filas de acciones separadas entre operaciones principales del
          stack y herramientas avanzadas de soporte.
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.1 }}>
          Acciones principales del stack
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(6, minmax(0, 1fr))",
            },
          }}
        >
          {primaryActions.map((action) => (
            <ActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              palette={action.palette}
              icon={action.icon}
              disabled={busy}
              onClick={action.onClick}
            />
          ))}
        </Box>

        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 800, mt: 2.1, mb: 1.1 }}
        >
          Acciones avanzadas
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          {advancedActions.map((action) => (
            <ActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              palette={action.palette}
              icon={action.icon}
              disabled={busy}
              onClick={action.onClick}
            />
          ))}
        </Box>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 2.25,
          borderRadius: 3,
          borderColor: "rgba(148, 163, 184, 0.24)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Estado de Servicios
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vista clara del estado operativo actual, sin mensajes ambiguos ni
              etiquetas confusas.
            </Typography>
          </Box>
          <Chip
            label={overallState.label}
            color={overallState.color}
            variant="outlined"
            sx={{ fontWeight: 800 }}
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          {monitoredServices.map((service) => (
            <ServiceStatusCard key={service.service} service={service} />
          ))}
        </Box>
      </Paper>

      {children}

      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 3,
          borderColor: "rgba(229, 0, 70, 0.18)",
          bgcolor: "rgba(229, 0, 70, 0.04)",
        }}
      >
        <Stack direction="row" spacing={1.1} alignItems="flex-start">
          <Box sx={{ color: "#c2185b", mt: 0.1 }}>
            <InfoOutlinedIcon fontSize="small" />
          </Box>
          <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
            Este panel de control puede minimizarse al System Tray (icono en la
            barra de tareas) para gestionar la aplicación en segundo plano.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
