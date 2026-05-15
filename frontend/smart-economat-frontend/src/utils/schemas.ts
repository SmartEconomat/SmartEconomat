import type { TFunction } from 'i18next';
import { DynamicField } from '../components/ui/DynamicFormModal';
import { MotivoMerma } from '../services/merma.types';
import { getEnumLabel } from '../i18n/enumPresentation';

/**
 * Campos del formulario de registro de merma (labels reactivos al idioma).
 */
export function getMermaSchema(t: TFunction): DynamicField[] {
  return [
    {
      name: 'productoId',
      label: t('merma.form.producto'),
      type: 'select',
      required: true,
      options: [],
    },
    {
      name: 'cantidad',
      label: t('merma.form.cantidad'),
      type: 'number',
      required: true,
    },
    {
      name: 'motivo',
      label: t('merma.form.motivo'),
      type: 'select',
      required: true,
      options: Object.values(MotivoMerma).map((value) => ({
        value,
        label: getEnumLabel(t, 'mermaMotivo', value),
      })),
    },
    {
      name: 'notas',
      label: t('merma.form.observaciones'),
      type: 'textarea',
      position: 'bottom',
    },
  ];
}
