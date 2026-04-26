import React from 'react';
import { Button, ButtonProps } from '@mui/material';

/**
 * Documentación en español.
 */
const SecondaryActionButton: React.FC<ButtonProps> = (props) => {
  return (
    <Button
      variant="outlined"
      color="primary"
      fullWidth
      {...props}
      sx={{
        mt: 1,
        fontSize: '0.875rem',
        textTransform: 'none',
        borderRadius: 2,
        borderWidth: '1px',
        padding: '8px 16px',
        '&:hover': {
          borderWidth: '1px',
          bgcolor: 'primary.50',
        },
        ...props.sx,
      }}
    />
  );
};

export default SecondaryActionButton;
