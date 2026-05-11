import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useState } from "react";

import type { InstallerConfigPayload } from "@shared/contracts";
import { WizardFooterNav } from "@renderer/components/WizardFooterNav";

interface SmtpConfigPageProps {
  config: InstallerConfigPayload;
  busy: boolean;
  onChange: (next: InstallerConfigPayload) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface FieldLabelProps {
  label: string;
  tooltip?: string;
}

function FieldLabel({ label, tooltip }: FieldLabelProps) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
      <Typography variant="subtitle2" color="text.primary">
        {label}
      </Typography>
      {tooltip ? (
        <Tooltip title={tooltip} arrow placement="top-start">
          <IconButton
            size="small"
            sx={{
              width: 18,
              height: 18,
              border: "1px solid",
              borderColor: "divider",
              color: "text.secondary",
              fontWeight: 700,
              p: 0,
            }}
          >
            <Typography component="span" sx={{ fontSize: 11, fontWeight: 700 }}>
              ?
            </Typography>
          </IconButton>
        </Tooltip>
      ) : null}
    </Stack>
  );
}

export function SmtpConfigPage({
  config,
  busy,
  onChange,
  onBack,
  onContinue,
}: SmtpConfigPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const canTest =
    !busy && !testing && config.smtpHost?.trim() && config.smtpPort?.trim();

  const handleTest = async () => {
    if (!canTest || typeof window === "undefined") return;
    setTesting(true);
    setTestResult(null);
    try {
      const bridge = (window as Partial<Window>).smartEconomat;
      if (!bridge) throw new Error("Bridge not found");
      const result = await bridge.testSmtp(config);
      setTestResult({ ok: result.ok, message: result.message });
    } catch (e) {
      setTestResult({
        ok: false,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setTesting(false);
    }
  };

  const skipTestAndContinue = () => {
    onContinue();
  };

  return (
    <Box component="section">
      <Typography
        variant="h5"
        component="h2"
        sx={{ fontWeight: 700 }}
        gutterBottom
      >
        Configuración de Email (SMTP)
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        Configura el correo oficial que la aplicación utilizará para enviar
        comunicaciones automáticas a los usuarios.
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>
          ⚠️ Importancia del Correo Oficial
        </AlertTitle>
        Esta configuración es <strong>crítica</strong> para el funcionamiento
        del sistema. Sin un servidor SMTP válido:
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
          <li>
            Los usuarios <strong>no podrán recuperar sus contraseñas</strong>{" "}
            por email.
          </li>
          <li>
            No se enviarán notificaciones de sistema ni alertas automáticas.
          </li>
          <li>
            El "Correo del Sistema" (Remitente) debe estar autorizado en su
            proveedor SMTP para evitar que los mensajes sean marcados como SPAM.
          </li>
        </Box>
      </Alert>

      <Stack spacing={2}>
        <Paper
          variant="outlined"
          sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Servidor SMTP
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
          >
            <Box>
              <FieldLabel
                label="Host SMTP"
                tooltip="Ejemplo: smtp.gmail.com, smtp.office365.com"
              />
              <TextField
                fullWidth
                placeholder="smtp.ejemplo.com"
                value={config.smtpHost ?? ""}
                onChange={(event) =>
                  onChange({ ...config, smtpHost: event.target.value })
                }
                disabled={busy || testing}
                slotProps={{
                  htmlInput: { "aria-label": "Host SMTP" },
                }}
              />
            </Box>

            <Box>
              <FieldLabel
                label="Puerto SMTP"
                tooltip="Habitualmente 587 (TLS), 465 (SSL) o 25 (Sin cifrar)"
              />
              <TextField
                fullWidth
                type="number"
                placeholder="587"
                value={config.smtpPort ?? ""}
                onChange={(event) =>
                  onChange({ ...config, smtpPort: event.target.value })
                }
                disabled={busy || testing}
                slotProps={{
                  htmlInput: { "aria-label": "Puerto SMTP" },
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              mt: 2,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
          >
            <Box>
              <FieldLabel label="Usuario SMTP" />
              <TextField
                fullWidth
                placeholder="usuario@ejemplo.com"
                value={config.smtpUser ?? ""}
                onChange={(event) =>
                  onChange({ ...config, smtpUser: event.target.value })
                }
                disabled={busy || testing}
              />
            </Box>

            <Box>
              <FieldLabel label="Contraseña SMTP / App Password" />
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                value={config.smtpPass ?? ""}
                onChange={(event) =>
                  onChange({ ...config, smtpPass: event.target.value })
                }
                disabled={busy || testing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword((curr) => !curr)}
                      >
                        {showPassword ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <FieldLabel
              label="Remitente (From)"
              tooltip="El correo que verán los usuarios al recibir los mensajes."
            />
            <TextField
              fullWidth
              placeholder="Soporte SmartEconomat <noreply@ejemplo.com>"
              value={config.smtpFrom ?? ""}
              onChange={(event) =>
                onChange({ ...config, smtpFrom: event.target.value })
              }
              disabled={busy || testing}
            />
          </Box>

          <FormControlLabel
            sx={{ mt: 1.5 }}
            control={
              <Checkbox
                checked={config.smtpSecure ?? false}
                onChange={(event) =>
                  onChange({ ...config, smtpSecure: event.target.checked })
                }
                disabled={busy || testing}
              />
            }
            label="Usar conexión segura explícita (Secure/SSL en el puerto 465)"
          />
        </Paper>

        {testResult ? (
          <Alert severity={testResult.ok ? "success" : "error"}>
            <AlertTitle sx={{ fontWeight: 700 }}>
              {testResult.ok ? "Conexión Exitosa" : "Error de Conexión"}
            </AlertTitle>
            {testResult.message}
          </Alert>
        ) : null}

        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <WizardFooterNav
            onBack={onBack}
            onContinue={skipTestAndContinue}
            backDisabled={busy || testing}
            continueDisabled={busy || testing}
            centerContent={
              <Button
                variant="outlined"
                onClick={handleTest}
                disabled={!canTest}
                startIcon={
                  testing ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : null
                }
                sx={{
                  height: 42,
                  minHeight: 42,
                  px: 2.25,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {testing ? "Probando..." : "Probar conexión"}
              </Button>
            }
          />
        </Box>
      </Stack>
    </Box>
  );
}
