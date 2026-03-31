import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Box,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { InventarioItem } from '../../services/inventario.types';
import { updateInventarioItem } from '../../services/inventario.service';
import { useToast } from '../../store/toast.hooks';
import ReportProblemIcon from '@mui/icons-material/ReportProblemOutlined';
import DynamicFormModal, { DynamicField } from '../ui/DynamicFormModal';
import { SelectOption } from '../ui/Select';
import { mermaSchema } from '../../utils/schemas';
import { createMerma } from '../../services/merma.service';
import { MotivoMerma } from '../../services/merma.types';
import { fetchAllProductos } from '../../services/producto.service';

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
  onRefreshItem,
}) => {
  const toast = useToast();
  // Filter items matching the product – memoized to avoid new reference each render
  const relevantItems = React.useMemo(
    () =>
      items.filter(
        (item) => item.productoProveedor?.producto?.id === productoId
      ),
    [items, productoId]
  );
  const productName =
    relevantItems[0]?.productoProveedor?.producto?.nombre || 'Producto';

  // Local state for audit mode edits
  const [editQuantities, setEditQuantities] = useState<Record<string, string>>(
    {}
  );
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [isMermaModalOpen, setIsMermaModalOpen] = useState(false);
  const [isSavingMerma, setIsSavingMerma] = useState(false);
  const [productosOptions, setProductosOptions] = useState<SelectOption[]>([]);

  // Initialize local edit state ONLY when modal opens
  React.useEffect(() => {
    if (open) {
      const initialEdits: Record<string, string> = {};
      relevantItems.forEach((item) => {
        initialEdits[item.id] = String(item.cantidadActual);
      });
      setEditQuantities(initialEdits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productoId]);

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
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al actualizar lote.';
      toast.error(errorMessage);
    } finally {
      setIsSaving({ ...isSaving, [id]: false });
    }
  };

  const handleOpenMerma = async () => {
    if (productosOptions.length === 0) {
      const productos = await fetchAllProductos();
      setProductosOptions(
        productos.map((p) => ({ value: p.id, label: p.nombre }))
      );
    }
    setIsMermaModalOpen(true);
  };

  const handleSaveMerma = async (formData: Record<string, string | number>) => {
    setIsSavingMerma(true);
    try {
      await createMerma({
        productoId: String(formData.productoId),
        cantidad: Number(formData.cantidad),
        motivo: formData.motivo as MotivoMerma,
        notas: formData.notas as string | undefined,
      });
      toast.success('Merma registrada correctamente');
      setIsMermaModalOpen(false);
      onRefreshItem();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al registrar merma';
      toast.error(message);
    } finally {
      setIsSavingMerma(false);
    }
  };

  const dynamicMermaSchema: DynamicField[] = mermaSchema.map((field) => {
    if (field.name === 'productoId') {
      return { ...field, options: productosOptions, defaultValue: productoId };
    }
    return field;
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle component="div">
        <Typography variant="h6" component="h2">
          {mode === 'audit' ? 'Auditar Stock / Conciliar' : 'Detalles de Lotes'}
        </Typography>
        <Typography
          variant="subtitle2"
          component="span"
          color="text.secondary"
          sx={{ display: 'block' }}
        >
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
                  {mode === 'audit' && (
                    <TableCell align="center">Acción</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {relevantItems.map((lote) => (
                  <TableRow key={lote.id}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {lote.id.split('-')[0]}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {lote.productoProveedor?.proveedor?.nombre || '—'}
                    </TableCell>
                    <TableCell>{lote.ubicacion?.nombre || '—'}</TableCell>
                    <TableCell>
                      {lote.fechaCaducidad
                        ? new Date(lote.fechaCaducidad).toLocaleDateString()
                        : '—'}
                    </TableCell>

                    <TableCell align="right">
                      {mode === 'audit' ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editQuantities[lote.id] ?? ''}
                          onChange={(e) =>
                            handleQuantityChange(lote.id, e.target.value)
                          }
                          sx={{ width: '100px' }}
                          inputProps={{
                            min: 0,
                            step: 'any',
                            style: { textAlign: 'right' },
                          }}
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
                          {isSaving[lote.id] ? (
                            <CircularProgress size={20} />
                          ) : (
                            <SaveIcon fontSize="small" />
                          )}
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
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button
          startIcon={<ReportProblemIcon />}
          color="error"
          variant="outlined"
          onClick={handleOpenMerma}
        >
          Reportar Merma
        </Button>
        <Box>
          <Button onClick={onClose} variant="contained" color="primary">
            {mode === 'audit' ? 'Cerrar Auditoría' : 'Cerrar'}
          </Button>
        </Box>
      </DialogActions>

      <DynamicFormModal
        isOpen={isMermaModalOpen}
        onClose={() => setIsMermaModalOpen(false)}
        title="Registrar Merma"
        fields={dynamicMermaSchema}
        onSubmit={handleSaveMerma}
        isSubmitting={isSavingMerma}
        initialData={{ productoId }}
        requireConfirmation={true}
        confirmationMessage="Esta acción descontará el stock del inventario de forma permanente. ¿Estás seguro?"
      />
    </Dialog>
  );
};

export default InventoryDetailModal;
