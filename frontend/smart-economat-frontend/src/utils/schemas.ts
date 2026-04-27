import { DynamicField } from '../components/ui/DynamicFormModal';
import { MotivoMerma } from '../services/merma.types';

export const getMermaSchema = (t: (key: string) => string): DynamicField[] => [
  {
    name: 'productoId',
    label: t('mermas.fields.product'),
    type: 'select',
    required: true,
    options: [], // Se rellena dinámicamente
  },
  {
    name: 'cantidad',
    label: t('mermas.fields.quantity'),
    type: 'number',
    required: true,
  },
  {
    name: 'motivo',
    label: t('mermas.fields.reason'),
    type: 'select',
    required: true,
    options: [
      {
        value: MotivoMerma.ROTURA,
        label: t('movimientos.types.MERMA') + ' - ' + t('mermas.fields.reason'),
      },
      {
        value: MotivoMerma.DETERIORO,
        label: t('mermas.reasons.deterioro') || 'Deterioro / Caducidad',
      },
      {
        value: MotivoMerma.HURTO,
        label: t('mermas.reasons.hurto') || 'Hurto / Pérdida',
      },
      {
        value: MotivoMerma.ERROR_PREPARACION,
        label: t('mermas.reasons.error_preparacion') || 'Error de preparación',
      },
      {
        value: MotivoMerma.OTROS,
        label: t('mermas.reasons.otros') || 'Otros motivos',
      },
    ],
  },
  {
    name: 'notas',
    label: t('mermas.fields.notes'),
    type: 'textarea',
    position: 'bottom',
  },
];
