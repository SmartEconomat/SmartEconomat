import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

interface ConfirmDangerDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmationText: string;
  confirmButtonLabel?: string;
  onCancel: () => void;
  onConfirm: (phrase: string) => Promise<void>;
}

/**
 * Expone la operación "ConfirmDangerDialog" del instalador SmartEconomat.
 * @returns {ConfirmDangerDialogProps} {
 *   open,
 *   title,
 *   description,
 *   confirmationText,
 *   confirmButtonLabel = "Ejecutar limpieza agresiva",
 *   onCancel,
 *   onConfirm,
 * } - Entrada esperada por la función.
 * @returns {import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/jsx-runtime").JSX.Element | null} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function ConfirmDangerDialog({
  open,
  title,
  description,
  confirmationText,
  confirmButtonLabel = "Ejecutar limpieza agresiva",
  onCancel,
  onConfirm,
}: ConfirmDangerDialogProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) {
      setValue("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <Alert severity="error" variant="filled">
            Esta acción es destructiva y eliminará datos. ¿Estás seguro?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Escribe <strong>{confirmationText}</strong> para continuar.
          </Typography>
          <TextField
            fullWidth
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={value.trim().toUpperCase() !== confirmationText}
          onClick={() => void onConfirm(value)}
        >
          {confirmButtonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
