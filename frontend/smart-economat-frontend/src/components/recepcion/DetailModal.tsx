import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RecepcionResultado } from '../../services/recepcion.types';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import InventoryIcon from '@mui/icons-material/Inventory';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

/**
 * The category of detail information to display inside {@link DetailModal}.
 * - `'movimientos'` — warehouse movement summary with a link to the movement log.
 * - `'inventarios'` — physical inventory entries with a link to the inventory module.
 * - `'nuevos_productos'` — list of spontaneously created products from unknown barcodes.
 */
export type DetailType =
  | 'movimientos'
  | 'inventarios'
  | 'nuevos_productos'
  | null;

/**
 * Props for the recepcion {@link DetailModal} component.
 */
interface DetailModalProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Which category of detail to display. */
  type: DetailType;
  /** Reception result data used to populate the dialog content. */
  resultado: RecepcionResultado | null;
  /** Callback to close the dialog. */
  onClose: () => void;
}

/**
 * Detail dialog for a completed goods reception.
 *
 * Renders contextual information about a reception result depending on the
 * `type` prop: warehouse movements, new inventory entries, or spontaneously
 * created products. Returns `null` when `resultado` is not provided.
 *
 * @param props - See {@link DetailModalProps}.
 * @returns JSX element with a MUI `Dialog`, or `null` if `resultado` is absent.
 * @example
 * <DetailModal
 *   open={isOpen}
 *   type="movimientos"
 *   resultado={recepcionResultado}
 *   onClose={handleClose}
 * />
 */
const DetailModal: React.FC<DetailModalProps> = ({
  open,
  type,
  resultado,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!resultado) return null;

  const renderContent = () => {
    switch (type) {
      case 'movimientos':
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Se registraron <strong>{resultado.movimientosGenerados}</strong>{' '}
              movimientos de almacén de tipo Entrada.
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              * El detalle individual de cada movimiento está consolidado en el
              historial general del módulo de Inventario.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SwapHorizIcon />}
                onClick={() => {
                  onClose();
                  navigate('/inventario/movimientos');
                }}
              >
                Ver Historial de Movimientos
              </Button>
            </Box>
          </Box>
        );
      case 'inventarios':
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Se registraron <strong>{resultado.inventariosCreados}</strong>{' '}
              nuevas entradas en el inventario físico.
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              * Las nuevas unidades ya están disponibles para su consumo y
              asignación en órdenes de trabajo.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="success"
                startIcon={<InventoryIcon />}
                onClick={() => {
                  onClose();
                  navigate('/inventario');
                }}
              >
                Ver Inventario
              </Button>
            </Box>
          </Box>
        );
      case 'nuevos_productos':
        return (
          <Box>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FiberNewIcon color="primary" />{' '}
              {resultado.productosCreados.length} Productos Desconocidos
              Añadidos
            </Typography>
            <List
              sx={{
                width: '100%',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              {resultado.productosCreados.map((prod) => (
                <ListItem key={prod.id} divider>
                  <ListItemText
                    primary={prod.nombre}
                    secondary={
                      prod.codigoBarras
                        ? `EAN/ID: ${prod.codigoBarras}`
                        : 'Sin código asignado'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    if (type === 'movimientos')
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHorizIcon /> Detalles de Movimientos
        </Box>
      );
    if (type === 'inventarios')
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon /> Entradas de Inventario
        </Box>
      );
    if (type === 'nuevos_productos') return 'Productos Creados (Espontáneos)';
    return 'Detalle de Recepción';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent dividers>{renderContent()}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailModal;
