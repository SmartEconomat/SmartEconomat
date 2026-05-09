import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import type { DebugLogEntry } from "@shared/contracts";

const MAX_RENDERED_LOGS = 1200;

function formatTimestamp(value: number): string {
  if (!Number.isFinite(value)) {
    return "--:--:--.---";
  }

  const date = new Date(value);
  const base = date.toLocaleTimeString("es-ES", {
    hour12: false,
  });
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  return `${base}.${milliseconds}`;
}

function stringifyContext(context: unknown): string {
  if (context === undefined) {
    return "";
  }

  if (typeof context === "string") {
    return context;
  }

  try {
    return JSON.stringify(context, null, 2);
  } catch {
    return String(context);
  }
}

function getTypeStyles(type: DebugLogEntry["type"]): {
  border: string;
  background: string;
  chipColor: "default" | "warning" | "error" | "info";
} {
  switch (type) {
    case "error":
      return {
        border: "#b91c1c",
        background: "rgba(239, 68, 68, 0.12)",
        chipColor: "error",
      };
    case "warn":
      return {
        border: "#ca8a04",
        background: "rgba(250, 204, 21, 0.14)",
        chipColor: "warning",
      };
    case "ipc":
      return {
        border: "#0c4a6e",
        background: "rgba(14, 116, 144, 0.12)",
        chipColor: "info",
      };
    case "system":
      return {
        border: "#1d4ed8",
        background: "rgba(59, 130, 246, 0.1)",
        chipColor: "info",
      };
    case "log":
    default:
      return {
        border: "#4b5563",
        background: "rgba(107, 114, 128, 0.12)",
        chipColor: "default",
      };
  }
}

/**
 * Expone la operación "DebugConsoleApp" del instalador SmartEconomat.
 * @returns {import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/jsx-runtime").JSX.Element} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function DebugConsoleApp() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bridge = window.smartEconomat;
    if (!bridge) {
      setError("Bridge de Electron no disponible para la consola de debug.");
      return;
    }

    let stop: (() => void) | null = null;

    void bridge.getDebugLogs().then((result) => {
      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (result.data) {
        setLogs(result.data.slice(-MAX_RENDERED_LOGS));
      }
    });

    stop = bridge.onDebugLog((entry) => {
      setLogs((previous) => [
        ...previous.slice(-(MAX_RENDERED_LOGS - 1)),
        entry,
      ]);
    });

    return () => {
      stop?.();
    };
  }, []);

  useEffect(() => {
    const container = streamContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [logs]);

  const counters = useMemo(() => {
    return logs.reduce(
      (acc, current) => {
        acc.total += 1;
        if (current.type === "error") {
          acc.errors += 1;
        }
        if (current.type === "warn") {
          acc.warnings += 1;
        }
        return acc;
      },
      {
        total: 0,
        errors: 0,
        warnings: 0,
      },
    );
  }, [logs]);

  async function clearLogs(): Promise<void> {
    const bridge = window.smartEconomat;
    if (!bridge) {
      return;
    }

    const result = await bridge.clearDebugLogs();
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    setStatus("Log buffer limpiado");
    setLogs([]);
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        height: "100vh",
        p: 0,
        m: 0,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "stretch",
        background:
          "radial-gradient(circle at top left, rgba(2,132,199,0.22), rgba(15,23,42,0.92))",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          height: "100%",
          borderRadius: 0,
          overflow: "hidden",
          border: 0,
          backgroundColor: "rgba(15, 23, 42, 0.94)",
          display: "grid",
          gridTemplateRows: "auto minmax(0, 1fr)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{
            p: 2,
            borderBottom: "1px solid rgba(148, 163, 184, 0.24)",
          }}
        >
          <Stack spacing={0.4}>
            <Typography variant="h5" sx={{ color: "common.white" }}>
              SmartEconomat Debug Console
            </Typography>
            <Typography variant="body2" sx={{ color: "grey.300" }}>
              Stream en tiempo real de logs, errores globales y eventos IPC.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`Total ${counters.total}`} size="small" color="info" />
            <Chip
              label={`Errores ${counters.errors}`}
              size="small"
              color="error"
            />
            <Chip
              label={`Warnings ${counters.warnings}`}
              size="small"
              color="warning"
            />
            <Button
              variant="contained"
              color="warning"
              onClick={() => void clearLogs()}
            >
              Clear logs
            </Button>
          </Stack>
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : null}

        {status ? (
          <Alert severity="success" sx={{ m: 2 }}>
            {status}
          </Alert>
        ) : null}

        <Box
          ref={streamContainerRef}
          sx={{
            p: 2,
            display: "grid",
            gap: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {logs.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderStyle: "dashed",
                borderColor: "rgba(148, 163, 184, 0.5)",
              }}
            >
              <Typography variant="body2" sx={{ color: "grey.200" }}>
                Sin eventos todavía. Esta consola se actualiza automáticamente.
              </Typography>
            </Paper>
          ) : null}

          {logs.map((entry, index) => {
            const visual = getTypeStyles(entry.type);
            const contextText = stringifyContext(entry.context);

            return (
              <Paper
                key={`${entry.timestamp}-${index}`}
                variant="outlined"
                sx={{
                  p: 1.2,
                  borderLeft: `4px solid ${visual.border}`,
                  borderColor: "rgba(148, 163, 184, 0.35)",
                  backgroundColor: visual.background,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={0.9}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  sx={{ mb: 0.7 }}
                >
                  <Chip
                    size="small"
                    color={visual.chipColor}
                    label={entry.type.toUpperCase()}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    sx={{
                      color: "grey.100",
                      borderColor: "rgba(226,232,240,0.42)",
                    }}
                    label={(entry.source ?? "main").toUpperCase()}
                  />
                  <Typography variant="caption" sx={{ color: "grey.300" }}>
                    {formatTimestamp(entry.timestamp)}
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{
                    color: "grey.50",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {entry.message}
                </Typography>

                {contextText ? (
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      mt: 0.9,
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: "rgba(2, 6, 23, 0.48)",
                      border: "1px solid rgba(148, 163, 184, 0.24)",
                      color: "grey.300",
                      fontSize: 12,
                      lineHeight: 1.35,
                      overflowX: "auto",
                    }}
                  >
                    {contextText}
                  </Box>
                ) : null}
              </Paper>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
