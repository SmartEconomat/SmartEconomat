import React from 'react';
import { Tab, Tabs } from '@mui/material';

export type IncidenciasResolucionTab = 'por_resolver' | 'resueltas';

interface IncidenciasStatusTabsProps {
  value: IncidenciasResolucionTab;
  onChange: (value: IncidenciasResolucionTab) => void;
}

const IncidenciasStatusTabs: React.FC<IncidenciasStatusTabsProps> = ({
  value,
  onChange,
}) => {
  return (
    <Tabs
      value={value}
      onChange={(_, newValue: IncidenciasResolucionTab) => onChange(newValue)}
      sx={{ mb: 2 }}
    >
      <Tab value="por_resolver" label="Por resolver" />
      <Tab value="resueltas" label="Resueltas" />
    </Tabs>
  );
};

export default IncidenciasStatusTabs;
