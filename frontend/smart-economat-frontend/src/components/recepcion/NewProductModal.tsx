import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CategoriaProducto, UnidadMedida } from '../../services/producto.types';

export interface ModalProductData {
  nombre: string;
  marca: string;
  unidad: UnidadMedida;
  tipo: CategoriaProducto;
  contenido: number;
  codigoBarras: string;
}

interface NewProductModalProps {
  open: boolean;
  onClose: () => void;
  modalData: ModalProductData;
  setModalData: (data: ModalProductData) => void;
  onConfirm: () => void;
}

/**
 * Modal dialog for adding a new product during the reception flow.
 *
 * Two modes are supported:
 * - **Auto-filled** (product found in the global catalogue): pre-populated
 *   fields are shown for the user to review before confirming.
 * - **Unknown product**: empty form where the user enters the basic product
 *   details manually.
 *
 * @param props.open - Whether the modal is visible.
 * @param props.onClose - Callback invoked when the user dismisses the modal.
 * @param props.modalData - Current form field values.
 * @param props.setModalData - Setter to update individual form fields.
 * @param props.onConfirm - Callback invoked when the user confirms the addition.
 */
const NewProductModal: React.FC<NewProductModalProps> = ({
  open,
  onClose,
  modalData,
  setModalData,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const isAutoFilled = modalData.nombre.trim() !== '';

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {isAutoFilled
          ? t('recepcion.nuevoProducto.tituloEncontrado')
          : t('recepcion.nuevoProducto.tituloDesconocido')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {isAutoFilled
            ? t('recepcion.nuevoProducto.infoEncontrado')
            : t('recepcion.nuevoProducto.infoDesconocido')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 400,
          }}
        >
          <TextField
            label={t('recepcion.nuevoProducto.nombre')}
            value={modalData.nombre}
            onChange={(e) =>
              setModalData({ ...modalData, nombre: e.target.value })
            }
            fullWidth
          />
          {modalData.codigoBarras && (
            <TextField
              label={t('recepcion.nuevoProducto.codigoBarras')}
              value={modalData.codigoBarras}
              disabled
              fullWidth
              size="small"
              variant="filled"
            />
          )}
          <TextField
            label={t('recepcion.nuevoProducto.marca')}
            value={modalData.marca}
            onChange={(e) =>
              setModalData({ ...modalData, marca: e.target.value })
            }
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('comun.unidad')}
              select
              value={modalData.unidad}
              onChange={(e) =>
                setModalData({
                  ...modalData,
                  unidad: e.target.value as UnidadMedida,
                })
              }
              fullWidth
            >
              {Object.values(UnidadMedida).map((u) => (
                <MenuItem key={u} value={u}>
                  {u.toUpperCase()}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('recepcion.nuevoProducto.categoria')}
              select
              value={modalData.tipo}
              onChange={(e) =>
                setModalData({
                  ...modalData,
                  tipo: e.target.value as CategoriaProducto,
                })
              }
              fullWidth
            >
              {Object.values(CategoriaProducto).map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField
            label={t('recepcion.nuevoProducto.contenido')}
            type="number"
            InputProps={{ inputProps: { min: 0 } }}
            value={modalData.contenido}
            onChange={(e) =>
              setModalData({
                ...modalData,
                contenido: Math.max(0, Number(e.target.value) || 0),
              })
            }
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('comun.cancelar')}</Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={!modalData.nombre}
        >
          {t('recepcion.nuevoProducto.confirmar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewProductModal;
