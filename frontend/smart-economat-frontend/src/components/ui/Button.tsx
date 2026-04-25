import React from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  Box,
  Typography,
} from '@mui/material';
import Spinner from './Spinner';

/**
 * Props for the {@link Button} component.
 */
interface ButtonProps extends MuiButtonProps {
  /** When `true` the button is disabled and shows a spinner with optional loading text. */
  isLoading?: boolean;
  /** Text (or node) shown alongside the spinner while loading; defaults to `children`. */
  loadingText?: React.ReactNode;
}

/**
 * Application-standard button with built-in loading state.
 *
 * Renders as a full-width `contained` MUI Button by default. When `isLoading`
 * is `true` the button is disabled, the `startIcon` is hidden, and a {@link Spinner}
 * appears inline next to the label (or `loadingText` if provided).
 *
 * @param props - All MUI `ButtonProps` plus `isLoading` and `loadingText`.
 * @returns An MUI Button element with integrated loading indicator.
 * @example
 * <Button isLoading={isSaving} loadingText="Guardando…" onClick={handleSave}>
 *   Guardar
 * </Button>
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
