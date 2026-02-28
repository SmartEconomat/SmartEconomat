import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import Spinner from './Spinner';

interface ButtonProps extends MuiButtonProps {
    isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, isLoading, disabled, sx, ...props }) => {
    return (
        <MuiButton
            fullWidth
            variant="contained"
            disabled={isLoading || disabled}
            sx={{ mt: 3, mb: 2, borderRadius: 2, py: 1.5, ...sx }}
            {...props}
        >
            {isLoading ? <Spinner size="sm" color="inherit" /> : children}
        </MuiButton>
    );
};

export default Button;
