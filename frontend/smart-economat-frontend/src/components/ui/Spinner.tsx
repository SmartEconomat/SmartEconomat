import React from 'react';
import { Box, CircularProgress, useTheme } from '@mui/material';

/** Available size tokens for {@link Spinner}. */
type SpinnerSize = 'sm' | 'md' | 'lg';

/** Available colour tokens for {@link Spinner}. */
type SpinnerColor = 'primary' | 'white' | 'gray' | 'inherit';

/**
 * Props for the {@link Spinner} component.
 */
export interface SpinnerProps {
  /** Size of the spinner. Defaults to `'md'`. */
  size?: SpinnerSize;
  /** Colour of the spinner. Defaults to `'primary'`. */
  color?: SpinnerColor;
  /**
   * When set, the spinner is wrapped in a semi-transparent overlay.
   * `'container'` uses `position: absolute` (relative to the nearest positioned ancestor);
   * `'screen'` uses `position: fixed` to cover the entire viewport.
   * Defaults to `false`.
   */
  overlay?: boolean | 'container' | 'screen';
  /** Additional CSS class applied to the outermost element. */
  className?: string;
}

/** Maps size tokens to pixel dimensions for `CircularProgress`. */
const sizeMap: Record<SpinnerSize, number> = {
  sm: 24,
  md: 40,
  lg: 56,
};

/**
 * Animated circular loading indicator.
 *
 * Can be rendered inline or as a semi-transparent overlay over a container
 * or the full screen. Supports themed colour tokens and three size presets.
 *
 * @param props - See {@link SpinnerProps}.
 * @returns JSX element rendering a `CircularProgress`, optionally wrapped in an overlay box.
 * @example
 * // Inline spinner
 * <Spinner size="sm" color="inherit" />
 *
 * // Full-screen overlay spinner
 * <Spinner overlay="screen" />
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  overlay = false,
  className,
}) => {
  const theme = useTheme();

  const getColorValue = (): string => {
    switch (color) {
      case 'white':
        return '#ffffff';
      case 'gray':
        return theme.palette.grey[500];
      case 'inherit':
        return 'inherit';
      case 'primary':
      default:
        return theme.palette.primary.main;
    }
  };

  const spinnerColor = getColorValue();
  const spinnerSize = sizeMap[size];

  const progressEl = (
    <CircularProgress
      size={spinnerSize}
      role="status"
      aria-label="Cargando"
      sx={{ color: spinnerColor }}
      className={!overlay ? className : undefined}
    />
  );

  if (!overlay) {
    return progressEl;
  }

  const position = overlay === 'screen' ? 'fixed' : 'absolute';
  const isDark = theme.palette.mode === 'dark';
  const bgOverlay = isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  const zIndex = overlay === 'screen' ? theme.zIndex.modal + 1 : 10;

  return (
    <Box
      className={className}
      sx={{
        position,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgOverlay,
        zIndex,
      }}
    >
      {progressEl}
    </Box>
  );
};

export default Spinner;
