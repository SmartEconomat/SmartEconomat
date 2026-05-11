import type { ReactElement } from "react";
import { Box, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DnsRoundedIcon from "@mui/icons-material/DnsRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

import type { ServiceHealth } from "@shared/contracts";

interface ServiceStatusCardProps {
  service: ServiceHealth;
}

export function ServiceStatusCard({ service }: ServiceStatusCardProps) {
  const presentation = getStatusPresentation(service.status);
  const metadata = getServiceMetadata(service.service);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        borderColor: presentation.borderColor,
        background: presentation.background,
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1.5}>
        <Stack direction="row" spacing={1.2} alignItems="flex-start">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: presentation.iconSurface,
              color: presentation.iconColor,
              flexShrink: 0,
            }}
          >
            {metadata.icon}
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, lineHeight: 1.2 }}
            >
              {metadata.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {metadata.caption}
            </Typography>
          </Box>
        </Stack>

        <Chip
          size="small"
          label={presentation.label}
          color={presentation.chipColor}
          variant={presentation.chipVariant}
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.6 }}>
        <Box
          sx={{
            color: presentation.iconColor,
            display: "grid",
            placeItems: "center",
          }}
        >
          {presentation.statusIcon}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {presentation.summary}
        </Typography>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1.1, lineHeight: 1.6 }}
      >
        {service.detail}
      </Typography>
    </Paper>
  );
}

function getServiceMetadata(serviceName: ServiceHealth["service"]): {
  label: string;
  caption: string;
  icon: ReactElement;
} {
  if (serviceName === "frontend") {
    return {
      label: "Frontend",
      caption: "Interfaz y proxy HTTPS local",
      icon: <LanguageRoundedIcon fontSize="small" />,
    };
  }

  if (serviceName === "db") {
    return {
      label: "Base de datos",
      caption: "Persistencia PostgreSQL",
      icon: <StorageRoundedIcon fontSize="small" />,
    };
  }

  if (serviceName === "redis") {
    return {
      label: "Redis",
      caption: "Cache y colas auxiliares",
      icon: <BoltRoundedIcon fontSize="small" />,
    };
  }

  return {
    label: "Backend",
    caption: "API, autenticación y dominio",
    icon: <DnsRoundedIcon fontSize="small" />,
  };
}

function getStatusPresentation(status: ServiceHealth["status"]): {
  label: string;
  summary: string;
  chipColor: "success" | "warning" | "error" | "default";
  chipVariant: "filled" | "outlined";
  statusIcon: ReactElement;
  borderColor: string;
  background: string;
  iconSurface: string;
  iconColor: string;
} {
  if (status === "healthy") {
    return {
      label: "Healthy",
      summary: "Servicio verificado y operativo.",
      chipColor: "success",
      chipVariant: "filled",
      statusIcon: <CheckCircleRoundedIcon fontSize="small" />,
      borderColor: "rgba(34, 197, 94, 0.32)",
      background:
        "linear-gradient(180deg, rgba(240, 253, 244, 1) 0%, rgba(255, 255, 255, 1) 100%)",
      iconSurface: "rgba(34, 197, 94, 0.12)",
      iconColor: "#15803d",
    };
  }

  if (status === "running") {
    return {
      label: "Running",
      summary: "Servicio activo y atendiendo operaciones.",
      chipColor: "success",
      chipVariant: "outlined",
      statusIcon: <CheckCircleRoundedIcon fontSize="small" />,
      borderColor: "rgba(14, 165, 233, 0.28)",
      background:
        "linear-gradient(180deg, rgba(239, 249, 255, 1) 0%, rgba(255, 255, 255, 1) 100%)",
      iconSurface: "rgba(14, 165, 233, 0.12)",
      iconColor: "#0369a1",
    };
  }

  if (status === "starting") {
    return {
      label: "Warning",
      summary: "Servicio arrancando o esperando healthcheck.",
      chipColor: "warning",
      chipVariant: "filled",
      statusIcon: <AutorenewRoundedIcon fontSize="small" />,
      borderColor: "rgba(245, 158, 11, 0.30)",
      background:
        "linear-gradient(180deg, rgba(255, 251, 235, 1) 0%, rgba(255, 255, 255, 1) 100%)",
      iconSurface: "rgba(245, 158, 11, 0.14)",
      iconColor: "#b45309",
    };
  }

  if (status === "unhealthy") {
    return {
      label: "Error",
      summary: "Servicio con incidencia detectada.",
      chipColor: "error",
      chipVariant: "filled",
      statusIcon: <ErrorRoundedIcon fontSize="small" />,
      borderColor: "rgba(239, 68, 68, 0.30)",
      background:
        "linear-gradient(180deg, rgba(254, 242, 242, 1) 0%, rgba(255, 255, 255, 1) 100%)",
      iconSurface: "rgba(239, 68, 68, 0.12)",
      iconColor: "#b91c1c",
    };
  }

  return {
    label: "Warning",
    summary: "Estado pendiente de comprobación.",
    chipColor: "default",
    chipVariant: "outlined",
    statusIcon: <InfoOutlinedIcon fontSize="small" />,
    borderColor: "rgba(148, 163, 184, 0.32)",
    background:
      "linear-gradient(180deg, rgba(248, 250, 252, 1) 0%, rgba(255, 255, 255, 1) 100%)",
    iconSurface: "rgba(148, 163, 184, 0.14)",
    iconColor: "#475569",
  };
}

export function ServiceStatusCardSkeleton() {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        borderColor: "rgba(148, 163, 184, 0.24)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1.5}>
        <Stack direction="row" spacing={1.2} alignItems="flex-start">
          <Skeleton variant="rounded" width={42} height={42} />
          <Box>
            <Skeleton width={100} height={22} />
            <Skeleton width={160} height={16} />
          </Box>
        </Stack>
        <Skeleton variant="rounded" width={64} height={24} />
      </Stack>
      <Skeleton width="80%" height={20} sx={{ mt: 1.6 }} />
      <Skeleton width="100%" height={40} sx={{ mt: 1.1 }} />
    </Paper>
  );
}
