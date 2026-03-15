import React from 'react';
import { Box, CircularProgress, useTheme } from '@mui/material';

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerColor = 'primary' | 'white' | 'gray' | 'inherit';

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  overlay?: boolean | 'container' | 'screen';
  className?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 24,
  md: 40,
  lg: 56,
};

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
