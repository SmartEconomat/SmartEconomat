import React from 'react';
import { Tabs, Tab } from '@mui/material';
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
    sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
  >
    <Tab label="Mis Pedidos" />
    <Tab label="Pedidos" />
    <Tab label="Compras" />
  </Tabs>
);

export default PedidosTabs;
