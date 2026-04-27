import React, { useMemo } from 'react';
import { Chip, ChipProps } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useTranslation } from 'react-i18next';
import { CategoriaProducto } from '../../services/producto.types';
import { getCategoryIconFilled } from '../../features/productos/utils/getCategoryIconFilled';
import {
  StatusType,
  getStatusColor,
  isCategoriaProducto,
  capitalize,
  CATEGORY_CHIP_MIN_WIDTH,
} from './StatusChip.utils';

export interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: StatusType | string;
  label?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  size = 'small',
  variant = 'outlined',
  ...rest
}) => {
  const { t } = useTranslation();
  const statusStr = (status as string).toLowerCase();
  const isCategoria = isCategoriaProducto(statusStr);

  const statusTranslations = useMemo<Record<string, string>>(
    () => ({
      success: t('common.status.success'),
      completed: t('common.status.completed'),
      delivered: t('common.status.delivered'),
      entregado: t('common.status.delivered'),
      en_almacen: t('common.status.delivered'),
      approved: t('common.status.approved'),
      error: t('common.status.error'),
      failed: t('common.status.failed'),
      cancelled: t('common.status.cancelled'),
      cancelado: t('common.status.cancelled'),
      rejected: t('common.status.rejected'),
      warning: t('common.status.warning'),
      pending: t('common.status.pending'),
      pendiente: t('common.status.pending'),
      in_progress: t('common.status.in_progress'),
      en_proceso: t('common.status.in_progress'),
      recibido: t('common.status.received'),
      review: t('common.status.review'),
      info: t('common.status.info'),
      active: t('common.status.active'),
      archived: t('common.status.archived'),
      fácil: t('recetas.difficulty.facil'),
      media: t('recetas.difficulty.media'),
      difícil: t('recetas.difficulty.dificil'),
      unknown: t('common.status.unknown'),
      default: t('common.status.default'),
      entrada: t('movimientos.types.ENTRADA'),
      salida: t('movimientos.types.SALIDA'),
      ajuste: t('movimientos.types.AJUSTE'),
      pedido: t('movimientos.types.PEDIDO'),
      entrada_compra: t('movimientos.types.ENTRADA_COMPRA'),
      entrada_distribucion: t('movimientos.types.ENTRADA_DISTRIBUCION'),
      salida_distribucion: t('movimientos.types.SALIDA_DISTRIBUCION'),
      salida_elaboracion: t('movimientos.types.SALIDA_ELABORACION'),
      parcial: t('common.status.partial'),
      completado: t('common.status.completed'),
      preparada: t('recetas.status.por_recoger'),
      preparado: t('recetas.status.por_recoger'),
      entregada: t('recetas.status.entregada'),
    }),
    [t]
  );

  const categoriaTranslations = useMemo<Record<CategoriaProducto, string>>(
    () => ({
      [CategoriaProducto.VERDURA]: t('productos.categories.verdura'),
      [CategoriaProducto.FRUTA]: t('productos.categories.fruta'),
      [CategoriaProducto.CARNE]: t('productos.categories.carne'),
      [CategoriaProducto.PESCADO]: t('productos.categories.pescado'),
      [CategoriaProducto.MARISCO]: t('productos.categories.marisco'),
      [CategoriaProducto.LACTEO]: t('productos.categories.lacteo'),
      [CategoriaProducto.HUEVO]: t('productos.categories.huevo'),
      [CategoriaProducto.CEREAL]: t('productos.categories.cereal'),
      [CategoriaProducto.LEGUMBRE]: t('productos.categories.legumbre'),
      [CategoriaProducto.FRUTO_SECO]: t('productos.categories.fruto_seco'),
      [CategoriaProducto.CONDIMENTO]: t('productos.categories.condimento'),
      [CategoriaProducto.ACEITE]: t('productos.categories.aceite'),
      [CategoriaProducto.AZUCAR]: t('productos.categories.azucar'),
      [CategoriaProducto.BEBIDA]: t('productos.categories.bebida'),
      [CategoriaProducto.OTRO]: t('productos.categories.otro'),
    }),
    [t]
  );

  const resolvedColor = getStatusColor(statusStr);

  const getDisplayLabel = () => {
    if (label) return label;
    if (isCategoria) {
      const catKey = statusStr.toUpperCase() as keyof typeof CategoriaProducto;
      const catValue = CategoriaProducto[catKey];
      return categoriaTranslations[catValue] || capitalize(statusStr);
    }
    return statusTranslations[statusStr] || capitalize(statusStr);
  };

  const displayLabel = getDisplayLabel();

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
