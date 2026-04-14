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
  onCancel: () => void;
  onConfirm: (phrase: string) => Promise<void>;
}

export function ConfirmDangerDialog({
  open,
  title,
  description,
  confirmationText,
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
          Ejecutar limpieza agresiva
        </Button>
      </DialogActions>
    </Dialog>
  );
}
