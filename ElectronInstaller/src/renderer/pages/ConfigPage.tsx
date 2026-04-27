import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useState } from "react";

import type {
  InstallerConfigPayload,
  InstallerFilePickerPayload,
} from "@shared/contracts";

interface ConfigPageProps {
  config: InstallerConfigPayload;
  busy: boolean;
  onChange: (next: InstallerConfigPayload) => void;
  onBack: () => void;
  onContinue: () => void;
  onPickInstallerFile: (
    payload: InstallerFilePickerPayload,
  ) => Promise<string | null>;
}

const timezoneOptions = [
  "Europe/Madrid",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function FrequencyToDaysLabel(
  backupFrequency: InstallerConfigPayload["backupFrequency"],
): string {
  if (backupFrequency === "daily") {
    return "1";
  }

  if (backupFrequency === "weekly") {
    return "7";
  }

  return "0";
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

export function ConfigPage({
  config,
  busy,
  onChange,
  onBack,
  onContinue,
  onPickInstallerFile,
}: ConfigPageProps) {
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);

  const usernameCollision =
    config.adminUsername.trim().toLowerCase() ===
    config.superAdminUsername.trim().toLowerCase();

  const certModeIncomplete =
    config.tlsProvider === "custom" &&
    (!config.customCertFullchainPath?.trim() ||
      !config.customCertPrivkeyPath?.trim());

  const passwordMismatch =
    config.useSamePasswordForBoth &&
    config.adminPassword !== config.superAdminPassword;

  const canContinue =
    !busy && !usernameCollision && !certModeIncomplete && !passwordMismatch;

  async function pickCertFile(
    field: "customCertFullchainPath" | "customCertPrivkeyPath",
  ): Promise<void> {
    const title =
      field === "customCertFullchainPath"
        ? "Seleccionar certificado fullchain.pem"
        : "Seleccionar clave privada privkey.pem";

    const selectedPath = await onPickInstallerFile({
      title,
      buttonLabel: "Usar este archivo",
      filters: [
        { name: "Certificados PEM", extensions: ["pem", "crt", "cer", "key"] },
        { name: "Todos los archivos", extensions: ["*"] },
      ],
      defaultPath: config.runtimePath,
    });

    if (!selectedPath) {
      return;
    }

    onChange({
      ...config,
      [field]: selectedPath,
    });
  }

  function updateAdminPassword(nextPassword: string): void {
    if (config.useSamePasswordForBoth) {
      onChange({
        ...config,
        adminPassword: nextPassword,
        superAdminPassword: nextPassword,
      });
      return;
    }

    onChange({
      ...config,
      adminPassword: nextPassword,
    });
  }

  function updateSamePassword(enabled: boolean): void {
    onChange({
      ...config,
      useSamePasswordForBoth: enabled,
      superAdminPassword: enabled
        ? config.adminPassword
        : config.superAdminPassword,
    });
  }

  return (
    <Box component="section">
      <Typography
        variant="h5"
        component="h2"
        sx={{ fontWeight: 700 }}
        gutterBottom
      >
        Configuración inicial
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        Define los parámetros de ejecución, seguridad y credenciales iniciales
        para dejar SmartEconomat listo para desplegar con un flujo controlado.
      </Typography>

      <Stack spacing={2}>
        <Paper
          variant="outlined"
          sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Entorno de ejecución
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
                label="Runtime path"
                tooltip="Define la carpeta donde se guardarán los archivos temporales y de ejecución de la app. Puedes dejar la ruta por defecto o cambiarla a una ruta persistente."
              />
              <TextField
                fullWidth
                value={config.runtimePath}
                onChange={(event) =>
                  onChange({ ...config, runtimePath: event.target.value })
                }
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.75, display: "block" }}
              >
                Ruta donde se ejecutará la aplicación en runtime (archivos
                temporales y de ejecución)
              </Typography>
            </Box>

            <Box>
              <FieldLabel
                label="Nombre de instancia"
                tooltip="Nombre identificador de esta instalación local. Se usa para diferenciar múltiples instalaciones en el mismo equipo."
              />
              <TextField
                fullWidth
                value={config.instanceName}
                onChange={(event) =>
                  onChange({ ...config, instanceName: event.target.value })
                }
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.75, display: "block" }}
              >
                Nombre único de esta instancia de la aplicación
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Usuarios por defecto
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
          >
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1.25 }}
              >
                Usuario admin
              </Typography>
              <Stack spacing={1.25}>
                <Box>
                  <FieldLabel label="Usuario admin" />
                  <TextField
                    fullWidth
                    value={config.adminUsername}
                    onChange={(event) =>
                      onChange({ ...config, adminUsername: event.target.value })
                    }
                  />
                </Box>
                <Box>
                  <FieldLabel label="Contraseña admin" />
                  <TextField
                    fullWidth
                    type={showAdminPassword ? "text" : "password"}
                    value={config.adminPassword}
                    onChange={(event) =>
                      updateAdminPassword(event.target.value)
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() =>
                              setShowAdminPassword((current) => !current)
                            }
                          >
                            {showAdminPassword ? (
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
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1.25 }}
              >
                Usuario superadmin
              </Typography>
              <Stack spacing={1.25}>
                <Box>
                  <FieldLabel label="Usuario superadmin" />
                  <TextField
                    fullWidth
                    value={config.superAdminUsername}
                    onChange={(event) =>
                      onChange({
                        ...config,
                        superAdminUsername: event.target.value,
                      })
                    }
                  />
                </Box>
                <Box>
                  <FieldLabel label="Contraseña superadmin" />
                  <TextField
                    fullWidth
                    type={showSuperAdminPassword ? "text" : "password"}
                    disabled={config.useSamePasswordForBoth}
                    value={config.superAdminPassword}
                    onChange={(event) =>
                      onChange({
                        ...config,
                        superAdminPassword: event.target.value,
                      })
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() =>
                              setShowSuperAdminPassword((current) => !current)
                            }
                          >
                            {showSuperAdminPassword ? (
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
              </Stack>
            </Paper>
          </Box>

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={config.useSamePasswordForBoth}
                onChange={(event) => updateSamePassword(event.target.checked)}
              />
            }
            label="Usar la misma contraseña para ambos usuarios"
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            Estas credenciales se sincronizarán automáticamente con los usuarios
            que crea la migración inicial de la aplicación.
          </Typography>

          {usernameCollision ? (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              Los usuarios admin y superadmin deben ser distintos.
            </Alert>
          ) : null}
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Conectividad y seguridad
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
          >
            <Box>
              <FieldLabel label="Host local" />
              <TextField
                fullWidth
                value={config.localHost}
                onChange={(event) =>
                  onChange({ ...config, localHost: event.target.value })
                }
              />
            </Box>

            <Box>
              <FieldLabel label="Zona horaria" />
              <TextField
                fullWidth
                select
                value={config.timezone}
                onChange={(event) =>
                  onChange({ ...config, timezone: event.target.value })
                }
              >
                {timezoneOptions.map((zone) => (
                  <MenuItem key={zone} value={zone}>
                    {zone}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ gridColumn: { xs: "auto", md: "1 / span 2" } }}>
              <FieldLabel
                label="TLS"
                tooltip="Configura TLS para la conexión local. ‘Autofirmado’ genera un certificado auto-firmado seguro para uso local."
              />
              <TextField
                fullWidth
                select
                value={config.tlsProvider}
                onChange={(event) =>
                  onChange({
                    ...config,
                    tlsProvider: event.target
                      .value as InstallerConfigPayload["tlsProvider"],
                  })
                }
              >
                <MenuItem value="selfsigned">Autofirmado</MenuItem>
                <MenuItem value="none">Ninguno</MenuItem>
                <MenuItem value="custom">Certificado personalizado</MenuItem>
              </TextField>
            </Box>

            {config.tlsProvider === "none" ? (
              <Alert
                severity="warning"
                sx={{ gridColumn: { xs: "auto", md: "1 / span 2" } }}
              >
                Modo avanzado: el instalador no gestionará certificados TLS en
                esta instalación. Asegura tu configuración externa antes del
                despliegue.
              </Alert>
            ) : null}

            {config.tlsProvider === "custom" ? (
              <>
                <Box>
                  <FieldLabel label="Ruta certificado fullchain.pem" />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      fullWidth
                      value={config.customCertFullchainPath ?? ""}
                      onChange={(event) =>
                        onChange({
                          ...config,
                          customCertFullchainPath: event.target.value,
                        })
                      }
                    />
                    <Button
                      variant="outlined"
                      onClick={() =>
                        void pickCertFile("customCertFullchainPath")
                      }
                      disabled={busy}
                    >
                      Seleccionar
                    </Button>
                  </Stack>
                </Box>

                <Box>
                  <FieldLabel label="Ruta clave privada privkey.pem" />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      fullWidth
                      value={config.customCertPrivkeyPath ?? ""}
                      onChange={(event) =>
                        onChange({
                          ...config,
                          customCertPrivkeyPath: event.target.value,
                        })
                      }
                    />
                    <Button
                      variant="outlined"
                      onClick={() => void pickCertFile("customCertPrivkeyPath")}
                      disabled={busy}
                    >
                      Seleccionar
                    </Button>
                  </Stack>
                </Box>
              </>
            ) : null}
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Política de backups
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
                label="Frecuencia backup"
                tooltip="Backups completos de la base de datos de SmartEconomat. Muy importante para la recuperación de datos."
              />
              <TextField
                fullWidth
                select
                value={config.backupFrequency}
                onChange={(event) =>
                  onChange({
                    ...config,
                    backupFrequency: event.target
                      .value as InstallerConfigPayload["backupFrequency"],
                  })
                }
              >
                <MenuItem value="off">Desactivado</MenuItem>
                <MenuItem value="daily">Diario</MenuItem>
                <MenuItem value="weekly">Semanal</MenuItem>
              </TextField>
            </Box>

            <Box>
              <FieldLabel label="Retención backup (días)" />
              <TextField
                fullWidth
                type="number"
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: 365,
                  },
                }}
                value={config.backupRetentionDays}
                onChange={(event) =>
                  onChange({
                    ...config,
                    backupRetentionDays: Number(event.target.value),
                  })
                }
              />
            </Box>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1.25 }}
          >
            Se realizarán copias de seguridad automáticas de la base de datos de
            la aplicación cada {FrequencyToDaysLabel(config.backupFrequency)}{" "}
            días y se guardarán durante el número de días indicado.
          </Typography>
        </Paper>
      </Stack>

      {certModeIncomplete ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          Debes seleccionar el fullchain.pem y el privkey.pem para continuar en
          modo de certificado personalizado.
        </Alert>
      ) : null}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 2.25 }}
      >
        <Button variant="outlined" disabled={busy} onClick={onBack}>
          Volver
        </Button>
        <Button
          variant="contained"
          disabled={!canContinue}
          onClick={onContinue}
          sx={{
            backgroundColor: "primary.main",
            color: "common.white",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            px: 2.5,
            "&:hover": {
              backgroundColor: "#b90043",
            },
          }}
        >
          IR A DESPLIEGUE
        </Button>
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1.25, display: "block" }}
      >
        Revisa esta configuración antes del despliegue. Puedes volver a este
        paso para ajustar cualquier parámetro sin perder coherencia de la
        instalación.
      </Typography>
    </Box>
  );
}
