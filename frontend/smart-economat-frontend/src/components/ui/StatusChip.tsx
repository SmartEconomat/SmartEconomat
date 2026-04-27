import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useTranslation } from 'react-i18next';
import { CategoriaProducto } from '../../services/producto.types';
import { getCategoryIconFilled } from '../../features/productos/utils/getCategoryIconFilled';
import { getEnumLabel } from '../../i18n/enumPresentation';

export type StatusType =
  | 'success'
  | 'completed'
  | 'delivered'
  | 'approved'
  | 'error'
  | 'failed'
  | 'cancelled'
  | 'rejected'
  | 'warning'
  | 'pending'
  | 'in_progress'
  | 'review'
  | 'info'
  | 'active'
  | 'archived'
  | 'fácil'
  | 'media'
  | 'difícil'
  | 'default'
  | 'unknown';

/**
 * Documentación en español.
 */
export interface StatusChipProps extends Omit<ChipProps, 'color'> {
  /**
   * Documentación en español.
   */
  status: StatusType | string;
  /**
   * Documentación en español.
   */
  label?: string;
}

// Ancho fijo para chips de categoría de producto
const CATEGORY_CHIP_MIN_WIDTH = 110;

// Conjunto de valores de CategoriaProducto para detección rápida
const CATEGORIA_VALUES = new Set<string>(Object.values(CategoriaProducto));

const isCategoriaProducto = (status: string): status is CategoriaProducto =>
  CATEGORIA_VALUES.has(status.toLowerCase());

/**
 * Documentación en español.
 */
export const getStatusColor = (
  status: string
): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  if (!status) return 'default';
  const normalizedStatus =
    typeof status === 'string'
      ? status.toLowerCase()
      : String(status).toLowerCase();

  switch (normalizedStatus) {
    case 'success':
    case 'completed':
    case 'delivered':
    case 'entregado':
    case 'en_almacen':
    case 'approved':
    case 'recibido':
    case 'fácil':
    case 'entrada':
    case 'entrada_compra':
    case 'entrada_distribucion':
    case 'completado':
    case 'entregada':
      return 'success';
    case 'error':
    case 'failed':
    case 'cancelled':
    case 'cancelado':
    case 'rejected':
    case 'difícil':
    case 'salida':
    case 'salida_distribucion':
    case 'salida_elaboracion':
      return 'error';
    case 'warning':
    case 'review':
    case 'media':
    case 'ajuste':
    case 'pendiente':
    case 'preparada':
    case 'preparado':
      return 'warning';
    case 'in_progress':
    case 'en_proceso':
    case 'parcial':
    case 'info':
    case 'active':
    case 'archived':
    case 'pedido':
      return 'info';
    default:
      return 'default';
  }
};

const capitalize = (text: string) => {
  if (!text) return '';
  const spacedText = text.replace(/[_]/g, ' ');
  return spacedText.charAt(0).toUpperCase() + spacedText.slice(1);
};

const getTranslatedStatus = (status: string) => {
  if (!status) return '—';
  return capitalize(String(status));
};

/**
 * Documentación en español.
 */
export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  size = 'small',
  variant = 'outlined',
  ...rest
}) => {
  const { t } = useTranslation();
  const statusStr = status as string;
  const isCategoria = isCategoriaProducto(statusStr);

  const resolvedColor = getStatusColor(statusStr);

  const getI18nLabel = (s: string): string => {
    if (!s) return '—';
    const normalized = s.toLowerCase();
    if (isCategoria) {
      return getEnumLabel(t, 'productoCategoria', s);
    }

    if (
      normalized.includes('entrada') ||
      normalized.includes('salida') ||
      normalized === 'ajuste' ||
      normalized === 'pedido'
    ) {
      return getEnumLabel(t, 'movimientoTipo', s);
    }

    if (['faltante', 'exceso', 'defectuoso'].includes(normalized)) {
      return getEnumLabel(t, 'tipoDiferencia', s);
    }

    if (
      ['pendiente', 'reclamado', 'abonado', 'reenviado'].includes(normalized)
    ) {
      return getEnumLabel(t, 'estadoReclamacion', s);
    }

    if (['fácil', 'media', 'difícil'].includes(normalized)) {
      return getEnumLabel(t, 'recetaDificultad', s);
    }

    if (['g', 'kg', 'l', 'ml', 'pieza', 'cda', 'cdta'].includes(normalized)) {
      return getEnumLabel(t, 'recetaUnidad', s);
    }

    return getTranslatedStatus(normalized);
  };

  const displayLabel = label || getI18nLabel(statusStr);

  // Icono de punto para estados que no son categorías
  const dotIcon = (
    <FiberManualRecordIcon sx={{ fontSize: '10px !important' }} />
  );

  const resolvedIcon =
    rest.icon ||
    (isCategoria
      ? getCategoryIconFilled(statusStr.toLowerCase() as CategoriaProducto, {
          sx: { fontSize: 14 },
        })
      : dotIcon);

  return (
    <Chip
      {...rest}
      label={displayLabel}
      color={resolvedColor}
      size={size}
      variant={variant}
      icon={resolvedIcon}
      sx={{
        fontWeight: 600,
        borderRadius: '6px',
        textTransform: 'uppercase',
        fontSize: '0.65rem',
        letterSpacing: '0.025em',
        ...(isCategoria && {
          minWidth: CATEGORY_CHIP_MIN_WIDTH,
          justifyContent: 'center',
          '& .MuiChip-icon': {
            marginLeft: '0px',
            marginRight: '2px',
            fontSize: 14,
          },
        }),
        ...(!isCategoria && {
          '& .MuiChip-icon': {
            marginLeft: '6px',
            marginRight: '-4px',
          },
        }),
        ...rest.sx,
      }}
    />
  );
};

export default StatusChip;
