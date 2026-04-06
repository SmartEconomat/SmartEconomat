import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { EstadoLote, PurchaseBatch } from '../../../services/pedido.types';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { SvgIconTypeMap } from '@mui/material';

export type ActionType = 'tramitar' | 'recepcion' | 'distribucion' | 'none';

export interface NextActionMetadata {
  label: string;
  icon: OverridableComponent<SvgIconTypeMap<object, 'svg'>>;
  color:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning'
    | 'inherit';
  action: ActionType;
  disabled?: boolean;
  tooltip?: string;
}

/**
 * Determina la siguiente acción lógica para un lote de compra basándose en su estado.
 */
export const getNextBatchAction = (
  batch: PurchaseBatch,
  options: {
    hasPedidosDistribuibles?: boolean;
    isRecepcionCompleted?: boolean;
  } = {}
): NextActionMetadata => {
  const estado = String(batch.estado);

  // 1. PENDIENTE -> Tramitar
  if (estado === EstadoLote.PENDIENTE) {
    return {
      label: 'Tramitar',
      icon: AssignmentTurnedInIcon,
      color: 'info',
      action: 'tramitar',
      tooltip: 'Marcar como pedido al proveedor',
    };
  }

  // 2. PARCIAL -> Recibir Mercancía
  if (estado === EstadoLote.PARCIAL) {
    return {
      label: 'Recibir Mercancía',
      icon: LoginOutlinedIcon,
      color: 'success',
      action: 'recepcion',
      tooltip: 'Registrar la entrada de productos',
    };
  }

  // 3. COMPLETADO -> Distribuir
  if (estado === EstadoLote.COMPLETADO) {
    const canDistribute = options.hasPedidosDistribuibles ?? true;
    return {
      label: 'Distribuir productos a los usuarios',
      icon: CallSplitIcon,
      color: 'secondary',
      action: 'distribucion',
      disabled: !canDistribute,
      tooltip: canDistribute
        ? 'Repartir productos a los usuarios'
        : 'No hay pedidos individuales para distribuir',
    };
  }

  // Caso por defecto: Todo finalizado
  return {
    label: 'Finalizado',
    icon: CheckCircleOutlineIcon,
    color: 'inherit',
    action: 'none',
    disabled: true,
    tooltip: 'Todas las acciones logísticas han sido completadas',
  };
};
