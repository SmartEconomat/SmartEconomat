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
    <Tab label="Pedidos Pendientes" />
    <Tab label="Historial (En Proceso / Finalizados)" />
    <Tab label="Lotes de Compra" />
  </Tabs>
);

export default PedidosTabs;
