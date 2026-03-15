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

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface RouteTutorialConfig {
  steps?: TutorialStep[];
  roles?: Record<string, TutorialStep[]>;
}

interface TutorialHelperProps {
  mode?: 'icon' | 'listitem';
  isOpen?: boolean;
  steps?: {
    title: string;
    content: string;
    description?: string;
    icon?: React.ReactNode;
  }[];
}

const TutorialHelper: React.FC<TutorialHelperProps> = ({
  mode = 'icon',
  isOpen = true,
  steps: customSteps,
}: TutorialHelperProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const { isLearningMode } = useThemeContext();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  const userRole = user?.rol?.toUpperCase() || '';

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setActiveStep(0); // Reset to first step on open
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1);
  };

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
  // 1. Si se pasan steps por props (legacy/específico)
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
          Cerrar
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
            'Ayuda',
            'Ver guía de ayuda de esta página'
          )}
        >
          <ListItemButton
            onClick={handleClick}
            aria-describedby={id}
            aria-label="Mostrar tutorial"
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
            <ListItemText primary="Ayuda" sx={{ opacity: isOpen ? 1 : 0 }} />
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
          'Ayuda',
          'Ver guía de ayuda'
        )}
        placement="bottom"
      >
        <IconButton
          color="inherit"
          aria-describedby={id}
          onClick={handleClick}
          aria-label="Mostrar tutorial"
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
