import { useEffect, useRef } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";

import type { RuntimeLogEvent } from "@shared/contracts";

interface LogsViewerProps {
  logs: RuntimeLogEvent[];
  busy: boolean;
  onClearLogs: () => void;
  onExportLogs: () => Promise<void>;
}

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function serviceAccent(service: string): string {
  if (service === "backend") {
    return "#38bdf8";
  }
  if (service === "frontend") {
    return "#f472b6";
  }
  if (service === "db") {
    return "#34d399";
  }
  if (service === "redis") {
    return "#f97316";
  }
  if (service === "docker") {
    return "#22d3ee";
  }
  return "#fbbf24";
}

export function LogsViewer({
  logs,
  busy,
  onClearLogs,
  onExportLogs,
}: LogsViewerProps) {
  const streamRef = useRef<HTMLDivElement | null>(null);
  const hasLogs = logs.length > 0;

  useEffect(() => {
    if (!streamRef.current) {
      return;
    }

    streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [logs]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.25,
        borderRadius: 3,
        borderColor: "rgba(148, 163, 184, 0.28)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 1.25 }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(229, 0, 70, 0.10)",
              color: "#c2185b",
            }}
          >
            <TerminalRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 800 }}>
              Logs de la Aplicación
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Consola operativa con el buffer visible del panel, lista para
              limpieza y exportación segura.
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Chip
            size="small"
            label={hasLogs ? `${logs.length} eventos` : "Sin actividad"}
            color={hasLogs ? "success" : "default"}
            variant={hasLogs ? "filled" : "outlined"}
          />
          <Tooltip
            title="Vacía solo la consola visible de este panel; no borra logs internos ni archivos persistidos."
            arrow
          >
            <span>
              <Button
                size="small"
                variant="outlined"
                disabled={!hasLogs || busy}
                startIcon={<DeleteSweepRoundedIcon fontSize="small" />}
                onClick={onClearLogs}
              >
                Limpiar Logs
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            title="Exporta únicamente las líneas visibles del panel a un archivo de texto plano."
            arrow
          >
            <span>
              <Button
                size="small"
                variant="contained"
                disabled={!hasLogs || busy}
                startIcon={<DownloadRoundedIcon fontSize="small" />}
                onClick={() => void onExportLogs()}
                sx={{ fontWeight: 700 }}
              >
                Exportar Logs
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        ref={streamRef}
        sx={{
          height: 380,
          overflow: "auto",
          background:
            "linear-gradient(180deg, rgba(10, 15, 28, 1) 0%, rgba(17, 24, 39, 1) 100%)",
          color: "#e5e7eb",
          borderRadius: 2.5,
          p: 1.5,
          border: "1px solid rgba(148, 163, 184, 0.16)",
          fontFamily:
            '"JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, monospace',
          fontSize: "0.82rem",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          display: "grid",
        }}
      >
        {hasLogs ? (
          logs.map((log, index) => (
            <Box
              key={`${log.timestamp}-${index}`}
              component="p"
              sx={{
                m: 0,
                py: 0.55,
                display: "grid",
                gridTemplateColumns: "auto auto minmax(0, 1fr)",
                gap: 1,
                alignItems: "start",
                borderBottom:
                  index === logs.length - 1
                    ? "none"
                    : "1px solid rgba(148, 163, 184, 0.08)",
              }}
            >
              <Typography
                component="span"
                sx={{ color: "#94a3b8", fontSize: "inherit" }}
              >
                [{formatTimestamp(log.timestamp)}]
              </Typography>
              <Box
                component="span"
                sx={{
                  color: serviceAccent(log.service),
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                [{log.service}]
              </Box>
              <Typography
                component="span"
                sx={{
                  m: 0,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "#e2e8f0",
                  fontSize: "inherit",
                }}
              >
                {log.line}
              </Typography>
            </Box>
          ))
        ) : (
          <Stack
            spacing={1.2}
            alignItems="center"
            justifyContent="center"
            sx={{
              height: "100%",
              px: 3,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(59, 130, 246, 0.12)",
                color: "#93c5fd",
              }}
            >
              <TerminalRoundedIcon />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              La consola está lista para recibir eventos.
            </Typography>
            <Typography
              variant="body2"
              sx={{ maxWidth: 420, color: "#cbd5e1" }}
            >
              Inicia un stream de Backend o Frontend desde Gestión de Servicios
              y verás aquí cada línea con su timestamp y origen.
            </Typography>
          </Stack>
        )}
      </Box>

      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        sx={{ mt: 1.2 }}
      >
        <InfoOutlinedIcon
          sx={{ color: "text.secondary", fontSize: 18, mt: 0.1 }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", lineHeight: 1.6 }}
        >
          {hasLogs
            ? "Solo se exporta el buffer visible de esta consola. Si el stream sigue activo, las nuevas líneas aparecerán después de limpiar el panel."
            : "Cuando no hay actividad, el panel muestra un estado vacío amistoso en lugar de líneas de ejemplo para evitar confusiones."}
        </Typography>
      </Stack>
    </Paper>
  );
}
