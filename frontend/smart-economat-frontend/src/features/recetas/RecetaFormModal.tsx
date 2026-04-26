import React from 'react';
import { useTranslation } from 'react-i18next';
import DynamicFormModal, {
  DynamicField,
  DynamicFormModalProps,
} from '../../components/ui/DynamicFormModal';
import {
  DificultadReceta,
  TiempoReceta,
  UnidadIngrediente,
} from '../../services/receta.types';

type RecetaFormModalProps = Pick<
  DynamicFormModalProps,
  'isOpen' | 'onClose' | 'initialData' | 'onSubmit' | 'isSubmitting'
> & {
  title?: DynamicFormModalProps['title'];
};

/**
 * Documentación en español.
 */
const RecetaFormModal: React.FC<RecetaFormModalProps> = ({
  isOpen,
  onClose,
  initialData = {},
  onSubmit,
  isSubmitting = false,
  title,
}) => {
  const { t } = useTranslation();
  const isEditing = Boolean(initialData.id);

  const recetaFormSchema: DynamicField[] = [
    {
      name: 'nombre',
      label: t('receta.form.nombre'),
      required: true,
      width: 12,
    },
    {
      name: 'tiempoPreparacion',
      label: t('receta.form.tiempoPreparacion'),
      type: 'select',
      required: true,
      width: 6,
      options: [
        { value: TiempoReceta.MIN_10, label: t('receta.form.tiempo.10min') },
        { value: TiempoReceta.MIN_20, label: t('receta.form.tiempo.20min') },
        { value: TiempoReceta.MIN_30, label: t('receta.form.tiempo.30min') },
        { value: TiempoReceta.MIN_45, label: t('receta.form.tiempo.45min') },
        { value: TiempoReceta.MIN_60, label: t('receta.form.tiempo.60min') },
      ],
    },
    {
      name: 'dificultad',
      label: t('receta.form.dificultad'),
      type: 'select',
      required: true,
      width: 6,
      options: [
        {
          value: DificultadReceta.FACIL,
          label: t('receta.form.dificultadFacil'),
        },
        {
          value: DificultadReceta.MEDIA,
          label: t('receta.form.dificultadMedia'),
        },
        {
          value: DificultadReceta.DIFICIL,
          label: t('receta.form.dificultadDificil'),
        },
      ],
    },
    {
      name: 'instrucciones',
      label: t('receta.form.instrucciones'),
      type: 'textarea',
      required: true,
      width: 12,
    },
    {
      name: 'rendimiento',
      label: t('receta.form.rendimiento'),
      type: 'number',
      width: 6,
    },
    {
      name: 'unidadResultado',
      label: t('receta.form.unidadResultado'),
      type: 'select',
      width: 6,
      options: Object.values(UnidadIngrediente).map((unidad) => ({
        value: unidad as string,
        label: unidad as string,
      })),
    },
    {
      name: 'diasCaducidad',
      label: t('receta.form.diasCaducidad'),
      type: 'number',
      width: 3,
    },
    {
      name: 'costeUnitarioEstimado',
      label: t('receta.form.costeUnitarioEstimado'),
      type: 'number',
      width: 3,
      disabled: true,
    },
    {
      name: 'raciones',
      label: t('receta.form.raciones'),
      type: 'number',
      width: 3,
    },
    {
      name: 'tamanioRacion',
      label: t('receta.form.tamanioRacion'),
      type: 'number',
      width: 3,
    },
    {
      name: 'ingredientes',
      label: t('receta.form.ingredientes'),
      type: 'recipeIngredients',
      position: 'bottom',
    },
    {
      name: 'imagen',
      label: t('receta.form.imagen'),
      type: 'image',
      required: false,
      width: 12,
      position: 'left',
    },
  ];

  return (
    <DynamicFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        title ??
        (isEditing
          ? t('receta.form.tituloEditar', {
              nombre: String(initialData.nombre || ''),
            })
          : t('receta.form.tituloNueva'))
      }
      size="lg"
      fields={recetaFormSchema}
      initialData={initialData}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      requireConfirmation={true}
      confirmationMessage={
        isEditing
          ? t('receta.form.confirmarEdicion')
          : t('receta.form.confirmarCreacion')
      }
    />
  );
};

export default RecetaFormModal;
