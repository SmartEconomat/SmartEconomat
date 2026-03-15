import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { EU_ALLERGENS } from '../../utils/constants';

export interface AllergenSelectorProps {
  value: string[];
  onChange: (newValue: string[]) => void;
  disabled?: boolean;
}

const AllergenSelector: React.FC<AllergenSelectorProps> = ({
  value = [],
  onChange,
  disabled,
}) => {
  const handleToggle = (id: string) => {
    if (disabled) return;
    const currentIndex = value.indexOf(id);
    const newSelected = [...value];

    if (currentIndex === -1) {
      newSelected.push(id);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    onChange(newSelected);
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Información de Alérgenos
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {EU_ALLERGENS.map((allergen) => {
          const isSelected = value.includes(allergen.id);
          return (
            <Box
              key={allergen.id}
              onClick={() => handleToggle(allergen.id)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1,
                width: {
                  xs: 'calc(50% - 8px)',
                  sm: 'calc(33.333% - 8px)',
                  md: 'calc(33.333% - 8px)',
                  lg: 'calc(25% - 8px)',
                },
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                borderRadius: 1,
                bgcolor: isSelected ? 'primary.light' : 'background.paper',
                color: isSelected ? 'primary.contrastText' : 'text.primary',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: disabled
                    ? undefined
                    : isSelected
                      ? 'primary.light'
                      : 'action.hover',
                },
              }}
            >
              <Tooltip title={allergen.label}>
                <Box sx={{ display: 'flex', mb: 0.5 }}>{allergen.icon}</Box>
              </Tooltip>
              <Typography
                variant="caption"
                align="center"
                sx={{
                  lineHeight: 1.1,
                  fontSize: '0.65rem',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                }}
              >
                {allergen.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default AllergenSelector;
