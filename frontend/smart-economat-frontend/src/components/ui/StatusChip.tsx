import React from 'react';
import { Chip, ChipProps } from '@mui/material';

export type StatusType =
    | 'success' | 'completed' | 'delivered' | 'approved'
    | 'error' | 'failed' | 'cancelled' | 'rejected'
    | 'warning' | 'pending' | 'in_progress' | 'review'
    | 'info' | 'active' | 'archived'
    | 'fácil' | 'media' | 'difícil'
    | 'default' | 'unknown';

export interface StatusChipProps extends Omit<ChipProps, 'color'> {
    status: StatusType | string;
    label?: string;
}

const getStatusColor = (
    status: string
): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    if (!status) return 'default';
    const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : String(status).toLowerCase();

    switch (normalizedStatus) {
        case 'success':
        case 'completed':
        case 'delivered':
        case 'approved':
        case 'fácil':
            return 'success';
        case 'error':
        case 'failed':
        case 'cancelled':
        case 'rejected':
        case 'difícil':
            return 'error';
        case 'warning':
        case 'pending':
        case 'in_progress':
        case 'review':
        case 'media':
            return 'warning';
        case 'info':
        case 'active':
        case 'archived':
            return 'info';
        default:
            return 'default';
    }
};

const statusTranslations: Record<string, string> = {
    success: 'Éxito',
    completed: 'Completado',
    delivered: 'Entregado',
    approved: 'Aprobado',
    error: 'Error',
    failed: 'Fallido',
    cancelled: 'Cancelado',
    rejected: 'Rechazado',
    warning: 'Advertencia',
    pending: 'Pendiente',
    in_progress: 'En progreso',
    review: 'En revisión',
    info: 'Info',
    active: 'Activo',
    archived: 'Archivado',
    fácil: 'Fácil',
    media: 'Media',
    difícil: 'Difícil',
    unknown: 'Desconocido',
    default: 'Por defecto'
};

const capitalize = (text: string) => {
    if (!text) return '';
    const spacedText = text.replace(/[_|-]/g, ' ');
    return spacedText.charAt(0).toUpperCase() + spacedText.slice(1);
};

const getTranslatedStatus = (status: string) => {
    if (!status) return '—';
    const normalized = typeof status === 'string' ? status.toLowerCase() : String(status).toLowerCase();
    if (statusTranslations[normalized]) {
        return statusTranslations[normalized];
    }
    return capitalize(String(status));
};

export const StatusChip: React.FC<StatusChipProps> = ({
    status,
    label,
    size = 'small',
    variant = 'filled',
    ...rest
}) => {
    const resolvedColor = getStatusColor(status as string);
    const displayLabel = label || getTranslatedStatus(status as string);

    return (
        <Chip
            {...rest}
            label={displayLabel}
            color={resolvedColor}
            size={size}
            variant={variant}
            sx={{
                fontWeight: 500,
                ...rest.sx,
            }}
        />
    );
};

export default StatusChip;
