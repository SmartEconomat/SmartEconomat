# DynamicFormModal Component

Un modal dinámico para renderizar formularios genéricos y reutilizables en cualquier pantalla de la aplicación.
Toma los datos o un esquema definido para construir automáticamente campos de entrada de texto, números, casillas o selectores e incluye un botón de "Aceptar" y "Cancelar" integrados.

## Ubicación
`src/components/ui/DynamicFormModal.tsx`

## Propiedades (Props)

Hereda de `ModalProps` pero sobreescribe su comportamiento de campos internos (no acepta un `children`).

| Propiedad | Tipo | Obligatorio | Descripción |
| :--- | :--- | :---: | :--- |
| `fields` | `DynamicField[]` | No | Esquema detallado de los campos del formulario. Si no se provee, la forma se auto-generará basado en las claves de `initialData`. |
| `initialData` | `Record<string, any>` | No | Valores iniciales del formulario para editar. |
| `onSubmit` | `(data: Record<string, any>) => void \| Promise<void>` | Sí | Evento desencadenado al pulsar "Aceptar". |
| `onCancel` | `() => void` | No | Evento desencadenado al cancelar. |
| `submitLabel` | `string` | No | Etiqueta para el botón principal (por defecto "Aceptar"). |
| `cancelLabel` | `string` | No | Etiqueta para el botón secundario (por defecto "Cancelar"). |
| `isSubmitting` | `boolean` | No | Desactiva los botones y muestra un spinner de carga y estado. |

### Configuración del Esquema (`fields`)

| Propiedad | Tipo | Obligatorio | Descripción |
| :--- | :--- | :---: | :--- |
| `name` | `string` | Sí | Nombre interno del campo (y será la clave en el objeto resultante `onSubmit`). |
| `label` | `string` | Sí | Etiqueta visible del componente. |
| `type` | `'text' \| 'number' \| 'boolean' \| 'select' \| 'date' \| 'image' \| 'allergens'` | No | Renderiza el input adecuado para la interfaz. Tipo predeterminado: `text`. |
| `required` | `boolean` | No | Marca el campo como requerido. |
| `options` | `SelectOption[]` | No | Para los tipos `select`, lista de opciones (`{ value, label }`). |
| `defaultValue` | `any` | No | Valor por defecto en formularios vacíos. |
| `disabled` | `boolean` | No | Desactivar el campo para edición. |
| `position` | `'left' \| 'right' \| 'bottom'` | No | Ubica el componente en distintas áreas del modal (aplicable en vistas no móviles). |
| `width` | `number` | No | Ancho proporcional del campo (grilla 1-12) a partir de la vista móvil. Defecto: 12. |

## Uso básico (Auto generado)

El formulario inferirá (según el tipo JS en ejecución) el tipo de componente necesario para la UI.
```tsx
const data = { nombre: 'Tomates', cantidad: 5, perecedero: true };

<DynamicFormModal
   isOpen={true}
   title="Editar Ingrediente"
   initialData={data}
   onSubmit={async (datosActualizados) => console.log(datosActualizados)}
   onClose={() => setOpen(false)}
/>
```

## Uso avanzado (Basado en Esquema)

Cuando las entidades son más complejas, como la necesidad de referenciar las categorías, unidades de productos del back, usamos el array de esquema explícito:

```tsx
import DynamicFormModal, { DynamicField } from '../components/ui/DynamicFormModal';
import { CategoriaProducto, UnidadMedida } from '../../services/producto.types';

const esquemaProducto: DynamicField[] = [
    { name: 'nombre', label: 'Nombre Comercial', required: true },
    { name: 'marca', label: 'Marca' },
    { name: 'contenido', label: 'Contenido Numérico', type: 'number', required: true },
    { 
       name: 'unidad', 
       label: 'Unidad de Medida', 
       type: 'select', 
       options: [
         { value: UnidadMedida.KILOGRAMO, label: 'Kg' },
         { value: UnidadMedida.LITRO, label: 'Litro' },
         { value: UnidadMedida.UNIDAD, label: 'Uds' }
       ],
       required: true,
       width: 4 
    },
    { name: 'fechaCaducidad', label: 'Fecha de Caducidad', type: 'date', width: 4 },
    { name: 'alergenos', label: 'Alérgenos', type: 'allergens', position: 'bottom' }
];

<DynamicFormModal
   isOpen={isOpen}
   title="Editar Ficha del Producto"
   fields={esquemaProducto}
   initialData={productoData}
   onSubmit={handleSave}
   onClose={() => setIsOpen(false)}
/>
```
