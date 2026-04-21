import React from 'react';
import DynamicFormModal, {
  DynamicField,
  DynamicFormModalProps,
} from '../../components/ui/DynamicFormModal';
import {
  DificultadReceta,
  TiempoReceta,
  UnidadIngrediente,
} from '../../services/receta.types';
import { useTranslation } from 'react-i18next';

type RecetaFormModalProps = Pick<
  DynamicFormModalProps,
  'isOpen' | 'onClose' | 'initialData' | 'onSubmit' | 'isSubmitting'
> & {
  title?: DynamicFormModalProps['title'];
};

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
      label: t('recetaFormModal.fields.nombre'),
      required: true,
      width: 12,
    },
    {
      name: 'tiempoPreparacion',
      label: t('recetaFormModal.fields.tiempoPreparacion'),
      type: 'select',
      required: true,
      width: 6,
      options: [
        { value: TiempoReceta.MIN_10, label: '10 min' },
        { value: TiempoReceta.MIN_20, label: '20 min' },
        { value: TiempoReceta.MIN_30, label: '30 min' },
        { value: TiempoReceta.MIN_45, label: '45 min' },
        { value: TiempoReceta.MIN_60, label: '60 min' },
      ],
    },
    {
      name: 'dificultad',
      label: t('recetaFormModal.fields.dificultad'),
      type: 'select',
      required: true,
      width: 6,
      options: [
        {
          value: DificultadReceta.FACIL,
          label: t('recetaFormModal.difficulty.FACIL'),
        },
        {
          value: DificultadReceta.MEDIA,
          label: t('recetaFormModal.difficulty.MEDIA'),
        },
        {
          value: DificultadReceta.DIFICIL,
          label: t('recetaFormModal.difficulty.DIFICIL'),
        },
      ],
    },
    {
      name: 'instrucciones',
      label: t('recetaFormModal.fields.instrucciones'),
      type: 'textarea',
      required: true,
      width: 12,
    },
    {
      name: 'rendimiento',
      label: t('recetaFormModal.fields.rendimiento'),
      type: 'number',
      width: 6,
    },
    {
      name: 'unidadResultado',
      label: t('recetaFormModal.fields.unidadResultado'),
      type: 'select',
      width: 6,
      options: Object.values(UnidadIngrediente).map((unidad) => ({
        value: unidad as string,
        label: unidad as string,
      })),
    },
    {
      name: 'diasCaducidad',
      label: t('recetaFormModal.fields.diasCaducidad'),
      type: 'number',
      width: 3,
    },
    {
      name: 'costeUnitarioEstimado',
      label: t('recetaFormModal.fields.costeUnitarioEstimado'),
      type: 'number',
      width: 3,
      disabled: true,
    },
    {
      name: 'raciones',
      label: t('recetaFormModal.fields.raciones'),
      type: 'number',
      width: 3,
    },
    {
      name: 'tamanioRacion',
      label: t('recetaFormModal.fields.tamanioRacion'),
      type: 'number',
      width: 3,
    },
    {
      name: 'ingredientes',
      label: t('recetaFormModal.fields.ingredientes'),
      type: 'recipeIngredients',
      position: 'bottom',
    },
    {
      name: 'imagen',
      label: t('recetaFormModal.fields.imagen'),
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
          ? t('recetaFormModal.editTitle', {
              name: String(initialData.nombre || ''),
            })
          : t('recetaFormModal.createTitle'))
      }
      size="lg"
      fields={recetaFormSchema}
      initialData={initialData}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      requireConfirmation={true}
      confirmationMessage={
        isEditing
          ? t('recetaFormModal.confirmEdit')
          : t('recetaFormModal.confirmCreate')
      }
    />
  );
};

export default RecetaFormModal;
