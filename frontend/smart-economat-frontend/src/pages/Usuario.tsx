import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Documentación en español.
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
