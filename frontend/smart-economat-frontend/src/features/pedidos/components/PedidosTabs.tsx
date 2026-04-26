import React from 'react';
import { Box, Tab, Tabs, alpha, useTheme } from '@mui/material';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import ShoppingCartCheckoutOutlinedIcon from '@mui/icons-material/ShoppingCartCheckoutOutlined';
import { PedidosTabValue } from '../types/pedidos-ui.types';

interface PedidosTabsProps {
  value: PedidosTabValue;
  onChange: (value: PedidosTabValue) => void;
}

const tabOptions: Array<{
  value: PedidosTabValue;
  label: string;
  icon: React.ReactElement;
}> = [
  {
    value: 0,
    label: 'MIS PEDIDOS',
    icon: <AssignmentTurnedInOutlinedIcon sx={{ fontSize: 20 }} />,
  },
  {
    value: 1,
    label: 'PEDIDOS',
    icon: <FormatListBulletedOutlinedIcon sx={{ fontSize: 20 }} />,
  },
  {
    value: 2,
    label: 'COMPRAS',
    icon: <ShoppingCartCheckoutOutlinedIcon sx={{ fontSize: 20 }} />,
  },
];

/**
 * Documentación en español.
 */
const PedidosTabs: React.FC<PedidosTabsProps> = ({ value, onChange }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'inline-flex',
          p: 0.5,
          borderRadius: '12px',
          bgcolor: alpha(theme.palette.divider, 0.05),
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        }}
      >
        <Tabs
          value={value}
          onChange={(_, newValue: PedidosTabValue) => onChange(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 42,
            '& .MuiTabs-indicator': {
              height: '100%',
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
              zIndex: 0,
            },
            '& .MuiTabs-flexContainer': {
              position: 'relative',
              zIndex: 1,
            },
          }}
        >
          {tabOptions.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              icon={tab.icon}
              label={tab.label}
              disableRipple
              sx={{
                minHeight: 42,
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

export default PedidosTabs;
