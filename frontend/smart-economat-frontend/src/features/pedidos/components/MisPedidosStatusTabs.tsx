import React from 'react';
import { Tabs, Tab, Box, alpha, useTheme } from '@mui/material';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { MisPedidosStatusFilter } from '../types/pedidos-ui.types';
import { useTranslation } from 'react-i18next';

interface MisPedidosStatusTabsProps {
  value: MisPedidosStatusFilter;
  onChange: (value: MisPedidosStatusFilter) => void;
}

const MisPedidosStatusTabs: React.FC<MisPedidosStatusTabsProps> = ({
  value,
  onChange,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const options = [
    {
      value: 'pendientes' as MisPedidosStatusFilter,
      label: t('pedidos.statusTabs.pending'),
      icon: <WatchLaterOutlinedIcon sx={{ fontSize: 20 }} />,
    },
    {
      value: 'activos' as MisPedidosStatusFilter,
      label: t('pedidos.statusTabs.active'),
      icon: <AutorenewOutlinedIcon sx={{ fontSize: 20 }} />,
    },
    {
      value: 'finalizados' as MisPedidosStatusFilter,
      label: t('pedidos.statusTabs.finished'),
      icon: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 20 }} />,
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'inline-flex',
          p: 0.5,
          borderRadius: '12px',
          bgcolor: alpha(theme.palette.divider, 0.05),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Tabs
          value={value}
          onChange={(_, newValue: MisPedidosStatusFilter) => onChange(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': {
              height: '100%',
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0px 2px 4px rgba(0,0,0,0.08)',
              zIndex: 0,
            },
            '& .MuiTabs-flexContainer': {
              position: 'relative',
              zIndex: 1,
            },
          }}
        >
          {options.map((option) => (
            <Tab
              key={option.value}
              value={option.value}
              icon={option.icon}
              iconPosition="start"
              label={option.label}
              disableRipple
              sx={{
                minHeight: 40,
                px: 2.5,
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: theme.palette.text.secondary,
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: alpha(theme.palette.divider, 0.05),
                },
              }}
            />
          ))}
        </Tabs>
      </Box>
    </Box>
  );
};

export default MisPedidosStatusTabs;
