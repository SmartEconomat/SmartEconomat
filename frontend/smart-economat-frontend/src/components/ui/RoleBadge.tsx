import { SxProps, Theme } from '@mui/material';
import StatusChip from './StatusChip';
import { ROLE_COLORS } from '../../utils/theme/roleColors';
import { useTranslation } from 'react-i18next';
import { getEnumLabel } from '../../i18n/enumPresentation';

/**
 * Documentación en español.
 */
export type RolType = 'Administrador' | 'Profesor' | 'Alumno' | string;

/**
 * Documentación en español.
 */
export interface RoleBadgeProps {
  /**
   * Documentación en español.
   */
  rol: RolType;
  /**
   * Documentación en español.
   */
  size?: 'small' | 'medium';
  /**
   * Documentación en español.
   */
  sx?: SxProps<Theme>;
}

/**
 * Documentación en español.
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
  rol,
  size = 'small',
  sx,
}) => {
  const { t } = useTranslation();
  const getRolColor = (rolName: string) => {
    if (rolName.toLowerCase().includes('admin'))
      return ROLE_COLORS.Administrador;
    if (rolName.toLowerCase().includes('profesor')) return ROLE_COLORS.Profesor;
    if (rolName.toLowerCase().includes('alumno')) return ROLE_COLORS.Alumno;
    return ROLE_COLORS.Default;
  };

  const backgroundColor = getRolColor(rol);

  return (
    <StatusChip
      status="default"
      label={getEnumLabel(t, 'rolUsuario', rol)}
      size={size}
      sx={{
        width: '130px',
        bgcolor: backgroundColor,
        color: '#ffffff',
        fontWeight: 'bold',
        '& .MuiChip-label': { px: 1 },
        border: 'none',
        ...sx,
      }}
    />
  );
};

export default RoleBadge;
