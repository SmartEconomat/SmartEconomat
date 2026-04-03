import React from 'react';
import { Tabs, Tab } from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { PedidosTabValue } from '../types/pedidos-ui.types';

interface PedidosTabsProps {
  value: PedidosTabValue;
  onChange: (value: PedidosTabValue) => void;
}

const PedidosTabs: React.FC<PedidosTabsProps> = ({ value, onChange }) => (
  <Tabs
    value={value}
    onChange={(_, newValue: PedidosTabValue) => onChange(newValue)}
    indicatorColor="primary"
    textColor="primary"
    variant="fullWidth"
    sx={{
      mb: 3,
      borderBottom: 1,
      borderColor: 'divider',
      '& .MuiTab-root': {
        fontWeight: 'bold',
        minHeight: 64,
      },
    }}
  >
    <Tab icon={<ShoppingBagIcon />} iconPosition="start" label="MIS PEDIDOS" />
    <Tab icon={<ListAltIcon />} iconPosition="start" label="PEDIDOS" />
    <Tab icon={<ShoppingCartIcon />} iconPosition="start" label="COMPRAS" />
  </Tabs>
);

export default PedidosTabs;
