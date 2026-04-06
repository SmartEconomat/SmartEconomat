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
        <Typography variant="h6">
          Selecciona los pedidos que estás recibiendo
        </Typography>
      </Box>
      {loadingPedidos ? (
        <CircularProgress />
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <Button variant="outlined" size="small" onClick={onSelectAll}>
              Seleccionar Todos
            </Button>
            <Button variant="outlined" size="small" onClick={onDeselectAll}>
              Deseleccionar Todos
            </Button>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Añadir por Proveedor</InputLabel>
              <Select
                value=""
                label="Añadir por Proveedor"
                onChange={onSelectProvider}
              >
                <MenuItem value="" disabled>
                  Selecciona un proveedor
                </MenuItem>
                {uniqueProviders.map((provider) => (
                  <MenuItem key={provider} value={provider}>
                    {provider}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Deseleccionar por Prov.</InputLabel>
              <Select
                value=""
                label="Deseleccionar por Prov."
                onChange={onDeselectProvider}
              >
                <MenuItem value="" disabled>
                  Selecciona un proveedor
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
                    primary={`${pedido.proveedor?.nombre} - Pedido ${formatPedidoListNumber(pedido, 'pedido-proveedor')}`}
                    secondary={`ID: ${pedido.id} | Fecha: ${new Date(pedido.fechaPedido).toLocaleDateString()} | Estado: ${pedido.estado}`}
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
