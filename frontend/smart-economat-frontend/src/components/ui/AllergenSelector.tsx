import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

// Import icons to be used as approximations for the allergens
import EggIcon from '@mui/icons-material/Egg';
import SetMealIcon from '@mui/icons-material/SetMeal';
import GrassIcon from '@mui/icons-material/Grass'; // For Cereals/Gluten
import LocalCafeIcon from '@mui/icons-material/LocalCafe'; // For Soy/Lupin/Mustard/Sesame
import LocalDrinkIcon from '@mui/icons-material/LocalDrink'; // Dairy
import BugReportIcon from '@mui/icons-material/BugReport'; // Crustaceans
import WaterIcon from '@mui/icons-material/Water'; // Molluscs
import ScienceIcon from '@mui/icons-material/Science'; // Sulphites
import SpaIcon from '@mui/icons-material/Spa'; // Nuts/Peanuts/Celery

export interface Allergen {
    id: string;
    label: string;
    icon: React.ReactElement;
}

export const EU_ALLERGENS: Allergen[] = [
    { id: 'gluten', label: 'Gluten', icon: <GrassIcon /> },
    { id: 'crustaceans', label: 'Crustáceos', icon: <BugReportIcon /> },
    { id: 'eggs', label: 'Huevos', icon: <EggIcon /> },
    { id: 'fish', label: 'Pescado', icon: <SetMealIcon /> },
    { id: 'peanuts', label: 'Cacahuetes', icon: <SpaIcon /> },
    { id: 'soybeans', label: 'Soja', icon: <LocalCafeIcon /> },
    { id: 'milk', label: 'Lácteos', icon: <LocalDrinkIcon /> },
    { id: 'nuts', label: 'Frutos de cáscara', icon: <SpaIcon /> },
    { id: 'celery', label: 'Apio', icon: <SpaIcon /> },
    { id: 'mustard', label: 'Mostaza', icon: <LocalCafeIcon /> },
    { id: 'sesame', label: 'Sésamo', icon: <LocalCafeIcon /> },
    { id: 'sulphites', label: 'Sulfitos', icon: <ScienceIcon /> },
    { id: 'lupin', label: 'Altramuces', icon: <LocalCafeIcon /> },
    { id: 'molluscs', label: 'Moluscos', icon: <WaterIcon /> },
];

export interface AllergenSelectorProps {
    /** Array of selected allergen IDs */
    value: string[];
    /** Callback fired when the selection changes */
    onChange: (newValue: string[]) => void;
    /** If true, the component is disabled */
    disabled?: boolean;
}

/**
 * Visual grid of European Union mandatory allergens mapped to generic Material-UI icons.
 * Allows multiple selection.
 */
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
