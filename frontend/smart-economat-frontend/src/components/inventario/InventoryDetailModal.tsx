import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    IconButton,
    CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { InventarioItem } from '../../services/inventario.types';
import { updateInventarioItem } from '../../services/inventario.service';
import StatusChip from '../ui/StatusChip';
import { useToast } from '../../store/ToastContext';

interface InventoryDetailModalProps {
    open: boolean;
    mode: 'view' | 'audit';
    productoId: string | null;
    items: InventarioItem[];
    onClose: () => void;
    onRefreshItem: () => void;
}

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({
    open,
    mode,
    productoId,
    items,
    onClose,
    onRefreshItem
}) => {
    const toast = useToast();
    // Filter items matching the product
    const relevantItems = items.filter(
        (item) => item.productoProveedor?.producto?.id === productoId
    );
    const productName = relevantItems[0]?.productoProveedor?.producto?.nombre || 'Producto';

    // Local state for audit mode edits
    const [editQuantities, setEditQuantities] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

    // Initialize local edit state when modal opens or items change
    React.useEffect(() => {
        if (open) {
            const initialEdits: Record<string, string> = {};
            relevantItems.forEach((item) => {
                initialEdits[item.id] = String(item.cantidadActual);
            });
            setEditQuantities(initialEdits);
        }
    }, [open, items]);

    const handleQuantityChange = (id: string, val: string) => {
        setEditQuantities({ ...editQuantities, [id]: val });
    };

    const handleSaveQuantity = async (id: string) => {
        const val = Number(editQuantities[id]);
        if (isNaN(val) || val < 0) {
            toast.error('La cantidad debe ser un número válido ≥ 0.');
            return;
        }

        setIsSaving({ ...isSaving, [id]: true });
        try {
            await updateInventarioItem(id, { cantidadActual: val });
            toast.success('Lote actualizado correctamente.');
            onRefreshItem();
        } catch (err: any) {
            toast.error(err.message || 'Error al actualizar lote.');
        } finally {
            setIsSaving({ ...isSaving, [id]: false });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {mode === 'audit' ? 'Auditar Stock / Conciliar' : 'Detalles de Lotes'}
                <Typography variant="subtitle2" color="text.secondary">
                    {productName}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {relevantItems.length === 0 ? (
                    <Typography color="text.secondary">
                        No se encontraron lotes para este producto.
                    </Typography>
                ) : (
                    <TableContainer component={Paper} elevation={0} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Lote ID</TableCell>
                                    <TableCell>Proveedor</TableCell>
                                    <TableCell>Ubicación</TableCell>
                                    <TableCell>Caducidad</TableCell>
                                    <TableCell align="right">Cantidad</TableCell>
                                    {mode === 'audit' && <TableCell align="center">Acción</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {relevantItems.map((lote) => (
                                    <TableRow key={lote.id}>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                {lote.id.split('-')[0]}...
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{lote.productoProveedor?.proveedor?.nombre || '—'}</TableCell>
                                        <TableCell>{lote.ubicacion?.nombre || '—'}</TableCell>
                                        <TableCell>{lote.fechaCaducidad ? new Date(lote.fechaCaducidad).toLocaleDateString() : '—'}</TableCell>

                                        <TableCell align="right">
                                            {mode === 'audit' ? (
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={editQuantities[lote.id] ?? ''}
                                                    onChange={(e) => handleQuantityChange(lote.id, e.target.value)}
                                                    sx={{ width: '100px' }}
                                                    inputProps={{ min: 0, step: 'any', style: { textAlign: 'right' } }}
                                                />
                                            ) : (
                                                <Typography variant="body2" fontWeight={500}>
                                                    {Number(lote.cantidadActual).toFixed(2)}
                                                </Typography>
                                            )}
                                        </TableCell>

                                        {mode === 'audit' && (
                                            <TableCell align="center">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleSaveQuantity(lote.id)}
                                                    disabled={isSaving[lote.id]}
                                                >
                                                    {isSaving[lote.id] ? <CircularProgress size={20} /> : <SaveIcon fontSize="small" />}
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    {mode === 'audit' ? 'Cerrar Auditoría' : 'Cerrar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InventoryDetailModal;
