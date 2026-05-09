import { DynamicField } from '../components/ui/DynamicFormModal';
import { MotivoMerma } from '../services/merma.types';
import i18n from '../i18n';
import { getEnumLabel } from '../i18n/enumPresentation';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * Obtiene merma schema.
 * @returns Valor resultante de la operación.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {DynamicField[]} Datos efectivos después de ejecutar la operación.
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
      options: Object.values(MotivoMerma).map((value) => ({
        value,
        label: getEnumLabel(i18n.t.bind(i18n), 'mermaMotivo', value),
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

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export const mermaSchema: DynamicField[] = getMermaSchema();
