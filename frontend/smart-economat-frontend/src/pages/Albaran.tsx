import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const Albaran: React.FC = () => {
  return (
    <Box>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography variant="body1">
          Esta es la página de gestión de albaranes.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Albaran;
