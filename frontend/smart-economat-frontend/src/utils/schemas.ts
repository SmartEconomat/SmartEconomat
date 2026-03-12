import { DynamicField } from '../components/ui/DynamicFormModal';
import { CategoriaProducto, UnidadMedida } from '../services/producto.types';
import { EstadoPedido } from '../services/pedido.types';
import { DificultadReceta, TiempoReceta } from '../services/receta.types';
import { getCategoryIcon } from '../features/productos/utils/getCategoryIcon';

export const productoSchema: DynamicField[] = [
    { name: 'nombre', label: 'Nombre Comercial', required: true },
    { name: 'marca', label: 'Marca' },
    { name: 'descripcion', label: 'Descripción' },
    { name: 'contenido', label: 'Contenido Numérico', type: 'number', required: true },
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
            { value: UnidadMedida.PAQ, label: 'Paquete' }
        ],
        required: true,
        width: 4
    },
    {
        name: 'tipo', label: 'Categoría', type: 'select', width: 4, options: [
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
            { value: CategoriaProducto.OTRO, label: 'Otro' }
        ]
    },

    { name: 'codigoBarras', label: 'Código de Barras' },
    {
        name: 'imagen',
        label: 'Cargar Imagen',
        type: 'image',
        getFallbackIcon: (formData) =>
            getCategoryIcon(formData.tipo as CategoriaProducto, {
                sx: { fontSize: 80, color: 'text.secondary', opacity: 0.5 },
            }),
    },
    {
        name: 'alergenos',
        label: 'Alérgenos Presentes',
        type: 'allergens',
        position: 'bottom'
    }
];

export const pedidoSchema: DynamicField[] = [
    {
        name: 'estado',
        label: 'Estado del Pedido',
        type: 'select',
        required: false,
        width: 6,
        options: [
            { value: EstadoPedido.PENDIENTE, label: 'Pendiente' },
            { value: EstadoPedido.EN_PROCESO, label: 'En Proceso' },
            { value: EstadoPedido.RECIBIDO, label: 'Recibido' },
            { value: EstadoPedido.PARCIAL, label: 'Parcial' },
            { value: EstadoPedido.INCIDENCIA, label: 'Incidencia' },
            { value: EstadoPedido.CANCELADO, label: 'Cancelado' },
        ],
    },
    { name: 'fechaEntrega', label: 'Fecha de Entrega', type: 'date', width: 6 },
    {
        name: 'proveedorId',
        label: 'Proveedor',
        type: 'select',
        required: false,
        width: 6,
        options: [], // Se debe poblar dinámicamente
    },
    {
        name: 'motivoCancelacion',
        label: 'Motivo de Cancelación (Si aplica)',
        type: 'text',
        width: 12,
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
    { name: 'tiempoPreparacion', label: 'Tiempo (ej: 30 min)', required: true, width: 4 },
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
