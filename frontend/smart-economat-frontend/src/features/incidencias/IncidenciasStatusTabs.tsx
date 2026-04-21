import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { EstadoIncidencia } from '../../services/incidencia.types';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <Box sx={{ mb: 2 }}>
      <Tabs
        value={value}
        onChange={(_, newValue: IncidenciasResolucionTab) => onChange(newValue)}
      >
        <Tab value="abiertas" label={t('incidenciasStatusTabs.open')} />
        <Tab value="cerradas" label={t('incidenciasStatusTabs.closed')} />
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
          <Tab value="todas" label={t('incidenciasStatusTabs.all')} />
          <Tab
            value={EstadoIncidencia.RESUELTA}
            label={t('incidenciasStatusTabs.resolved')}
          />
          <Tab
            value={EstadoIncidencia.CANCELADA}
            label={t('incidenciasStatusTabs.cancelled')}
          />
          <Tab
            value={EstadoIncidencia.INVALIDA}
            label={t('incidenciasStatusTabs.invalid')}
          />
        </Tabs>
      )}
    </Box>
  );
};

export default IncidenciasStatusTabs;
