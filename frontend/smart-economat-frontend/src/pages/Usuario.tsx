import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Box, Paper } from '@mui/material';

const Usuario: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography variant="body1">
          {t('usuario.profileConfigPage')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Usuario;
