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

import type { PreflightReport } from "@shared/contracts";

interface PreflightPageProps {
  report: PreflightReport | null;
  busy: boolean;
  blockersCount: number;
  onRun: () => Promise<void>;
  onAutoRepair: () => Promise<void>;
  onCloseBusyPort: (port: number) => Promise<void>;
  onBack: () => void;
  onContinue: () => void;
}

/**
 * Expone la operación "PreflightPage" del instalador SmartEconomat.
 * @returns {PreflightPageProps} {
 *   report,
 *   busy,
 *   blockersCount,
 *   onRun,
 *   onAutoRepair,
 *   onCloseBusyPort,
 *   onBack,
 *   onContinue,
 * } - Entrada esperada por la función.
 * @returns {import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/jsx-runtime").JSX.Element} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function PreflightPage({
  report,
  busy,
  blockersCount,
  onRun,
  onAutoRepair,
  onCloseBusyPort,
  onBack,
  onContinue,
}: PreflightPageProps) {
  return (
    <Box component="section">
      <Typography variant="h5" component="h2" gutterBottom>
        Preflight
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Comprobaciones del sistema, Docker, puertos y dependencias TLS.
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Button variant="outlined" onClick={onBack}>
          Volver
        </Button>
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
          {busy ? "Aplicando fixes..." : "Intentar solucionar automáticamente"}
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
