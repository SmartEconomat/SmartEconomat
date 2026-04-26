import React from 'react';
import { Box } from '@mui/material';
import { useThemeContext } from '../../../store/theme.hooks';
import Logo from '../../../assets/images/SVG/logo-smat-economato.svg';
import LogoBlanco from '../../../assets/images/SVG/logo-smart-economat-blanco.svg';
import LogoNegro from '../../../assets/images/SVG/logo-smart-economat-negro.svg';

interface AuthLogoProps {
  condensed?: boolean;
}

/**
 * Documentación en español.
 */
const AuthLogo: React.FC<AuthLogoProps> = ({ condensed = false }) => {
  const { currentThemeName } = useThemeContext();

  const height = condensed
    ? 'clamp(60px, 10vw, 85px)'
    : 'clamp(90px, 15vw, 130px)';

  const getLogo = () => {
    if (currentThemeName === 'highContrastDark') return LogoBlanco;
    if (currentThemeName === 'highContrastLight') return LogoNegro;
    if (currentThemeName === 'dark') return LogoBlanco;
    return Logo;
  };

  return (
    <Box
      sx={{
        mb: 1,
        mt: { xs: 0, md: 1 },
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <img
        src={getLogo()}
        alt="SmartEconomat"
        style={{ height, width: 'auto' }}
      />
    </Box>
  );
};

export default AuthLogo;
