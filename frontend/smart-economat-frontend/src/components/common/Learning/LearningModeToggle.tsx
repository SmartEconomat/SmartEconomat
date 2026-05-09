import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Tooltip } from '../../ui/Tooltip';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import SchoolIconFilled from '@mui/icons-material/School';
import { useThemeContext } from '../../../store/theme.hooks';

interface LearningModeToggleProps {
  mode?: 'icon' | 'listitem';
  isOpen?: boolean;
}

/**
 * Expone "LearningModeToggle" en smart-economat-frontend (SPA).
 * @undefined {LearningModeToggleProps} {
 *   mode = 'icon',
 *   isOpen = true,
 * } - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/jsx-runtime").JSX.Element | null} Datos efectivos después de ejecutar la operación.
 */
export default function LearningModeToggle({
  mode = 'icon',
  isOpen = true,
}: LearningModeToggleProps) {
  const theme = useTheme();
  const { isLearningMode, setLearningMode } = useThemeContext();

  const handleClick = () => {
    setLearningMode(!isLearningMode);
  };

  const tooltipText = isLearningMode
    ? 'Desactivar tips de uso (Ocultar descripciones de la interfaz)'
    : 'Activar tips de uso (Mostrar descripciones de botones e iconos)';

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
          <ListItemText
            primary={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Tips de uso
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.2,
                    borderRadius: 1,
                    bgcolor: isLearningMode
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'action.hover',
                    color: isLearningMode ? 'primary.main' : 'text.disabled',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {isLearningMode ? 'ON' : 'OFF'}
                </Typography>
              </Box>
            }
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

  // Default icon-only mode (if needed outside drawer)
  return null;
}
