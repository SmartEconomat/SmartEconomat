import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

import EggIcon from '@mui/icons-material/Egg';
import SetMealIcon from '@mui/icons-material/SetMeal';
import GrassIcon from '@mui/icons-material/Grass';
import BugReportIcon from '@mui/icons-material/BugReport';
import GrainIcon from '@mui/icons-material/Grain';
import NatureIcon from '@mui/icons-material/Nature';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import SpaIcon from '@mui/icons-material/Spa';
import YardIcon from '@mui/icons-material/Yard';
import ColorizeIcon from '@mui/icons-material/Colorize';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import ScienceIcon from '@mui/icons-material/Science';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import WaterIcon from '@mui/icons-material/Water';

export interface Allergen {
    id: string;
    label: string;
    icon: React.ReactElement;
}

export const EU_ALLERGENS: Allergen[] = [
    { id: 'gluten', label: 'Gluten', icon: <GrassIcon /> },
    { id: 'crustaceos', label: 'Crustáceos', icon: <BugReportIcon /> },
    { id: 'huevos', label: 'Huevos', icon: <EggIcon /> },
    { id: 'pescado', label: 'Pescado', icon: <SetMealIcon /> },
    { id: 'cacahuetes', label: 'Cacahuetes', icon: <GrainIcon /> },
    { id: 'soja', label: 'Soja', icon: <NatureIcon /> },
    { id: 'lacteos', label: 'Lácteos', icon: <LocalDrinkIcon /> },
    { id: 'frutos_con_cascara', label: 'Frutos de cáscara', icon: <SpaIcon /> },
    { id: 'apio', label: 'Apio', icon: <YardIcon /> },
    { id: 'mostaza', label: 'Mostaza', icon: <ColorizeIcon /> },
    { id: 'sesamo', label: 'Sésamo', icon: <ScatterPlotIcon /> },
    { id: 'sulfito', label: 'Sulfitos', icon: <ScienceIcon /> },
    { id: 'altramuces', label: 'Altramuces', icon: <LocalFloristIcon /> },
    { id: 'moluscos', label: 'Moluscos', icon: <WaterIcon /> },
];

export interface AllergenSelectorProps {
    value: string[];
    onChange: (newValue: string[]) => void;
    disabled?: boolean;
}

const AllergenSelector: React.FC<AllergenSelectorProps> = ({ value = [], onChange, disabled }) => {

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
                                width: { xs: 'calc(50% - 8px)', sm: 'calc(33.333% - 8px)', md: 'calc(33.333% - 8px)', lg: 'calc(25% - 8px)' },
                                border: '1px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                borderRadius: 1,
                                bgcolor: isSelected ? 'primary.light' : 'background.paper',
                                color: isSelected ? 'primary.contrastText' : 'text.primary',
                                cursor: disabled ? 'default' : 'pointer',
                                opacity: disabled ? 0.5 : 1,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: disabled ? undefined : (isSelected ? 'primary.light' : 'action.hover'),
                                }
                            }}
                        >
                            <Tooltip title={allergen.label}>
                                <Box sx={{ display: 'flex', mb: 0.5 }}>
                                    {allergen.icon}
                                </Box>
                            </Tooltip>
                            <Typography
                                variant="caption"
                                align="center"
                                sx={{
                                    lineHeight: 1.1,
                                    fontSize: '0.65rem',
                                    wordBreak: 'break-word',
                                    hyphens: 'auto'
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
