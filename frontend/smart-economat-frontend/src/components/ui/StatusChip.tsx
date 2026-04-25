import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useTranslation } from 'react-i18next';
import { CategoriaProducto } from '../../services/producto.types';
import { getCategoryIconFilled } from '../../features/productos/utils/getCategoryIconFilled';

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
 * Props for the {@link StatusChip} component.
 */
export interface StatusChipProps extends Omit<ChipProps, 'color'> {
  /**
   * Status or category value used to derive the chip colour and default label.
   * Accepts any {@link StatusType} string or a {@link CategoriaProducto} value.
   */
  status: StatusType | string;
  /** Override for the displayed label. When omitted, the status is translated automatically. */
  label?: string;
}

// Ancho fijo para chips de categoría de producto
const CATEGORY_CHIP_MIN_WIDTH = 110;

// Conjunto de valores de CategoriaProducto para detección rápida
const CATEGORIA_VALUES = new Set<string>(Object.values(CategoriaProducto));

const isCategoriaProducto = (status: string): status is CategoriaProducto =>
  CATEGORIA_VALUES.has(status.toLowerCase());

/**
 * Maps a status string to a MUI semantic colour.
 *
 * Normalises the input to lower-case before matching against known status
 * tokens. Returns `'default'` for unrecognised values.
 *
 * @param status - The raw status string to evaluate.
 * @returns A MUI colour string suitable for `Chip`'s `color` prop.
 * @example
 * getStatusColor('completed'); // 'success'
 * getStatusColor('cancelled'); // 'error'
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

const statusTranslations: Record<string, string> = {
  success: 'Éxito',
  completed: 'Completado',
  delivered: 'En almacén',
  entregado: 'En almacén',
  en_almacen: 'En almacén',
  approved: 'Aprobado',
  error: 'Error',
  failed: 'Fallido',
  cancelled: 'Cancelado',
  cancelado: 'Cancelado',
  rejected: 'Rechazado',
  warning: 'Advertencia',
  pending: 'Pendiente',
  pendiente: 'Pendiente',
  in_progress: 'En progreso',
  en_proceso: 'En proceso',
  recibido: 'Recibido',
  review: 'En revisión',
  info: 'Info',
  active: 'Activo',
  archived: 'Archivado',
  fácil: 'Fácil',
  media: 'Media',
  difícil: 'Difícil',
  unknown: 'Desconocido',
  default: 'Por defecto',
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
  pedido: 'Pedido',
  entrada_compra: 'Entrada compra',
  entrada_distribucion: 'Entrada distribución',
  salida_distribucion: 'Salida distribución',
  salida_elaboracion: 'Salida elaboración',
  parcial: 'Parcial',
  completado: 'Completado',
  preparada: 'Por recoger',
  preparado: 'Por recoger',
  entregada: 'Entregada',
};

const categoriaTranslations: Record<CategoriaProducto, string> = {
  [CategoriaProducto.VERDURA]: 'Verdura',
  [CategoriaProducto.FRUTA]: 'Fruta',
  [CategoriaProducto.CARNE]: 'Carne',
  [CategoriaProducto.PESCADO]: 'Pescado',
  [CategoriaProducto.MARISCO]: 'Marisco',
  [CategoriaProducto.LACTEO]: 'Lácteo',
  [CategoriaProducto.HUEVO]: 'Huevo',
  [CategoriaProducto.CEREAL]: 'Cereal',
  [CategoriaProducto.LEGUMBRE]: 'Legumbre',
  [CategoriaProducto.FRUTO_SECO]: 'Fruto seco',
  [CategoriaProducto.CONDIMENTO]: 'Condimento',
  [CategoriaProducto.ACEITE]: 'Aceite',
  [CategoriaProducto.AZUCAR]: 'Azúcar',
  [CategoriaProducto.BEBIDA]: 'Bebida',
  [CategoriaProducto.OTRO]: 'Otro',
};

const capitalize = (text: string) => {
  if (!text) return '';
  const spacedText = text.replace(/[_]/g, ' ');
  return spacedText.charAt(0).toUpperCase() + spacedText.slice(1);
};

const getTranslatedStatus = (status: string) => {
  if (!status) return '—';
  const normalized =
    typeof status === 'string'
      ? status.toLowerCase()
      : String(status).toLowerCase();
  if (statusTranslations[normalized]) {
    return statusTranslations[normalized];
  }
  return capitalize(String(status));
};

/**
 * Versatile status/category chip component.
 *
 * Automatically resolves the MUI colour, translated label, and icon based on
 * the `status` value. Works for workflow statuses (e.g. `'completed'`, `'cancelled'`)
 * as well as product category values from {@link CategoriaProducto}.
 *
 * @param props - See {@link StatusChipProps}.
 * @returns JSX element rendering a styled MUI `Chip`.
 * @example
 * <StatusChip status="completed" />
 * <StatusChip status={CategoriaProducto.VERDURA} />
 * <StatusChip status="pending" label="Awaiting review" />
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
    // Try status namespace first, then categoria
    const statusKey = `status.${s}`;
    const statusTranslated = t(statusKey, { defaultValue: '' });
    if (statusTranslated) return statusTranslated;
    if (isCategoria) {
      const catKey = `categoria.${s.toUpperCase()}`;
      const catTranslated = t(catKey, { defaultValue: '' });
      if (catTranslated) return catTranslated;
      return (
        categoriaTranslations[normalized as CategoriaProducto] || capitalize(s)
      );
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
