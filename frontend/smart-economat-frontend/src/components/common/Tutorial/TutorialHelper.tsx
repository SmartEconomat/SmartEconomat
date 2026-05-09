import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Tooltip } from '../../ui/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTheme } from '@mui/material/styles';
import { useThemeContext } from '../../../store/theme.hooks';
import { getTooltipContent } from '../../../utils/tooltipUtils';
import { useTutorial } from '../../../store/tutorial.hooks';

interface TutorialHelperProps {
  mode?: 'icon' | 'listitem';
  isOpen?: boolean;
}

const TutorialHelper: React.FC<TutorialHelperProps> = ({
  mode = 'icon',
  isOpen = true,
}: TutorialHelperProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const { isLearningMode } = useThemeContext();
  const { startTour } = useTutorial();

  const handleStartTour = () => {
    startTour(location.pathname);
  };

  if (mode === 'listitem') {
    return (
      <Tooltip
        title={getTooltipContent(
          isOpen,
          isLearningMode,
          'Tutorial',
          'Iniciar tutorial interactivo por este módulo'
        )}
      >
        <ListItemButton
          id="help-tutorial-button"
          onClick={handleStartTour}
          sx={{
            minHeight: 48,
            justifyContent: isOpen ? 'initial' : 'center',
            px: 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: isOpen ? 3 : 'auto',
              justifyContent: 'center',
            }}
          >
            <HelpOutlineIcon />
          </ListItemIcon>
          <ListItemText
            primary="Tutorial"
            sx={{
              opacity: isOpen ? 1 : 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              transition: theme.transitions.create('opacity', {
                easing: theme.transitions.easing.easeInOut,
                duration: isOpen ? theme.transitions.duration.standard : 100,
                delay: isOpen ? 150 : 0,
              }),
            }}
          />
        </ListItemButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={getTooltipContent(
        false,
        isLearningMode,
        'Tutorial',
        'Iniciar tutorial interactivo'
      )}
      placement="bottom"
    >
      <IconButton
        id="help-tutorial-button"
        color="inherit"
        onClick={handleStartTour}
        aria-label={t('tutorial.iniciarTutorial')}
        sx={{ ml: 1 }}
      >
        <HelpOutlineIcon />
      </IconButton>
    </Tooltip>
  );
};

export default TutorialHelper;
