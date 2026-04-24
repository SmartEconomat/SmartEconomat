import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { EstadoIncidencia } from '../../services/incidencia.types';
import { useTranslation } from 'react-i18next';

/**
 * Union type representing the top-level resolution tab selection.
 * - `'abiertas'` — open (unresolved) incidencias.
 * - `'cerradas'` — closed (resolved / cancelled / invalid) incidencias.
 */
export type IncidenciasResolucionTab = 'abiertas' | 'cerradas';

/**
 * Union type for the secondary tab when the "cerradas" top-level tab is active.
 * - `'todas'` — all closed incidencias.
 * - {@link EstadoIncidencia.RESUELTA} — only resolved.
 * - {@link EstadoIncidencia.CANCELADA} — only cancelled.
 * - {@link EstadoIncidencia.INVALIDA} — only invalid.
 */
export type IncidenciasCerradasTab =
  | 'todas'
  | EstadoIncidencia.RESUELTA
  | EstadoIncidencia.CANCELADA
  | EstadoIncidencia.INVALIDA;

/**
 * Props for the {@link IncidenciasStatusTabs} component.
 */
interface IncidenciasStatusTabsProps {
  /** Currently selected top-level resolution tab. */
  value: IncidenciasResolucionTab;
  /** Callback invoked when the top-level tab changes. */
  onChange: (value: IncidenciasResolucionTab) => void;
  /** Currently selected secondary (closed) tab. */
  closedValue: IncidenciasCerradasTab;
  /** Callback invoked when the secondary (closed) tab changes. */
  onClosedChange: (value: IncidenciasCerradasTab) => void;
}

/**
 * Two-level tab bar for filtering incidencias by resolution status.
 * The secondary tab row is only rendered when the "cerradas" top-level tab is
 * active, allowing further filtering by specific closed state.
 *
 * @param {IncidenciasStatusTabsProps} props - Component props.
 * @returns JSX rendered tab bar.
 * @example
 * <IncidenciasStatusTabs
 *   value={tab}
 *   onChange={setTab}
 *   closedValue={closedTab}
 *   onClosedChange={setClosedTab}
 * />
 */
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
        <Tab value="abiertas" label={t('incidencias.tabs.abiertas')} />
        <Tab value="cerradas" label={t('incidencias.tabs.cerradas')} />
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
          <Tab value="todas" label={t('incidencias.tabs.todas')} />
          <Tab
            value={EstadoIncidencia.RESUELTA}
            label={t('incidencias.estados.resuelta')}
          />
          <Tab
            value={EstadoIncidencia.CANCELADA}
            label={t('incidencias.estados.cancelada')}
          />
          <Tab
            value={EstadoIncidencia.INVALIDA}
            label={t('incidencias.estados.invalida')}
          />
        </Tabs>
      )}
    </Box>
  );
};

export default IncidenciasStatusTabs;
