import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
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

export interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: StatusType | string;
  label?: string;
}

// Ancho fijo para chips de categoría de producto
const CATEGORY_CHIP_MIN_WIDTH = 110;

// Conjunto de valores de CategoriaProducto para detección rápida
const CATEGORIA_VALUES = new Set<string>(Object.values(CategoriaProducto));

const isCategoriaProducto = (status: string): status is CategoriaProducto =>
  CATEGORIA_VALUES.has(status.toLowerCase());

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
  parcial: 'Tramitado',
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

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  size = 'small',
  variant = 'outlined',
  ...rest
}) => {
  const statusStr = status as string;
  const isCategoria = isCategoriaProducto(statusStr);

  const resolvedColor = getStatusColor(statusStr);
  const displayLabel =
    label ||
    (isCategoria
      ? categoriaTranslations[statusStr.toLowerCase() as CategoriaProducto]
      : getTranslatedStatus(statusStr));

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
