import React from 'react';
import { useTranslation } from 'react-i18next';
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
          ? t('newProduct.titleKnown')
          : t('newProduct.titleUnknown')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {isAutoFilled
            ? t('newProduct.descKnown')
            : t('newProduct.descUnknown')}
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
            label={t('newProduct.nameLabel')}
            value={modalData.nombre}
            onChange={(e) =>
              setModalData({ ...modalData, nombre: e.target.value })
            }
            fullWidth
          />
          {modalData.codigoBarras && (
            <TextField
              label={t('newProduct.barcodeLabel')}
              value={modalData.codigoBarras}
              disabled
              fullWidth
              size="small"
              variant="filled"
            />
          )}
          <TextField
            label={t('newProduct.brandLabel')}
            value={modalData.marca}
            onChange={(e) =>
              setModalData({ ...modalData, marca: e.target.value })
            }
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('newProduct.unitLabel')}
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
              label={t('newProduct.categoryLabel')}
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
            label={t('newProduct.contentLabel')}
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
        <Button onClick={onClose}>{t('newProduct.cancel')}</Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={!modalData.nombre}
        >
          {t('newProduct.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewProductModal;
