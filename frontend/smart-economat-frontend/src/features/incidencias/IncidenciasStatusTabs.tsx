import { Box, alpha, useTheme, Tab, Tabs } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

/** Alias público (IncidenciasResolucionTab) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type IncidenciasResolucionTab = 'por_resolver' | 'resueltas';

interface IncidenciasStatusTabsProps {
  value: IncidenciasResolucionTab;
  onChange: (value: IncidenciasResolucionTab) => void;
}

const IncidenciasStatusTabs: React.FC<IncidenciasStatusTabsProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 30,
          p: '2px',
          borderRadius: '10px',
          bgcolor: alpha(theme.palette.divider, 0.05),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Tabs
          value={value}
          onChange={(_, newValue: IncidenciasResolucionTab) =>
            onChange(newValue)
          }
          centered
          sx={{
            minHeight: 26,
            height: 26,
            '& .MuiTabs-indicator': {
              height: 26,
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0px 2px 4px rgba(0,0,0,0.08)',
              zIndex: 0,
            },
            '& .MuiTabs-flexContainer': {
              position: 'relative',
              zIndex: 1,
              height: '100%',
              alignItems: 'center',
            },
          }}
        >
          <Tab
            value="por_resolver"
            label={t('incidencias.tabs.porResolver')}
            icon={<PendingActionsIcon sx={{ fontSize: 16 }} />}
            iconPosition="start"
            disableRipple
            sx={{
              minWidth: 0,
              minHeight: '26px !important',
              height: '26px !important',
              padding: '0px !important',
              px: '12px !important',
              borderRadius: '8px',
              lineHeight: 1,
              fontSize: '0.65rem',
              fontWeight: 800,
              gap: 0.5,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
              '&:hover:not(.Mui-selected)': {
                bgcolor: alpha(theme.palette.divider, 0.05),
              },
            }}
          />
          <Tab
            value="resueltas"
            label={t('incidencias.tabs.resueltas')}
            icon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
            iconPosition="start"
            disableRipple
            sx={{
              minWidth: 0,
              minHeight: '26px !important',
              height: '26px !important',
              padding: '0px !important',
              px: '12px !important',
              borderRadius: '8px',
              lineHeight: 1,
              fontSize: '0.65rem',
              fontWeight: 800,
              gap: 0.5,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
              '&:hover:not(.Mui-selected)': {
                bgcolor: alpha(theme.palette.divider, 0.05),
              },
            }}
          />
        </Tabs>
      </Box>
    </Box>
  );
};

export default IncidenciasStatusTabs;
