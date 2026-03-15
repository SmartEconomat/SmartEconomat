import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const Usuario: React.FC = () => {
  return (
    <Box>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography variant="body1">
          Esta es la página de configuración del perfil de usuario.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Usuario;
