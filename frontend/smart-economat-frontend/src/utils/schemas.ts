import { DynamicField } from '../components/ui/DynamicFormModal';
import { MotivoMerma } from '../services/merma.types';
import i18n from '../i18n';

/**
 * @module schemas
 * Definiciones de esquemas de formularios dinámicos.
 *
 * Los esquemas se generan como funciones para poder usar traducciones i18n
 * actualizadas en el momento de la llamada, de modo que reflejan el idioma
 * activo cuando se renderiza el formulario.
 */

/**
 * Genera el esquema de campos para el formulario de registro de merma.
 *
 * Se define como función (no como constante) para que las etiquetas
 * se traduzcan según el idioma activo en el momento de la llamada.
 *
 * @returns {DynamicField[]} Array de definiciones de campos del formulario.
 * @example
 * const fields = getMermaSchema();
 * // => [{ name: 'productoId', label: 'Producto', ... }, ...]
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
        { value: MotivoMerma.ROTURA, label: t('merma.form.motivoOpciones.roturaEnvase') },
        { value: MotivoMerma.DETERIORO, label: t('merma.form.motivoOpciones.deterioroCaducidad') },
        { value: MotivoMerma.HURTO, label: t('merma.form.motivoOpciones.hurto') },
        { value: MotivoMerma.ERROR_PREPARACION, label: t('merma.form.motivoOpciones.errorPreparacion') },
        { value: MotivoMerma.OTROS, label: t('merma.form.motivoOpciones.otros') },
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
 * Esquema de merma con etiquetas estáticas.
 *
 * @deprecated Usar `getMermaSchema()` para obtener etiquetas traducidas.
 * Mantenido por compatibilidad con consumidores existentes.
 */
export const mermaSchema: DynamicField[] = getMermaSchema();
