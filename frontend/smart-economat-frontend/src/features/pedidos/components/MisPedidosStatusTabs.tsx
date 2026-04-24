import React from 'react';
import { Tabs, Tab, Box, alpha, useTheme } from '@mui/material';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { MisPedidosStatusFilter } from '../types/pedidos-ui.types';

interface MisPedidosStatusTabsProps {
  value: MisPedidosStatusFilter;
  onChange: (value: MisPedidosStatusFilter) => void;
}

/**
 * @description Tab bar for filtering the user's own pedidos by status (pendientes / en proceso / finalizados).
 * @param props.value - Currently selected status filter
 * @param props.onChange - Callback invoked with the newly selected status when the user switches tabs
 * @returns Styled MUI Tabs component with three status options
 */
const MisPedidosStatusTabs: React.FC<MisPedidosStatusTabsProps> = ({
  value,
  onChange,
}) => {
  const theme = useTheme();

  const options = [
    {
      value: 'pendientes' as MisPedidosStatusFilter,
      label: 'PENDIENTES',
      icon: <WatchLaterOutlinedIcon sx={{ fontSize: 15 }} />,
    },
    {
      value: 'activos' as MisPedidosStatusFilter,
      label: 'EN PROCESO',
      icon: <AutorenewOutlinedIcon sx={{ fontSize: 15 }} />,
    },
    {
      value: 'finalizados' as MisPedidosStatusFilter,
      label: 'FINALIZADOS',
      icon: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 15 }} />,
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
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
          onChange={(_, newValue: MisPedidosStatusFilter) => onChange(newValue)}
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
          {options.map((option) => (
            <Tab
              key={option.value}
              value={option.value}
              icon={option.icon}
              label={option.label}
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
          ))}
        </Tabs>
      </Box>
    </Box>
  );
};

export default MisPedidosStatusTabs;
