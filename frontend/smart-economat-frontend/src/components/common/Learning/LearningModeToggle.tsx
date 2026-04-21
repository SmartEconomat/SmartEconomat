import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Tooltip } from '../../ui/Tooltip';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import SchoolIconFilled from '@mui/icons-material/School';
import { useThemeContext } from '../../../store/theme.hooks';
import { useTranslation } from 'react-i18next';

interface LearningModeToggleProps {
  mode?: 'icon' | 'listitem';
  isOpen?: boolean;
}

export default function LearningModeToggle({
  mode = 'icon',
  isOpen = true,
}: LearningModeToggleProps) {
  const { isLearningMode, setLearningMode } = useThemeContext();
  const { t } = useTranslation();

  const handleClick = () => {
    setLearningMode(!isLearningMode);
  };

  const tooltipText = isLearningMode
    ? t('learning.deactivate')
    : t('learning.activate');

  const label = isLearningMode ? t('learning.on') : t('learning.off');

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
