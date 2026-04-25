import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  Portal,
  Typography,
  Button,
  IconButton,
  Card,
  CardActions,
  Popper,
  PopperPlacementType,
  Fade,
  Paper,
  alpha,
  useTheme,
  MobileStepper,
  Theme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { useTutorial } from '../../../store/tutorial.hooks';
import type { TutorialStep } from '../../../utils/config/tutorialData';

const InteractiveTour: React.FC = () => {
  const theme = useTheme();
  // Detectar si la pantalla es muy bajita (ej: móvil en landscape o consola abierta)
  const isShortScreen = useMediaQuery('(max-height: 520px)');

  const {
    isActive,
    currentStepIndex,
    currentSteps,
    nextStep,
    prevStep,
    skipTour,
  } = useTutorial();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [currentAnchorTarget, setCurrentAnchorTarget] = useState<string | null>(
    null
  );
  const [renderedStep, setRenderedStep] = useState<TutorialStep | null>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  const step = currentSteps[currentStepIndex];

  // Listener para redimensionamiento y scroll para mantener spotlight y center precisos
  const handleUpdate = useCallback(() => setTick((t) => t + 1), []);

  // Manejar teclado (Flechas y Escape)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isActive) return;

      switch (e.key) {
        case 'ArrowRight':
          if (currentStepIndex < currentSteps.length - 1) {
            nextStep();
          } else {
            skipTour();
          }
          break;
        case 'ArrowLeft':
          if (currentStepIndex > 0) {
            prevStep();
          }
          break;
        case 'Escape':
          skipTour();
          break;
        default:
          break;
      }
    },
    [
      isActive,
      currentStepIndex,
      currentSteps.length,
      nextStep,
      prevStep,
      skipTour,
    ]
  );

  useEffect(() => {
    if (isActive) {
      window.addEventListener('resize', handleUpdate);
      window.addEventListener('scroll', handleUpdate, { passive: true });
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleUpdate, handleKeyDown]);

  useEffect(() => {
    if (!isActive || !step || !step.target) {
      setAnchorEl(null);
      return;
    }

    // Limpiar el anchor anterior para evitar flash
    setAnchorEl(null);
    setCurrentAnchorTarget(null);

    const timer = setTimeout(() => {
      const element = document.querySelector(step.target!) as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setAnchorEl(element);
        setCurrentAnchorTarget(step.target!);
        setRenderedStep(step);
      } else {
        // Si el elemento no existe en esta vista, saltamos
        nextStep();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isActive, step, nextStep]);

  if (!isActive || !step) return null;

  const displayStep = renderedStep || step;
  const isTransitioning = !anchorEl || currentAnchorTarget !== step.target;

  // Estilos responsivos del diálogo
  const tourPaperStyles = {
    width: { xs: 'calc(100vw - 32px)', sm: 320 },
    maxWidth: 400,
    maxHeight: isShortScreen ? 'calc(100vh - 20px)' : 'calc(100vh - 80px)',
    borderRadius: 3,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid',
    borderColor: 'primary.main',
    boxShadow: (theme: Theme) =>
      `0 12px 32px ${alpha(theme.palette.common.black, 0.25)}`,
  };

  const tourContent = (
    <Card
      sx={{
        bgcolor: 'background.paper',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: 'inherit',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: 0.5,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
          flexShrink: 0,
        }}
      >
        <IconButton size="small" onClick={skipTour} aria-label="Omitir tour">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          overflowY: 'auto',
          flexGrow: 1,
          px: { xs: 2, sm: 3 },
          pb: isShortScreen ? 1 : 2,
          pt: 1,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          {displayStep.icon && !isShortScreen && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: { xs: 1, sm: 2 },
                transform: { xs: 'scale(0.7)', sm: 'scale(0.8)' },
              }}
            >
              {displayStep.icon}
            </Box>
          )}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              mb: 1,
              color: 'primary.main',
              fontSize: isShortScreen
                ? '0.9rem'
                : { xs: '1rem', sm: '1.25rem' },
              lineHeight: 1.1,
            }}
          >
            {displayStep.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: isShortScreen
                ? '0.7rem'
                : { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            {displayStep.description}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}
      >
        <MobileStepper
          variant="dots"
          steps={currentSteps.length}
          position="static"
          activeStep={currentStepIndex}
          sx={{
            bgcolor: 'transparent',
            px: 1,
            py: isShortScreen ? 0.25 : 1,
            '& .MuiMobileStepper-dots': {
              gap: 0.5,
              display: isShortScreen ? 'none' : 'flex',
            },
          }}
          nextButton={
            <Button
              size="small"
              onClick={
                currentStepIndex === currentSteps.length - 1
                  ? skipTour
                  : nextStep
              }
              disabled={isTransitioning && currentStepIndex !== 0}
              endIcon={<KeyboardArrowRight />}
              sx={{
                fontWeight: 700,
                fontSize: isShortScreen ? '0.7rem' : 'inherit',
              }}
            >
              {currentStepIndex === currentSteps.length - 1
                ? 'Finalizar'
                : 'Siguiente'}
            </Button>
          }
          backButton={
            <Button
              size="small"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              startIcon={<KeyboardArrowLeft />}
              sx={{
                fontWeight: 700,
                fontSize: isShortScreen ? '0.7rem' : 'inherit',
              }}
            >
              Atrás
            </Button>
          }
        />
      </Box>

      {!isShortScreen && (
        <CardActions
          sx={{
            justifyContent: 'center',
            bgcolor: 'grey.50',
            py: 0.5,
            flexShrink: 0,
          }}
        >
          <Button
            size="small"
            onClick={skipTour}
            color="inherit"
            sx={{ fontSize: '0.65rem', opacity: 0.7 }}
          >
            Saltar todo el tutorial
          </Button>
        </CardActions>
      )}
    </Card>
  );

  return (
    <Portal>
      {/* Overlay Oscuro */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          zIndex: theme.zIndex.drawer + 50,
          pointerEvents: 'none',
        }}
      />

      {/* Modo de posicionamiento central para áreas grandes */}
      {displayStep.placement === 'center' && anchorEl && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: theme.zIndex.drawer + 100,
            pointerEvents: 'auto',
          }}
        >
          <Fade in={isActive && !isTransitioning} timeout={350}>
            <Paper elevation={8} sx={tourPaperStyles}>
              {tourContent}
            </Paper>
          </Fade>
        </Box>
      )}

      {/* Modo de posicionamiento anclado (Popper) */}
      {displayStep.placement !== 'center' && (
        <Popper
          open={isActive && !isTransitioning}
          anchorEl={anchorEl}
          placement={(displayStep.placement as PopperPlacementType) || 'bottom'}
          transition
          sx={{ zIndex: theme.zIndex.drawer + 100 }}
          modifiers={[
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                boundary: 'viewport',
                padding: { top: 80, bottom: 20, left: 20, right: 20 },
              },
            },
            {
              name: 'flip',
              enabled: !displayStep.disableFlip,
              options: {
                fallbackPlacements: ['bottom', 'top', 'right', 'left'],
              },
            },
            {
              name: 'offset',
              enabled: true,
              options: {
                offset: [0, 12],
              },
            },
          ]}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Paper elevation={8} sx={tourPaperStyles}>
                {tourContent}
              </Paper>
            </Fade>
          )}
        </Popper>
      )}

      {/* Resaltado del elemento (Spotlight) */}
      {anchorEl && currentAnchorTarget === step.target && (
        <Box
          ref={spotlightRef}
          sx={{
            position: 'absolute',
            top: anchorEl.getBoundingClientRect().top + window.scrollY,
            left: anchorEl.getBoundingClientRect().left + window.scrollX,
            width: anchorEl.offsetWidth,
            height: anchorEl.offsetHeight,
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`,
            borderRadius: 2,
            zIndex: theme.zIndex.drawer + 49,
            pointerEvents: 'none',
            transition: 'all 0.15s ease-out',
          }}
        />
      )}
    </Portal>
  );
};

export default InteractiveTour;
