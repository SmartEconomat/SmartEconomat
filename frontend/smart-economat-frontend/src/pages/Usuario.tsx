import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * User profile configuration page.
 *
 * Displays the current user's profile settings and configuration options.
 * This page is accessible to authenticated users who wish to manage their
 * own account details.
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
