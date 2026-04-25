import { SxProps, Theme } from '@mui/material';
import StatusChip from './StatusChip';
import { ROLE_COLORS } from '../../utils/theme/roleColors';

/** Valid role names; any other string is also accepted. */
export type RolType = 'Administrador' | 'Profesor' | 'Alumno' | string;

/**
 * Props for the {@link RoleBadge} component.
 */
export interface RoleBadgeProps {
  /** Role name displayed in the badge. Drives the background colour selection. */
  rol: RolType;
  /** Size of the underlying chip. Defaults to `'small'`. */
  size?: 'small' | 'medium';
  /** Additional MUI `sx` styles forwarded to the chip. */
  sx?: SxProps<Theme>;
}

/**
 * Coloured chip badge that displays a user role.
 *
 * Background colour is resolved from {@link ROLE_COLORS} based on whether the
 * role name contains "admin", "profesor", or "alumno" (case-insensitive).
 * All other roles fall back to the default colour.
 *
 * @param props - See {@link RoleBadgeProps}.
 * @returns JSX element rendering a {@link StatusChip} styled for the given role.
 * @example
 * <RoleBadge rol="Administrador" />
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
  rol,
  size = 'small',
  sx,
}) => {
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
      label={rol}
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
