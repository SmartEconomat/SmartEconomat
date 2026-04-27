import React from 'react';
import { useTranslation } from 'react-i18next';
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
 * Documentación en español.
 */
export type DetailType =
  | 'movimientos'
  | 'inventarios'
  | 'nuevos_productos'
  | null;

/**
 * Documentación en español.
 */
interface DetailModalProps {
  /**
   * Documentación en español.
   */
  open: boolean;
  /**
   * Documentación en español.
   */
  type: DetailType;
  /**
   * Documentación en español.
   */
  resultado: RecepcionResultado | null;
  /**
   * Documentación en español.
   */
  onClose: () => void;
}

/**
 * Documentación en español.
 */
const DetailModal: React.FC<DetailModalProps> = ({
  open,
  type,
  resultado,
  onClose,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!resultado) return null;

  const renderContent = () => {
    switch (type) {
      case 'movimientos':
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('recepcionDetail.movementsRegistered', {
                count: resultado.movimientosGenerados,
              })}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('recepcionDetail.movementsNote')}
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
                {t('recepcionDetail.viewHistory')}
              </Button>
            </Box>
          </Box>
        );
      case 'inventarios':
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('recepcionDetail.entriesRegistered', {
                count: resultado.inventariosCreados,
              })}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('recepcionDetail.entriesNote')}
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
                {t('recepcionDetail.viewInventory')}
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
              {t('recepcionDetail.unknownProductsAdded', {
                count: resultado.productosCreados.length,
              })}
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
                        : t('recepcionDetail.noCode')
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
          <SwapHorizIcon /> {t('recepcionDetail.movementsTitle')}
        </Box>
      );
    if (type === 'inventarios')
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon /> {t('recepcionDetail.entriesTitle')}
        </Box>
      );
    if (type === 'nuevos_productos') return t('recepcionDetail.createdTitle');
    return t('recepcionDetail.detailTitle');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent dividers>{renderContent()}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          {t('recepcionDetail.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailModal;
