import { DynamicField } from '../components/ui/DynamicFormModal';
import { MotivoMerma } from '../services/merma.types';

export const mermaSchema: DynamicField[] = [
  {
    name: 'productoId',
    label: 'Producto',
    type: 'select',
    required: true,
    options: [], // Se rellena dinámicamente
  },
  {
    name: 'cantidad',
    label: '¿Cuánto se perdió? (según la medida del producto)',
    type: 'number',
    required: true,
  },
  {
    name: 'motivo',
    label: 'Motivo de la merma',
    type: 'select',
    required: true,
    options: [
      { value: MotivoMerma.ROTURA, label: 'Rotura de envase' },
      { value: MotivoMerma.DETERIORO, label: 'Deterioro / Caducidad' },
      { value: MotivoMerma.HURTO, label: 'Hurto / Pérdida' },
      { value: MotivoMerma.ERROR_PREPARACION, label: 'Error de preparación' },
      { value: MotivoMerma.OTROS, label: 'Otros motivos' },
    ],
  },
  {
    name: 'notas',
    label: 'Observaciones / Notas',
    type: 'textarea',
    position: 'bottom',
  },
];
