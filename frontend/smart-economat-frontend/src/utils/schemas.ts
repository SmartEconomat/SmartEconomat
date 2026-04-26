import { DynamicField } from '../components/ui/DynamicFormModal';
import { MotivoMerma } from '../services/merma.types';
import i18n from '../i18n';

/**
 * Documentación en español.
 */

/**
 * Documentación en español.
 */
export function getMermaSchema(): DynamicField[] {
  const t = i18n.t.bind(i18n);
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
      options: [
        {
          value: MotivoMerma.ROTURA,
          label: t('merma.form.motivoOpciones.roturaEnvase'),
        },
        {
          value: MotivoMerma.DETERIORO,
          label: t('merma.form.motivoOpciones.deterioroCaducidad'),
        },
        {
          value: MotivoMerma.HURTO,
          label: t('merma.form.motivoOpciones.hurto'),
        },
        {
          value: MotivoMerma.ERROR_PREPARACION,
          label: t('merma.form.motivoOpciones.errorPreparacion'),
        },
        {
          value: MotivoMerma.OTROS,
          label: t('merma.form.motivoOpciones.otros'),
        },
      ],
    },
    {
      name: 'notas',
      label: t('merma.form.observaciones'),
      type: 'textarea',
      position: 'bottom',
    },
  ];
}

/**
 * Documentación en español.
 */
export const mermaSchema: DynamicField[] = getMermaSchema();
