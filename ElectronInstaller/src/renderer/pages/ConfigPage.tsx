import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Collapse,
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
import { WizardFooterNav } from "@renderer/components/WizardFooterNav";

interface ConfigPageProps {
  config: InstallerConfigPayload;
  busy: boolean;
  backupDefaultDirectory: string;
  onChange: (next: InstallerConfigPayload) => void;
  onSaveBackupDefaultDirectory: (directory: string) => void;
  onPickBackupDirectory: (defaultPath?: string) => Promise<string | null>;
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
  backupDefaultDirectory,
  onChange,
  onSaveBackupDefaultDirectory,
  onPickBackupDirectory,
  onBack,
  onContinue,
  onPickInstallerFile,
}: ConfigPageProps) {
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);
  const [showVerifyAdminPassword, setShowVerifyAdminPassword] = useState(false);
  const [showAdvancedEnv, setShowAdvancedEnv] = useState(false);
  const [newInstallConfirmed, setNewInstallConfirmed] = useState(false);

  const usernameCollision =
    config.installMode === "new" &&
    config.adminUsername.trim().toLowerCase() ===
      config.superAdminUsername.trim().toLowerCase();

  const emailCollision =
    config.adminEmail?.trim() &&
    config.superAdminEmail?.trim() &&
    config.adminEmail.trim().toLowerCase() ===
      config.superAdminEmail.trim().toLowerCase();

  const certModeIncomplete =
    config.tlsProvider === "custom" &&
    (!config.customCertFullchainPath?.trim() ||
      !config.customCertPrivkeyPath?.trim());

  const passwordMismatch =
    config.installMode === "new" &&
    config.useSamePasswordForBoth &&
    config.adminPassword !== config.superAdminPassword;

  const scheduleTimeInvalid = !/^([01]\d|2[0-3]):[0-5]\d$/.test(
    config.backupScheduleTime,
  );

  const reinstallVerifyPasswordMissing =
    config.installMode === "reinstall" &&
    config.verifyExistingAdminSession &&
    !config.verifyAdminPassword?.trim();

  const canContinue =
    !busy &&
    !usernameCollision &&
    !emailCollision &&
    !certModeIncomplete &&
    !passwordMismatch &&
    !scheduleTimeInvalid &&
    !reinstallVerifyPasswordMissing &&
    (config.installMode !== "new" || newInstallConfirmed);

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

  async function pickBackupDirectoryForInstallStep(): Promise<void> {
    const selectedDirectory = await onPickBackupDirectory(
      backupDefaultDirectory,
    );
    if (!selectedDirectory) {
      return;
    }

    onSaveBackupDefaultDirectory(selectedDirectory);
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

  function updateInstallMode(
    mode: InstallerConfigPayload["installMode"],
  ): void {
    setNewInstallConfirmed(false);

    const isNew = mode === "new";

    onChange({
      ...config,
      installMode: mode,
      verifyExistingAdminSession: isNew
        ? false
        : config.verifyExistingAdminSession,
      repairAdminCredentialsOnFailure: isNew
        ? false
        : config.verifyExistingAdminSession
          ? config.repairAdminCredentialsOnFailure
          : false,
      verifyAdminUsername: isNew
        ? ""
        : (config.verifyAdminUsername ?? config.adminUsername),
      verifyAdminPassword: isNew ? "" : config.verifyAdminPassword,
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
            Tipo de instalación
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
                label="Modo de instalación"
                tooltip="Nueva instalación configura todo desde cero. Reinstalación preserva los datos existentes (base de datos, archivos subidos, backups)."
              />
              <TextField
                fullWidth
                select
                value={config.installMode}
                onChange={(event) =>
                  updateInstallMode(
                    event.target.value as InstallerConfigPayload["installMode"],
                  )
                }
              >
                <MenuItem value="new">Nueva instalación</MenuItem>
                <MenuItem value="reinstall">
                  Reinstalación (preservar datos)
                </MenuItem>
              </TextField>
            </Box>

            <Box>
              {config.installMode === "reinstall" ? (
                <Alert severity="success" sx={{ height: "100%" }}>
                  <AlertTitle sx={{ fontWeight: 700 }}>
                    Datos preservados
                  </AlertTitle>
                  Los datos existentes se mantendrán intactos. Se realizará un
                  backup automático antes de aplicar cambios.
                </Alert>
              ) : (
                <Alert severity="info" sx={{ height: "100%" }}>
                  <AlertTitle sx={{ fontWeight: 700 }}>
                    Instalación limpia
                  </AlertTitle>
                  Se configurará el entorno completo desde cero con las
                  credenciales indicadas abajo.
                </Alert>
              )}
            </Box>
          </Box>

          {config.installMode === "new" ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle sx={{ fontWeight: 700 }}>
                ⚠️ Advertencia: posible pérdida de datos
              </AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Si ya existe una instalación previa en esta ruta, una
                instalación nueva podría sobrescribir las credenciales y
                configuraciones existentes.{" "}
                <strong>
                  Se recomienda encarecidamente realizar una copia de seguridad
                </strong>{" "}
                antes de continuar.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                <strong>¿Qué se preserva automáticamente?</strong>
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.25 } }}>
                <li>
                  <Typography variant="body2">
                    ✅ Base de datos (volumen Docker persistente)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    ✅ Archivos subidos (volumen Docker persistente)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    ✅ Backups existentes en la carpeta de backups
                  </Typography>
                </li>
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>¿Qué podría cambiar?</strong>
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.25 } }}>
                <li>
                  <Typography variant="body2">
                    🔄 Credenciales de admin/superadmin (se aplicarán las
                    nuevas)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    🔄 Archivo .env.prod (se regenerará con nuevos secretos)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    🔄 Certificados TLS (se regenerarán según configuración)
                  </Typography>
                </li>
              </Box>
              <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 600 }}>
                El instalador realizará un backup automático antes de aplicar
                cualquier cambio siempre que detecte una instalación previa.
              </Typography>
              <FormControlLabel
                sx={{ mt: 1.5 }}
                control={
                  <Checkbox
                    checked={newInstallConfirmed}
                    onChange={(event) =>
                      setNewInstallConfirmed(event.target.checked)
                    }
                    disabled={busy}
                    sx={{
                      color: "warning.main",
                      "&.Mui-checked": { color: "warning.main" },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Entiendo las implicaciones y deseo continuar con la
                    instalación nueva
                  </Typography>
                }
              />
            </Alert>
          ) : null}

          {config.installMode === "reinstall" ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle sx={{ fontWeight: 700 }}>
                Información sobre la reinstalación
              </AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                La reinstalación está diseñada para actualizar o reparar la
                aplicación sin perder datos. Se realizará un{" "}
                <strong>backup automático</strong> antes de aplicar cualquier
                cambio.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Se preservan:</strong>
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.25 } }}>
                <li>
                  <Typography variant="body2">
                    ✅ Base de datos completa (productos, pedidos, inventario,
                    usuarios...)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    ✅ Archivos subidos (imágenes, documentos)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    ✅ Historial de backups
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    ✅ Configuración de caché Redis
                  </Typography>
                </li>
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Se actualizan:</strong>
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.25 } }}>
                <li>
                  <Typography variant="body2">
                    🔄 Imágenes Docker (frontend, backend, base de datos)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    🔄 Configuración de entorno (.env.prod) — se reutilizan
                    secretos previos si existen
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    🔄 Certificados TLS según la configuración elegida
                  </Typography>
                </li>
              </Box>
            </Alert>
          ) : null}

          <FormControlLabel
            sx={{ mt: 1.5 }}
            control={
              <Checkbox
                checked={config.verifyExistingAdminSession}
                onChange={(event) =>
                  onChange({
                    ...config,
                    verifyExistingAdminSession: event.target.checked,
                    repairAdminCredentialsOnFailure: event.target.checked
                      ? config.repairAdminCredentialsOnFailure
                      : false,
                  })
                }
                disabled={busy || config.installMode === "new"}
              />
            }
            label="Validar inicio de sesión admin al finalizar despliegue"
          />
          {config.installMode === "new" ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", ml: 4 }}
            >
              Solo disponible en modo reinstalación (los usuarios aún no existen
              en una instalación nueva).
            </Typography>
          ) : null}

          {config.installMode === "reinstall" &&
          config.verifyExistingAdminSession ? (
            <Box
              sx={{
                mt: 1,
                display: "grid",
                gap: 1.25,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              }}
            >
              <Box>
                <FieldLabel label="Usuario actual para validar conexión" />
                <TextField
                  fullWidth
                  value={config.verifyAdminUsername ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      verifyAdminUsername: event.target.value,
                    })
                  }
                  placeholder="admin"
                />
              </Box>
              <Box>
                <FieldLabel label="Contraseña actual para validación" />
                <TextField
                  fullWidth
                  type={showVerifyAdminPassword ? "text" : "password"}
                  value={config.verifyAdminPassword ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      verifyAdminPassword: event.target.value,
                    })
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() =>
                            setShowVerifyAdminPassword((current) => !current)
                          }
                        >
                          {showVerifyAdminPassword ? (
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
          ) : null}

          <FormControlLabel
            control={
              <Checkbox
                checked={config.repairAdminCredentialsOnFailure}
                onChange={(event) =>
                  onChange({
                    ...config,
                    repairAdminCredentialsOnFailure: event.target.checked,
                  })
                }
                disabled={busy || !config.verifyExistingAdminSession}
              />
            }
            label="Si falla el login admin, reparar credenciales automáticamente"
          />

          {reinstallVerifyPasswordMissing ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              En reinstalación, indica la contraseña actual para validar login o
              desactiva esta validación.
            </Alert>
          ) : null}
        </Paper>

        {config.installMode === "new" ? (
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
                        onChange({
                          ...config,
                          adminUsername: event.target.value,
                        })
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
                  <Box>
                    <FieldLabel
                      label="Email admin (opcional)"
                      tooltip="Email para recuperación de contraseña del administrador principal."
                    />
                    <TextField
                      fullWidth
                      placeholder="admin@ejemplo.com"
                      value={config.adminEmail ?? ""}
                      onChange={(event) =>
                        onChange({
                          ...config,
                          adminEmail: event.target.value,
                        })
                      }
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
                  <Box>
                    <FieldLabel
                      label="Email superadmin (opcional)"
                      tooltip="Email para recuperación de contraseña del super administrador."
                    />
                    <TextField
                      fullWidth
                      placeholder="superadmin@ejemplo.com"
                      value={config.superAdminEmail ?? ""}
                      onChange={(event) =>
                        onChange({
                          ...config,
                          superAdminEmail: event.target.value,
                        })
                      }
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
              Estas credenciales se sincronizarán automáticamente con los
              usuarios que crea la migración inicial de la aplicación.
            </Typography>

            {(!config.adminEmail?.trim() ||
              !config.superAdminEmail?.trim()) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>⚠️ Advertencia:</strong> Si no configuras los correos
                  electrónicos, no será posible recuperar la contraseña por
                  email. En ese caso, la única alternativa será que otro usuario
                  con permisos de administrador acceda y establezca una
                  contraseña temporal.
                </Typography>
              </Alert>
            )}

            {usernameCollision ? (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                Los usuarios admin y superadmin deben ser distintos.
              </Alert>
            ) : null}

            {emailCollision ? (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                Los correos electrónicos de admin y superadmin deben ser
                distintos si se proporcionan.
              </Alert>
            ) : null}
          </Paper>
        ) : null}

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
                slotProps={{
                  htmlInput: { "aria-label": "Host local" },
                }}
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
                tooltip="Configura TLS para la conexión local. ‘Autofirmado’ genera un certificado auto-firmado para uso local."
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
            <Box sx={{ gridColumn: { xs: "auto", md: "1 / span 2" } }}>
              <FieldLabel
                label="Ruta de backups"
                tooltip="Carpeta base donde se guardarán los backups automáticos y manuales de SmartEconomat."
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  fullWidth
                  value={backupDefaultDirectory}
                  onChange={(event) =>
                    onSaveBackupDefaultDirectory(event.target.value)
                  }
                />
                <Button
                  variant="outlined"
                  onClick={() => void pickBackupDirectoryForInstallStep()}
                  disabled={busy}
                >
                  Seleccionar carpeta
                </Button>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.75, display: "block" }}
              >
                Esta ruta se usará por defecto durante la instalación y en el
                panel de control para nuevas copias de seguridad.
              </Typography>
            </Box>

            <Box>
              <FieldLabel
                label="Hora programada"
                tooltip="Los backups automáticos se ejecutarán a esta hora cuando la frecuencia esté activa."
              />
              <TextField
                fullWidth
                type="time"
                value={config.backupScheduleTime}
                onChange={(event) =>
                  onChange({
                    ...config,
                    backupScheduleTime: event.target.value,
                  })
                }
                inputProps={{ step: 300 }}
              />
            </Box>

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
            Se realizarán copias completas de seguridad de la base de datos y
            archivos de la instalación cada{" "}
            {FrequencyToDaysLabel(config.backupFrequency)} días a las{" "}
            {config.backupScheduleTime} y se guardarán durante el número de días
            indicado.
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2 }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1.25}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Configuración avanzada de secretos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Si dejas estos campos vacíos, el instalador generará valores
                criptográficamente seguros de forma automática.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setShowAdvancedEnv((current) => !current)}
              disabled={busy}
            >
              {showAdvancedEnv ? "Ocultar avanzado" : "Mostrar avanzado"}
            </Button>
          </Stack>

          <Collapse in={showAdvancedEnv}>
            <Alert severity="info" sx={{ mt: 2 }}>
              Sentry permite monitorizar errores en backend y frontend. Si no
              tienes cuenta o DSN, puedes dejar estos campos vacíos y continuar
              sin Sentry.
            </Alert>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                mt: 2,
              }}
            >
              <Box>
                <FieldLabel label="POSTGRES_PASSWORD (opcional)" />
                <TextField
                  fullWidth
                  type="password"
                  value={config.postgresPassword ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      postgresPassword: event.target.value,
                    })
                  }
                />
              </Box>

              <Box>
                <FieldLabel label="POSTGRES_USER (opcional)" />
                <TextField
                  fullWidth
                  autoComplete="off"
                  placeholder="postgres"
                  value={config.postgresUser ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      postgresUser: event.target.value,
                    })
                  }
                />
              </Box>

              <Box>
                <FieldLabel label="POSTGRES_DB (opcional)" />
                <TextField
                  fullWidth
                  autoComplete="off"
                  placeholder="smarteconomat"
                  value={config.postgresDb ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      postgresDb: event.target.value,
                    })
                  }
                />
              </Box>

              <Box>
                <FieldLabel label="JWT_EXPIRATION (opcional)" />
                <TextField
                  fullWidth
                  autoComplete="off"
                  placeholder="7d"
                  value={config.jwtExpiration ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      jwtExpiration: event.target.value,
                    })
                  }
                />
              </Box>

              <Box>
                <FieldLabel label="I18N_FALLBACK_LANGUAGE (opcional)" />
                <TextField
                  fullWidth
                  autoComplete="off"
                  placeholder="es"
                  value={config.i18nFallbackLanguage ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      i18nFallbackLanguage: event.target.value,
                    })
                  }
                />
              </Box>

              <Box sx={{ gridColumn: { md: "1 / -1" } }}>
                <FieldLabel label="I18N_PATH (opcional)" />
                <TextField
                  fullWidth
                  autoComplete="off"
                  placeholder="Vacío = resolución por defecto del backend"
                  value={config.i18nPath ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      i18nPath: event.target.value,
                    })
                  }
                />
              </Box>

              <Box>
                <FieldLabel label="REDIS_PASSWORD (opcional)" />
                <TextField
                  fullWidth
                  type="password"
                  value={config.redisPassword ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      redisPassword: event.target.value,
                    })
                  }
                />
              </Box>

              <Box>
                <FieldLabel label="JWT_SECRET (opcional)" />
                <TextField
                  fullWidth
                  type="password"
                  value={config.jwtSecret ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      jwtSecret: event.target.value,
                    })
                  }
                />
              </Box>

              <Box>
                <FieldLabel label="SENTRY_DSN (opcional)" />
                <TextField
                  fullWidth
                  value={config.sentryDsn ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      sentryDsn: event.target.value,
                    })
                  }
                />
              </Box>

              <Box>
                <FieldLabel label="VITE_SENTRY_DSN (opcional)" />
                <TextField
                  fullWidth
                  value={config.viteSentryDsn ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      viteSentryDsn: event.target.value,
                    })
                  }
                />
              </Box>
            </Box>
          </Collapse>
        </Paper>
      </Stack>

      {certModeIncomplete ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          Debes seleccionar el fullchain.pem y el privkey.pem para continuar en
          modo de certificado personalizado.
        </Alert>
      ) : null}

      <WizardFooterNav
        onBack={onBack}
        onContinue={onContinue}
        backDisabled={busy}
        continueDisabled={!canContinue}
        continueTooltip={
          config.installMode === "new" && !newInstallConfirmed
            ? "Debes marcar el checkbox de confirmación para continuar con la instalación nueva."
            : certModeIncomplete
              ? "Debes seleccionar los archivos de certificado TLS para continuar."
              : ""
        }
      />

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
