import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import type { BackupMetadata } from "@shared/contracts";

interface BackupRestorePanelProps {
  lastBackup: BackupMetadata | null;
  busy: boolean;
  onBackup: (label: string) => Promise<void>;
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

export function BackupRestorePanel({
  lastBackup,
  busy,
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

  const restoreDisabled =
    busy ||
    pickingArtifact ||
    artifactPath.trim().length === 0 ||
    !restoreAcknowledged;

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
        p: 2.25,
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

      <Paper
        variant="outlined"
        sx={{
          p: 1.6,
          borderRadius: 2.5,
          bgcolor: "rgba(15, 118, 110, 0.04)",
          borderColor: "rgba(15, 118, 110, 0.16)",
        }}
      >
        <Stack spacing={1.2}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Crear backup manual
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.45 }}
            >
              Genera una copia inmediata de la base de datos y de los ficheros
              de la instalación actual para poder volver atrás con seguridad.
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Etiqueta del backup"
            placeholder="Nombre o etiqueta del backup (ej: backup-20260413)"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />

          <Typography variant="caption" color="text.secondary">
            Si dejas la etiqueta vacía, el instalador utilizará el nombre manual
            automáticamente.
          </Typography>

          <Tooltip
            title="Crea la copia y actualiza el resumen del último backup disponible en este panel."
            arrow
          >
            <span>
              <Button
                fullWidth
                variant="contained"
                disabled={busy || pickingArtifact}
                onClick={() => void onBackup(label)}
                sx={{ fontWeight: 800 }}
              >
                Crear Backup Ahora
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          mt: 1.5,
          p: 1.6,
          borderRadius: 2.5,
          borderStyle: lastBackup ? "solid" : "dashed",
          borderColor: "rgba(148, 163, 184, 0.28)",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
          Último backup disponible
        </Typography>

        {lastBackup ? (
          <Stack spacing={0.85}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {lastBackup.archiveName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generado el {formatBackupDate(lastBackup.createdAt)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: '"JetBrains Mono", Consolas, monospace' }}
            >
              Checksum: {lastBackup.checksum}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Todavía no se ha registrado ningún backup manual desde este panel.
          </Typography>
        )}
      </Paper>

      <Divider sx={{ my: 1.75 }} />

      <Stack spacing={1.2}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Restaurar desde un backup existente
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
            Selecciona el artefacto de backup y confirma explícitamente la
            operación antes de sobrescribir el estado actual de SmartEconomat.
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Archivo de backup seleccionado"
          placeholder="Todavía no se ha seleccionado ningún archivo."
          value={artifactPath}
          slotProps={{ htmlInput: { readOnly: true } }}
        />

        <Tooltip
          title="Abre el selector seguro del instalador para elegir un backup local sin dar acceso directo al filesystem desde el renderer."
          arrow
        >
          <span>
            <Button
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

        <Alert severity="error" variant="outlined">
          La restauración reemplazará la base de datos y los ficheros actuales.
          Usa esta acción solo con un backup verificado y reciente.
        </Alert>

        <FormControlLabel
          control={
            <Checkbox
              checked={restoreAcknowledged}
              onChange={(event) => setRestoreAcknowledged(event.target.checked)}
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
  );
}
