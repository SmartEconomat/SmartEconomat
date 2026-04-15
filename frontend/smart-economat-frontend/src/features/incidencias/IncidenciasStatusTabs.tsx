import React from 'react';
import { Tab, Tabs } from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

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
      <Tab
        value="por_resolver"
        label="Por resolver"
        icon={<PendingActionsIcon />}
      />
      <Tab
        value="resueltas"
        label="Resueltas"
        icon={<CheckCircleOutlineIcon />}
      />
    </Tabs>
  );
};

export default IncidenciasStatusTabs;
