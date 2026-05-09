import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import type { BackupMetadata } from "@shared/contracts";

interface BackupRestorePanelProps {
  lastBackup: BackupMetadata | null;
  busy: boolean;
  backupDefaultDirectory: string;
  onSaveBackupDefaultDirectory: (directory: string) => void;
  onPickBackupDirectory: (defaultPath?: string) => Promise<string | null>;
  onBackup: (label: string, destinationDir: string) => Promise<void>;
  onRestore: (artifactPath: string) => Promise<void>;
  onPickRestoreArtifact: () => Promise<string | null>;
  initialBackupLabel?: string;
  initialArtifactPath?: string;
  initialRestoreAcknowledged?: boolean;
}

function formatBackupDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Expone la operación "BackupRestorePanel" del instalador SmartEconomat.
 * @returns {BackupRestorePanelProps} {
 *   lastBackup,
 *   busy,
 *   backupDefaultDirectory,
 *   onSaveBackupDefaultDirectory,
 *   onPickBackupDirectory,
 *   onBackup,
 *   onRestore,
 *   onPickRestoreArtifact,
 *   initialBackupLabel = "",
 *   initialArtifactPath = "",
 *   initialRestoreAcknowledged = false,
 * } - Entrada esperada por la función.
 * @returns {import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/jsx-runtime").JSX.Element} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function BackupRestorePanel({
  lastBackup,
  busy,
  backupDefaultDirectory,
  onSaveBackupDefaultDirectory,
  onPickBackupDirectory,
  onBackup,
  onRestore,
  onPickRestoreArtifact,
  initialBackupLabel = "",
  initialArtifactPath = "",
  initialRestoreAcknowledged = false,
}: BackupRestorePanelProps) {
  const [label, setLabel] = useState(initialBackupLabel);
  const [artifactPath, setArtifactPath] = useState(initialArtifactPath);
  const [restoreAcknowledged, setRestoreAcknowledged] = useState(
    initialRestoreAcknowledged,
  );
  const [pickingArtifact, setPickingArtifact] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupTargetMode, setBackupTargetMode] = useState<
    "default" | "custom"
  >("default");
  const [customBackupDirectory, setCustomBackupDirectory] = useState("");
  const [saveCustomAsDefault, setSaveCustomAsDefault] = useState(false);

  const restoreDisabled =
    busy ||
    pickingArtifact ||
    artifactPath.trim().length === 0 ||
    !restoreAcknowledged;
  const resolvedBackupDirectory =
    backupTargetMode === "default"
      ? backupDefaultDirectory
      : customBackupDirectory.trim();
  const backupConfirmDisabled =
    busy || pickingArtifact || resolvedBackupDirectory.trim().length === 0;

  function openBackupDialog(): void {
    setBackupTargetMode("default");
    setCustomBackupDirectory(backupDefaultDirectory);
    setSaveCustomAsDefault(false);
    setBackupDialogOpen(true);
  }

  async function handlePickBackupDirectory(): Promise<void> {
    const selectedDirectory = await onPickBackupDirectory(
      customBackupDirectory.trim().length > 0
        ? customBackupDirectory
        : backupDefaultDirectory,
    );
    if (!selectedDirectory) {
      return;
    }

    setCustomBackupDirectory(selectedDirectory);
    setBackupTargetMode("custom");
  }

  async function handleUpdateDefaultBackupDirectory(): Promise<void> {
    const selectedDirectory = await onPickBackupDirectory(
      backupDefaultDirectory,
    );
    if (!selectedDirectory) {
      return;
    }

    onSaveBackupDefaultDirectory(selectedDirectory);
  }

  async function confirmBackupWithSelectedDirectory(): Promise<void> {
    const destinationDirectory = resolvedBackupDirectory.trim();
    if (destinationDirectory.length === 0) {
      return;
    }

    if (backupTargetMode === "custom" && saveCustomAsDefault) {
      onSaveBackupDefaultDirectory(destinationDirectory);
    }

    setBackupDialogOpen(false);
    await onBackup(label, destinationDirectory);
  }

  async function handlePickRestoreArtifact(): Promise<void> {
    setPickingArtifact(true);
    const selectedArtifact = await onPickRestoreArtifact();
    setPickingArtifact(false);

    if (!selectedArtifact) {
      return;
    }

    setArtifactPath(selectedArtifact);
    setRestoreAcknowledged(false);
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.75, sm: 2 },
        borderRadius: 3,
        borderColor: "rgba(148, 163, 184, 0.28)",
      }}
    >
      <Stack spacing={0.7} sx={{ mb: 1.5 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 800 }}>
          Backup y Restauración
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Protege la instalación con copias manuales y ejecuta restauraciones
          guiadas con confirmación visual reforzada.
        </Typography>
      </Stack>

      <Stack spacing={1.3}>
        <Box
          sx={{
            display: "grid",
            gap: 1.15,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.2fr) minmax(0, 1fr)",
            },
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 1.35,
              borderRadius: 2.5,
              bgcolor: "rgba(15, 118, 110, 0.04)",
              borderColor: "rgba(15, 118, 110, 0.16)",
            }}
          >
            <Stack spacing={1}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Crear backup manual
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.3 }}
                >
                  Genera una copia inmediata del estado actual para restaurar
                  con seguridad.
                </Typography>
              </Box>

              <TextField
                fullWidth
                size="small"
                label="Etiqueta del backup"
                placeholder="Nombre o etiqueta del backup (ej: backup-20260413)"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />

              <TextField
                fullWidth
                size="small"
                label="Ruta por defecto de backups"
                value={backupDefaultDirectory}
                slotProps={{ htmlInput: { readOnly: true } }}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  disabled={busy || pickingArtifact}
                  onClick={() => void handleUpdateDefaultBackupDirectory()}
                >
                  Cambiar ruta
                </Button>
                <Tooltip
                  title="Antes de crear el backup te pediremos confirmar si usas ruta por defecto o personalizada."
                  arrow
                >
                  <span style={{ width: "100%" }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      disabled={busy || pickingArtifact}
                      onClick={openBackupDialog}
                      sx={{ fontWeight: 800 }}
                    >
                      Crear Backup Ahora
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: 1.35,
              borderRadius: 2.5,
              borderStyle: lastBackup ? "solid" : "dashed",
              borderColor: "rgba(148, 163, 184, 0.28)",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.8 }}>
              Último backup disponible
            </Typography>

            {lastBackup ? (
              <Stack spacing={0.7}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {lastBackup.archiveName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Generado el {formatBackupDate(lastBackup.createdAt)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontFamily: '"JetBrains Mono", Consolas, monospace',
                    wordBreak: "break-all",
                  }}
                >
                  Checksum: {lastBackup.checksum}
                </Typography>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Todavía no se ha registrado ningún backup manual desde este
                panel.
              </Typography>
            )}
          </Paper>
        </Box>

        <Divider />

        <Paper
          variant="outlined"
          sx={{
            p: 1.35,
            borderRadius: 2.5,
            borderColor: "rgba(148, 163, 184, 0.24)",
          }}
        >
          <Stack spacing={1}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Restaurar desde un backup existente
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.35 }}
              >
                Selecciona el artefacto de backup y confirma explícitamente la
                operación antes de sobrescribir el estado actual de
                SmartEconomat.
              </Typography>
            </Box>

            <TextField
              fullWidth
              size="small"
              label="Archivo de backup seleccionado"
              placeholder="Todavía no se ha seleccionado ningún archivo."
              value={artifactPath}
              slotProps={{ htmlInput: { readOnly: true } }}
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Tooltip
                title="Abre el selector seguro del instalador para elegir un backup local sin dar acceso directo al filesystem desde el renderer."
                arrow
              >
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busy || pickingArtifact}
                    onClick={() => void handlePickRestoreArtifact()}
                  >
                    {pickingArtifact
                      ? "Abriendo selector..."
                      : "Seleccionar archivo..."}
                  </Button>
                </span>
              </Tooltip>

              <Typography variant="caption" color="text.secondary">
                Formatos habituales: .tar.gz en Linux o macOS y .zip en Windows.
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 1.35,
            borderRadius: 2.5,
            borderColor: "rgba(220, 38, 38, 0.3)",
            bgcolor: "rgba(254, 242, 242, 0.55)",
          }}
        >
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Confirmación de restauración
            </Typography>

            <Alert severity="error" variant="outlined" sx={{ py: 0.15 }}>
              La restauración reemplazará la base de datos y los ficheros
              actuales. Usa esta acción solo con un backup verificado y
              reciente.
            </Alert>

            <FormControlLabel
              sx={{ alignItems: "flex-start", m: 0 }}
              control={
                <Checkbox
                  size="small"
                  checked={restoreAcknowledged}
                  onChange={(event) =>
                    setRestoreAcknowledged(event.target.checked)
                  }
                />
              }
              label="Entiendo que esta restauración sobrescribirá el estado actual de SmartEconomat."
            />

            <Tooltip
              title="El botón solo se activa cuando hay un archivo seleccionado y la confirmación destructiva está marcada."
              arrow
            >
              <span>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  disabled={restoreDisabled}
                  onClick={() => void onRestore(artifactPath.trim())}
                  sx={{
                    fontWeight: 800,
                    bgcolor: "#7f1d1d",
                    "&:hover": {
                      bgcolor: "#5f1515",
                    },
                  }}
                >
                  Restaurar Backup Seleccionado
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Paper>
      </Stack>

      <Dialog
        open={backupDialogOpen}
        onClose={() => setBackupDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Destino del backup manual</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Elige si quieres guardar este backup en la ruta por defecto o en
              una carpeta personalizada para esta ejecución.
            </Typography>

            <RadioGroup
              value={backupTargetMode}
              onChange={(event) =>
                setBackupTargetMode(event.target.value as "default" | "custom")
              }
            >
              <FormControlLabel
                value="default"
                control={<Radio />}
                label="Usar carpeta por defecto"
              />
              <FormControlLabel
                value="custom"
                control={<Radio />}
                label="Elegir carpeta solo para esta copia"
              />
            </RadioGroup>

            <TextField
              fullWidth
              label="Carpeta por defecto"
              value={backupDefaultDirectory}
              slotProps={{ htmlInput: { readOnly: true } }}
            />

            {backupTargetMode === "default" ? (
              <Typography variant="caption" color="text.secondary">
                Este backup se guardará en la carpeta por defecto configurada y
                no cambia tu configuración actual.
              </Typography>
            ) : null}

            {backupTargetMode === "custom" ? (
              <>
                <TextField
                  fullWidth
                  label="Carpeta para esta copia"
                  value={customBackupDirectory}
                  onChange={(event) =>
                    setCustomBackupDirectory(event.target.value)
                  }
                />
                <Button
                  variant="outlined"
                  onClick={() => void handlePickBackupDirectory()}
                >
                  Seleccionar carpeta...
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Esta carpeta se usará solo en este backup manual, salvo que
                  marques la opción para guardarla como predeterminada.
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={saveCustomAsDefault}
                      onChange={(event) =>
                        setSaveCustomAsDefault(event.target.checked)
                      }
                    />
                  }
                  label="Guardar esta carpeta como nueva ruta por defecto"
                />
              </>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={backupConfirmDisabled}
            onClick={() => void confirmBackupWithSelectedDirectory()}
          >
            Iniciar backup
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
