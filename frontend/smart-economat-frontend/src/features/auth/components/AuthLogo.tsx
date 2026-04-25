import React from 'react';
import { Box } from '@mui/material';
import Logo from '../../../assets/images/SVG/logo-smat-economato.svg';

interface AuthLogoProps {
  condensed?: boolean;
}

/**
 * Componente AuthLogo
 *
 * Renderiza el logo de SmartEconomat con tamaños responsivos predefinidos.
 * @param {boolean} condensed - Si es true, usa un tamaño más pequeño (adecuado para flujos de registro o móviles).
 */
const AuthLogo: React.FC<AuthLogoProps> = ({ condensed = false }) => {
  const height = condensed
    ? 'clamp(60px, 10vw, 85px)'
    : 'clamp(90px, 15vw, 130px)';

  return (
    <Box
      sx={{
        mb: 1,
        mt: { xs: 0, md: 1 },
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <img src={Logo} alt="SmartEconomat" style={{ height, width: 'auto' }} />
    </Box>
  );
};

export default AuthLogo;
