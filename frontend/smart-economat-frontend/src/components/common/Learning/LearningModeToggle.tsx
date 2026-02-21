import React from 'react';
import {
    ListItemButton,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import { Tooltip } from '../../ui/Tooltip';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import SchoolIconFilled from '@mui/icons-material/School';
import { useThemeContext } from '../../../store/ThemeContext';

interface LearningModeToggleProps {
    mode?: 'icon' | 'listitem';
    isOpen?: boolean;
}

export default function LearningModeToggle({ mode = 'icon', isOpen = true }: LearningModeToggleProps) {
    const { isLearningMode, setLearningMode } = useThemeContext();

    const handleClick = () => {
        setLearningMode(!isLearningMode);
    };

    const tooltipText = isLearningMode
        ? "Desactivar modo aprendizaje (Ocultar descripciones detalladas)"
        : "Activar modo aprendizaje (Mostrar descripciones detalladas)";

    const label = isLearningMode ? "Aprendizaje: ON" : "Aprendizaje: OFF";

    if (mode === 'listitem') {
        return (
            <Tooltip title={tooltipText}>
                <ListItemButton
                    onClick={handleClick}
                    sx={{
                        minHeight: 48,
                        justifyContent: isOpen ? 'initial' : 'center',
                        px: 2.5,
                    }}
                    selected={isLearningMode}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: isOpen ? 3 : 'auto',
                            justifyContent: 'center',
                            color: isLearningMode ? 'primary.main' : 'inherit'
                        }}
                    >
                        {isLearningMode ? <SchoolIconFilled /> : <SchoolIcon />}
                    </ListItemIcon>
                    <ListItemText primary={label} sx={{ opacity: isOpen ? 1 : 0 }} />
                </ListItemButton>
            </Tooltip>
        );
    }

    // Default icon-only mode (if needed outside drawer)
    return null;
}
