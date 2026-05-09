import { SxProps, Theme } from '@mui/material';
import StatusChip from './StatusChip';
import { ROLE_COLORS } from '../../utils/theme/roleColors';
import { useTranslation } from 'react-i18next';
import { getEnumLabel } from '../../i18n/enumPresentation';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export type RolType = 'Administrador' | 'Profesor' | 'Alumno' | string;

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface RoleBadgeProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  rol: RolType;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  size?: 'small' | 'medium';
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  sx?: SxProps<Theme>;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "RoleBadge" en smart-economat-frontend (SPA).
 * @undefined {RoleBadgeProps} {
 *   rol,
 *   size = 'small',
 *   sx,
 * } - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/jsx-runtime").JSX.Element} Datos efectivos después de ejecutar la operación.
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
