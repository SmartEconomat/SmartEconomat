import { DynamicField } from '../components/ui/DynamicFormModal';
import { CategoriaProducto, UnidadMedida } from '../services/producto.types';
import { DificultadReceta, TiempoReceta } from '../services/receta.types';

export const productoSchema: DynamicField[] = [
  { name: 'nombre', label: 'Nombre Comercial', required: true },
  { name: 'marca', label: 'Marca' },
  { name: 'descripcion', label: 'Descripción' },
  {
    name: 'contenido',
    label: 'Contenido Numérico',
    type: 'number',
    required: true,
  },
  {
    name: 'unidad',
    label: 'Unidad de Medida',
    type: 'select',
    options: [
      { value: UnidadMedida.KG, label: 'Kg' },
      { value: UnidadMedida.G, label: 'Gramo' },
      { value: UnidadMedida.L, label: 'Litro' },
      { value: UnidadMedida.ML, label: 'Mililitro' },
      { value: UnidadMedida.UNIDAD, label: 'Unidad' },
      { value: UnidadMedida.PAQ, label: 'Paquete' },
    ],
    required: true,
    width: 4,
  },
  {
    name: 'tipo',
    label: 'Categoría',
    type: 'select',
    width: 4,
    options: [
      { value: CategoriaProducto.VERDURA, label: 'Verdura' },
      { value: CategoriaProducto.FRUTA, label: 'Fruta' },
      { value: CategoriaProducto.CARNE, label: 'Carne' },
      { value: CategoriaProducto.PESCADO, label: 'Pescado' },
      { value: CategoriaProducto.MARISCO, label: 'Marisco' },
      { value: CategoriaProducto.LACTEO, label: 'Lácteo' },
      { value: CategoriaProducto.HUEVO, label: 'Huevo' },
      { value: CategoriaProducto.CEREAL, label: 'Cereal' },
      { value: CategoriaProducto.LEGUMBRE, label: 'Legumbre' },
      { value: CategoriaProducto.FRUTO_SECO, label: 'Fruto Seco' },
      { value: CategoriaProducto.CONDIMENTO, label: 'Condimento' },
      { value: CategoriaProducto.ACEITE, label: 'Aceite' },
      { value: CategoriaProducto.AZUCAR, label: 'Azúcar' },
      { value: CategoriaProducto.BEBIDA, label: 'Bebida' },
      { value: CategoriaProducto.OTRO, label: 'Otro' },
    ],
  },
  { name: 'codigoBarras', label: 'Código de Barras' },
  {
    name: 'imagen',
    label: 'Cargar Imagen',
    type: 'image',
  },
  {
    name: 'alergenos',
    label: 'Alérgenos Presentes',
    type: 'allergens',
    position: 'bottom',
  },
  {
    name: 'proveedores',
    label: 'Proveedores Asociados',
    type: 'proveedores',
    position: 'bottom',
  },
];

export const pedidoSchema: DynamicField[] = [
  {
    name: 'proveedorId',
    label: 'Proveedor',
    type: 'select',
    required: true,
    options: [], // Se rellena dinámicamente en el componente
  },
  {
    name: 'fechaEntrega',
    label: 'Fecha de Entrega Estimada',
    type: 'date',
    required: false,
  },
  {
    name: 'observaciones',
    label: 'Observaciones Generales',
    type: 'textarea',
    position: 'bottom',
  },
  {
    name: 'pedidoProductos',
    label: 'Detalle de Productos',
    type: 'orderLines',
    position: 'bottom',
  },
];

export const recetaSchema: DynamicField[] = [
  { name: 'nombre', label: 'Nombre de la Receta', required: true, width: 8 },
  {
    name: 'tiempoPreparacion',
    label: 'Tiempo (ej: 30 min)',
    required: true,
    width: 4,
  },
  {
    name: 'tiempo',
    label: 'Franja de tiempo',
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
    name: 'ingredientes',
    label: 'Ingredientes de la receta',
    type: 'recipeIngredients',
    position: 'bottom',
  },
];
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
    label: 'Cantidad a descontar',
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
