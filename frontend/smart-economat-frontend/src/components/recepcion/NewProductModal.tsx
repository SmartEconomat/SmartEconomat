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
import { CategoriaProducto, UnidadMedida } from '../../services/producto.types';

export interface ModalProductData {
  nombre: string;
  marca: string;
  unidad: UnidadMedida;
  tipo: CategoriaProducto;
  contenido: number;
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
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Añadir Producto Desconocido</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Este producto no figura en el catálogo ni en los pedidos
          seleccionados.
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
            label="Nombre del Producto"
            value={modalData.nombre}
            onChange={(e) =>
              setModalData({ ...modalData, nombre: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Marca"
            value={modalData.marca}
            onChange={(e) =>
              setModalData({ ...modalData, marca: e.target.value })
            }
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Unidad"
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
              label="Categoría"
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
            label="Contenido (Neto)"
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
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={!modalData.nombre}
        >
          Confirmar y Añadir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewProductModal;
