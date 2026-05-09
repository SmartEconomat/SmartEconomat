import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const Usuario: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography variant="body1">
          {t('usuario.perfilDescripcion')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Usuario;
