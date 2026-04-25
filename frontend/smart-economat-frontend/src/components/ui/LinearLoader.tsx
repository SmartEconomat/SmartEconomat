import React from 'react';
import { LinearProgress, Box, alpha, useTheme } from '@mui/material';

interface LinearLoaderProps {
  fixed?: boolean;
}

/**
 * Componente de carga lineal premium.
 * Proporciona un indicador de progreso discreto en la parte superior.
 * Ideal para ser usado junto con Skeletons para evitar pantallas blancas.
 */
const LinearLoader: React.FC<LinearLoaderProps> = ({ fixed = false }) => {
  const theme = useTheme();
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    // Simulación de progreso orgánico
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) return 100;

        // El progreso se ralentiza conforme se acerca al 90%
        const diff = Math.random() * 10;
        const factor = oldProgress > 80 ? 0.1 : oldProgress > 50 ? 0.5 : 1;
        const newProgress = oldProgress + diff * factor;

        return Math.min(newProgress, 94); // Se "atasca" en 94% hasta que termine la carga real
      });
    }, 400);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box
      sx={{
        position: fixed ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.tooltip + 2,
        width: '100%',
      }}
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        role="status"
        aria-label="Cargando"
        sx={{
          height: 3,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          '& .MuiLinearProgress-bar': {
            borderRadius: 0,
            transition: 'transform 0.4s linear', // Suaviza el movimiento del progreso
            boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.6)}`,
          },
        }}
      />
    </Box>
  );
};

export default LinearLoader;
