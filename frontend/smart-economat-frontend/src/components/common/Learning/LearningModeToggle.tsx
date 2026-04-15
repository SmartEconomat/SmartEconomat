import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Tooltip } from '../../ui/Tooltip';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import SchoolIconFilled from '@mui/icons-material/School';
import { useThemeContext } from '../../../store/theme.hooks';
import { useTranslation } from 'react-i18next';

/**
 * Props for the LearningModeToggle component.
 */
interface LearningModeToggleProps {
  /** Display mode: 'icon' renders nothing (placeholder), 'listitem' renders a full sidebar list item. */
  mode?: 'icon' | 'listitem';
  /** Whether the sidebar drawer is currently open (affects label visibility). */
  isOpen?: boolean;
}

/**
 * Toggle button for enabling or disabling learning mode.
 *
 * In `listitem` mode it renders as a MUI ListItemButton suitable for
 * placement inside a navigation drawer. In `icon` mode it renders nothing
 * (reserved for a future standalone icon variant).
 *
 * @param props - {@link LearningModeToggleProps}
 */
export default function LearningModeToggle({
  mode = 'icon',
  isOpen = true,
}: LearningModeToggleProps) {
  const { isLearningMode, setLearningMode } = useThemeContext();
  const { t } = useTranslation();

  /**
   * Toggles learning mode on/off.
   */
  const handleClick = () => {
    setLearningMode(!isLearningMode);
  };

  const tooltipText = isLearningMode
    ? t('configuracion.aprendizaje.desactivar')
    : t('configuracion.aprendizaje.activar');

  const label = isLearningMode
    ? t('configuracion.aprendizaje.on')
    : t('configuracion.aprendizaje.off');

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
              color: isLearningMode ? 'primary.main' : 'inherit',
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
