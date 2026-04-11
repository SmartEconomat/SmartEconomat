import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { EstadoIncidencia } from '../../services/incidencia.types';

export type IncidenciasResolucionTab = 'abiertas' | 'cerradas';
export type IncidenciasCerradasTab =
  | 'todas'
  | EstadoIncidencia.RESUELTA
  | EstadoIncidencia.CANCELADA
  | EstadoIncidencia.INVALIDA;

interface IncidenciasStatusTabsProps {
  value: IncidenciasResolucionTab;
  onChange: (value: IncidenciasResolucionTab) => void;
  closedValue: IncidenciasCerradasTab;
  onClosedChange: (value: IncidenciasCerradasTab) => void;
}

const IncidenciasStatusTabs: React.FC<IncidenciasStatusTabsProps> = ({
  value,
  onChange,
  closedValue,
  onClosedChange,
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Tabs
        value={value}
        onChange={(_, newValue: IncidenciasResolucionTab) => onChange(newValue)}
      >
        <Tab value="abiertas" label="Abiertas" />
        <Tab value="cerradas" label="Cerradas" />
      </Tabs>

      {value === 'cerradas' && (
        <Tabs
          value={closedValue}
          onChange={(_, newValue: IncidenciasCerradasTab) =>
            onClosedChange(newValue)
          }
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ mt: 1 }}
        >
          <Tab value="todas" label="Todas" />
          <Tab value={EstadoIncidencia.RESUELTA} label="Resueltas" />
          <Tab value={EstadoIncidencia.CANCELADA} label="Canceladas" />
          <Tab value={EstadoIncidencia.INVALIDA} label="Inválidas" />
        </Tabs>
      )}
    </Box>
  );
};

export default IncidenciasStatusTabs;
