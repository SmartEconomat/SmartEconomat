import React from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  Box,
  Typography,
} from '@mui/material';
import Spinner from './Spinner';

/**
 * Documentación en español.
 */
interface ButtonProps extends MuiButtonProps {
  /**
   * Documentación en español.
   */
  isLoading?: boolean;
  /**
   * Documentación en español.
   */
  loadingText?: React.ReactNode;
}

/**
 * Documentación en español.
 */
const Button: React.FC<ButtonProps> = ({
  children,
  isLoading,
  loadingText,
  disabled,
  sx,
  startIcon,
  ...props
}) => {
  return (
    <MuiButton
      fullWidth
      variant="contained"
      disabled={isLoading || disabled}
      startIcon={isLoading ? undefined : startIcon}
      sx={{ mt: 3, mb: 2, borderRadius: 2, py: 1.5, ...sx }}
      {...props}
    >
      {isLoading ? (
        <Box display="flex" alignItems="center" gap={1.25}>
          <Spinner size="sm" color="inherit" />
          <Typography
            component="span"
            variant="button"
            sx={{ color: 'inherit' }}
          >
            {loadingText ?? children}
          </Typography>
        </Box>
      ) : (
        children
      )}
    </MuiButton>
  );
};

export default Button;
