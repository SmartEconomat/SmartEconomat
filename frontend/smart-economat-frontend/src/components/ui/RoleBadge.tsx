import React from 'react';
import StatusChip, { StatusType } from './StatusChip';

export type RolType = 'Administrador' | 'Profesor' | 'Alumno' | string;

export interface RoleBadgeProps {
    rol: RolType;
    size?: 'small' | 'medium';
    sx?: any;
}

const mapRolToStatusType = (rol: RolType): StatusType => {
    switch (rol) {
        case 'Administrador':
            return 'error'; // Rojo 
        case 'Profesor':
            return 'info'; // Azul
        case 'Alumno':
            return 'success'; // Verde
        default:
            return 'default'; // Gris
    }
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ rol, size = 'small', sx }) => {
    const statusType = mapRolToStatusType(rol);

    return (
        <StatusChip
            status={statusType}
            label={rol}
            size={size}
            variant="outlined"
            sx={{ width: '130px', ...sx }}
        />
    );
};

export default RoleBadge;
