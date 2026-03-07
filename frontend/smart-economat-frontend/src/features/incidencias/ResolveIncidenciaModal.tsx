import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    CircularProgress,
    Stack
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ResolveIncidenciaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResolve: (observaciones: string) => Promise<void>;
    isLoading: boolean;
    providerName?: string;
}

const ResolveIncidenciaModal: React.FC<ResolveIncidenciaModalProps> = ({
    isOpen,
    onClose,
    onResolve,
    isLoading,
    providerName
}) => {
    const [observaciones, setObservaciones] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!observaciones.trim()) return;
        await onResolve(observaciones);
        setObservaciones('');
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="h6" fontWeight={700}>
                        Marcar como Resuelta
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Describe cómo se ha solucionado la discrepancia con el proveedor{' '}
                            <strong>{providerName || 'desconocido'}</strong>. Esta nota quedará registrada en el historial.
                        </Typography>

                        <TextField
                            autoFocus
                            label="Notas de resolución"
                            placeholder="Ej: Se ha recibido el abono correspondiente, El proveedor enviará el producto faltante mañana..."
                            fullWidth
                            multiline
                            rows={4}
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            required
                            disabled={isLoading}
                            variant="outlined"
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button
                        onClick={onClose}
                        disabled={isLoading}
                        variant="text"
                        color="inherit"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={isLoading || !observaciones.trim()}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                    >
                        {isLoading ? 'Guardando...' : 'Confirmar Resolución'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ResolveIncidenciaModal;
