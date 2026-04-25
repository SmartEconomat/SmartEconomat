import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  Checkbox,
  ListItemText,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Pedido, EstadoPedido } from '../../services/pedido.types';
import { formatPedidoListNumber } from '../../features/pedidos/utils/pedidoFormatters';

interface PasoSeleccionPedidosProps {
  loadingPedidos: boolean;
  pedidosDisponibles: Pedido[];
  pedidosSeleccionadosIds: string[];
  uniqueProviders: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectProvider: (e: SelectChangeEvent<unknown>) => void;
  onDeselectProvider: (e: SelectChangeEvent<unknown>) => void;
  onTogglePedido: (pedido: Pedido) => void;
}

const PasoSeleccionPedidos: React.FC<PasoSeleccionPedidosProps> = ({
  loadingPedidos,
  pedidosDisponibles,
  pedidosSeleccionadosIds,
  uniqueProviders,
  onSelectAll,
  onDeselectAll,
  onSelectProvider,
  onDeselectProvider,
  onTogglePedido,
}) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">{t('recepcion.seleccion.titulo')}</Typography>
      </Box>
      {loadingPedidos ? (
        <CircularProgress />
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <Button variant="outlined" size="small" onClick={onSelectAll}>
              {t('comun.seleccionarTodos')}
            </Button>
            <Button variant="outlined" size="small" onClick={onDeselectAll}>
              {t('comun.deseleccionarTodos')}
            </Button>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>
                {t('recepcion.seleccion.anadirProveedor')}
              </InputLabel>
              <Select
                value=""
                label={t('recepcion.seleccion.anadirProveedor')}
                onChange={onSelectProvider}
              >
                <MenuItem value="" disabled>
                  {t('recepcion.seleccion.seleccionaProveedor')}
                </MenuItem>
                {uniqueProviders.map((provider) => (
                  <MenuItem key={provider} value={provider}>
                    {provider}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>
                {t('recepcion.seleccion.deseleccionarProveedor')}
              </InputLabel>
              <Select
                value=""
                label={t('recepcion.seleccion.deseleccionarProveedor')}
                onChange={onDeselectProvider}
              >
                <MenuItem value="" disabled>
                  {t('recepcion.seleccion.seleccionaProveedor')}
                </MenuItem>
                {uniqueProviders.map((provider) => (
                  <MenuItem key={provider} value={provider}>
                    {provider}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <List
            sx={{
              width: '100%',
              bgcolor: 'background.paper',
              maxHeight: '55vh',
              overflow: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            {pedidosDisponibles.map((pedido) => (
              <ListItem key={pedido.id} divider disablePadding>
                <ListItemButton
                  onClick={() => onTogglePedido(pedido)}
                  selected={pedidosSeleccionadosIds.includes(pedido.id)}
                >
                  <Checkbox
                    checked={pedidosSeleccionadosIds.includes(pedido.id)}
                  />
                  <ListItemText
                    primary={`${pedido.proveedor?.nombre} - ${t('recepcion.seleccion.pedido')} ${formatPedidoListNumber(pedido, 'pedido-proveedor')}`}
                    secondary={`${t('comun.id')}${pedido.id} | Fecha: ${new Date(pedido.fechaPedido).toLocaleDateString()} | ${t('comun.estado')}: ${pedido.estado}`}
                  />
                  <Chip
                    label={pedido.estado}
                    color={
                      pedido.estado === EstadoPedido.POR_RECEPCIONAR
                        ? 'primary'
                        : 'warning'
                    }
                    size="small"
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default PasoSeleccionPedidos;
