import { SxProps, Theme } from '@mui/material';
import StatusChip from './StatusChip';
import { ROLE_COLORS } from '../../utils/theme/roleColors';

export type RolType = 'Administrador' | 'Profesor' | 'Alumno' | string;

export interface RoleBadgeProps {
  rol: RolType;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

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
