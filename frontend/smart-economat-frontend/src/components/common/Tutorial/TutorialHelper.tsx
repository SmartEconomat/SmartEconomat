import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  IconButton,
  Popover,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  MobileStepper,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Tooltip } from '../../ui/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { useTheme } from '@mui/material/styles';
import { useThemeContext } from '../../../store/theme.hooks';
import { getTooltipContent } from '../../../utils/tooltipUtils';
import { tutorialConfig } from '../../../utils/config/tutorialData';
import { useAuth } from '../../../store/auth.hooks';
import { useTranslation } from 'react-i18next';

/**
 * A single step in a tutorial sequence.
 */
interface TutorialStep {
  /** Short heading displayed at the top of the step card. */
  title: string;
  /** Body text explaining the step. */
  description: string;
  /** Decorative icon rendered above the title. */
  icon: React.ReactNode;
}

/**
 * Central configuration shape for a route's tutorial.
 */
interface RouteTutorialConfig {
  /** Default steps shown to all roles. */
  steps?: TutorialStep[];
  /** Role-specific overrides: maps UPPER_CASE role name → step list. */
  roles?: Record<string, TutorialStep[]>;
}

/**
 * Props for the {@link TutorialHelper} component.
 */
interface TutorialHelperProps {
  /** Display mode: 'icon' renders a standalone icon button; 'listitem' renders a sidebar list item. */
  mode?: 'icon' | 'listitem';
  /** Whether the sidebar drawer is currently open (affects label visibility in listitem mode). */
  isOpen?: boolean;
  /**
   * Custom steps to override the route-based configuration.
   * When provided, these take priority over the central `tutorialConfig`.
   */
  steps?: {
    title: string;
    content: string;
    description?: string;
    icon?: React.ReactNode;
  }[];
}

/**
 * Contextual tutorial helper component.
 *
 * Displays a multi-step tutorial popover when activated. The steps shown are
 * determined by (in priority order):
 * 1. Custom `steps` passed via props.
 * 2. Role-specific steps from the central `tutorialConfig` for the current route.
 * 3. Default steps from the central `tutorialConfig` for the current route.
 *
 * If no steps are found the component renders `null`.
 *
 * In `listitem` mode the trigger is a MUI `ListItemButton` for sidebar
 * placement. In `icon` mode the trigger is a standalone `IconButton` for
 * top-bar placement.
 *
 * @param props - {@link TutorialHelperProps}
 */
const TutorialHelper: React.FC<TutorialHelperProps> = ({
  mode = 'icon',
  isOpen = true,
  steps: customSteps,
}: TutorialHelperProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const { isLearningMode } = useThemeContext();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  const userRole = user?.rol?.toUpperCase() || '';

  /**
   * Opens the tutorial popover and resets to the first step.
   * @param event - The click event from the trigger element.
   */
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setActiveStep(0); // Reset to first step on open
  };

  /** Closes the tutorial popover. */
  const handleClose = () => {
    setAnchorEl(null);
  };

  /** Advances to the next tutorial step. */
  const handleNext = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1);
  };

  /** Returns to the previous tutorial step. */
  const handleBack = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'tutorial-popover' : undefined;

  const currentPath = location.pathname;
  const defaultConfig =
    (tutorialConfig as Record<string, RouteTutorialConfig>)[currentPath] ||
    (tutorialConfig['default'] as RouteTutorialConfig);

  // Determinamos qué pasos mostrar:
  // 1. Si se pasan steps por props
  // 2. Si hay pasos específicos para el ROL en la config centralizada
  // 3. Pasos por defecto de la ruta
  let steps: TutorialStep[] = [];

  if (customSteps) {
    steps = customSteps.map((s) => ({
      title: s.title,
      description: s.description || s.content,
      icon: s.icon || defaultConfig?.steps?.[0]?.icon,
    }));
  } else if (defaultConfig?.roles && defaultConfig.roles[userRole]) {
    steps = defaultConfig.roles[userRole];
  } else {
    steps = defaultConfig?.steps || [];
  }

  if (steps.length === 0) return null;

  const maxSteps = steps.length;
  const currentStep = steps[activeStep];

  // Shared content logic
  const tutorialContent = (
    <Card elevation={0}>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'center', mb: 2, height: 60 }}
        >
          {currentStep.icon}
        </Box>
        <Typography variant="h6" gutterBottom>
          {currentStep.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ minHeight: 40 }}
        >
          {currentStep.description}
        </Typography>
      </CardContent>

      <MobileStepper
        variant="dots"
        steps={maxSteps}
        position="static"
        activeStep={activeStep}
        sx={{
          maxWidth: 400,
          flexGrow: 1,
          bgcolor: 'transparent',
          '& .MuiMobileStepper-dots': {
            gap: 0.5,
          },
        }}
        nextButton={
          <Button
            size="small"
            onClick={handleNext}
            disabled={activeStep === maxSteps - 1}
          >
            {theme.direction === 'rtl' ? (
              <KeyboardArrowLeft />
            ) : (
              <KeyboardArrowRight />
            )}
          </Button>
        }
        backButton={
          <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
            {theme.direction === 'rtl' ? (
              <KeyboardArrowRight />
            ) : (
              <KeyboardArrowLeft />
            )}
          </Button>
        }
      />

      <CardActions sx={{ justifyContent: 'center', pb: 1 }}>
        <Button
          size="small"
          onClick={handleClose}
          sx={{ color: 'text.secondary' }}
        >
          {t('tutorial.cerrar')}
        </Button>
      </CardActions>
    </Card>
  );

  if (mode === 'listitem') {
    return (
      <>
        <Tooltip
          title={getTooltipContent(
            isOpen,
            isLearningMode,
            t('tutorial.ayuda'),
            t('tutorial.verGuiaAyuda')
          )}
        >
          <ListItemButton
            onClick={handleClick}
            aria-describedby={id}
            aria-label={t('tutorial.mostrar')}
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
              primary={t('tutorial.ayuda')}
              sx={{ opacity: isOpen ? 1 : 0 }}
            />
          </ListItemButton>
        </Tooltip>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'center',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: { maxWidth: 350, p: 0, borderRadius: 2, ml: 1 },
          }}
        >
          {tutorialContent}
        </Popover>
      </>
    );
  }

  return (
    <>
      <Tooltip
        title={getTooltipContent(
          false,
          isLearningMode,
          t('tutorial.ayuda'),
          t('tutorial.verGuia')
        )}
        placement="bottom"
      >
        <IconButton
          color="inherit"
          aria-describedby={id}
          onClick={handleClick}
          aria-label={t('tutorial.mostrar')}
          sx={{ ml: 1 }}
        >
          <HelpOutlineIcon />
        </IconButton>
      </Tooltip>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { maxWidth: 350, p: 0, borderRadius: 2, mt: 1 },
        }}
      >
        {tutorialContent}
      </Popover>
    </>
  );
};

export default TutorialHelper;
