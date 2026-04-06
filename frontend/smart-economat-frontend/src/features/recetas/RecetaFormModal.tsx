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

const recetaFormSchema: DynamicField[] = [
  { name: 'nombre', label: 'Nombre de la Receta', required: true, width: 12 },
  {
    name: 'tiempoPreparacion',
    label: 'Tiempo de preparación',
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
    label: 'Dificultad',
    type: 'select',
    required: true,
    width: 6,
    options: [
      { value: DificultadReceta.FACIL, label: 'Fácil' },
      { value: DificultadReceta.MEDIA, label: 'Media' },
      { value: DificultadReceta.DIFICIL, label: 'Difícil' },
    ],
  },
  {
    name: 'instrucciones',
    label: 'Instrucciones de elaboración',
    type: 'textarea',
    required: true,
    width: 12,
  },
  {
    name: 'rendimiento',
    label: 'Rendimiento estimado',
    type: 'number',
    width: 6,
  },
  {
    name: 'unidadResultado',
    label: 'Unidad',
    type: 'select',
    width: 6,
    options: Object.values(UnidadIngrediente).map((unidad) => ({
      value: unidad as string,
      label: unidad as string,
    })),
  },
  {
    name: 'diasCaducidad',
    label: 'Días de caducidad',
    type: 'number',
    width: 3,
  },
  {
    name: 'costeUnitarioEstimado',
    label: 'Coste est. (info)',
    type: 'number',
    width: 3,
    disabled: true,
  },
  {
    name: 'raciones',
    label: 'Raciones (base)',
    type: 'number',
    width: 3,
  },
  {
    name: 'tamanioRacion',
    label: 'Tamaño ración',
    type: 'number',
    width: 3,
  },
  {
    name: 'ingredientes',
    label: 'Ingredientes de la receta',
    type: 'recipeIngredients',
    position: 'bottom',
  },
  {
    name: 'imagen',
    label: 'Imagen de la receta',
    type: 'image',
    required: false,
    width: 12,
    position: 'left',
  },
];

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
  const isEditing = Boolean(initialData.id);

  return (
    <DynamicFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        title ??
        (isEditing
          ? `Editar: ${String(initialData.nombre || '')}`
          : 'Nueva Receta')
      }
      size="lg"
      fields={recetaFormSchema}
      initialData={initialData}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      requireConfirmation={true}
      confirmationMessage={
        isEditing
          ? '¿Estás seguro de que deseas guardar los cambios realizados en esta receta?'
          : '¿Estás seguro de que deseas añadir esta nueva receta al sistema?'
      }
    />
  );
};

export default RecetaFormModal;
