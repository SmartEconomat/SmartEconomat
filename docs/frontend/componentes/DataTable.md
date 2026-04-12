# Componente visual genérico: DataTable

El componente \`DataTable\` es una tabla de datos altamente personalizable y reutilizable diseñada con Material UI. Está construido con TypeScript para aceptar genéricos, permitiéndo ser estricto con los tipos de las columnas en relación a los datos.

## Propósito

Ofrecer una solución unificada en toda la aplicación para mostrar listas, evitando la duplicación del marcado de tablas. Soporta de fábrica:
- Columnas configurables con soporte para enlazado rápido a propiedades de la interfaz, o renderizado de valor custom (\`render\`).
- Controles incrustados de paginación de Material UI (\`<Pagination />\`).
- Gestión integrada de estados de \`loading\` (empleando el componente \`<Spinner />\`).
- Personalización de vistas de estados vacíos (\`empty states\`).
- *Slots* dedicados opcionales para botones de acciones en cada fila (por ejemplo: "Ver Detalles", "Editar", "Eliminar").
- **UI de Ordenamiento Mejorada**: Flechas de ordenamiento con `space-between` para una mejor legibilidad.
- **Acciones Estabilizadas**: Soporte para contenedores de ancho fijo en acciones para evitar saltos visuales cuando se ocultan botones condicionalmente (ej. botón de resolución).
- **Modo de Vista Controlado**: Soporte para sincronización externa del modo de vista (Lista/Cuadrícula).
- **Anti-CLS (Estabilidad de Layout) ✅**: Sincronización estricta de anchos de columna entre `TableHead`, `TableRow` y `Skeletons` para una carga fluida sin saltos visuales.
- **Accesibilidad Universal (WAVE Ready) ✅**: Etiquetas `aria-label` integradas en todos los controles de paginación y selectores de filas mediante `slotProps`. Soporte para lectura de códigos de barras cifra a cifra.
- **Navegación Operativa ✅**: Soporte nativo para saltos rápidos mediante el atajo **F4** y navegación por teclado en filas interactivas.

## Navegación por Teclado e Interacción

El componente `DataTable` está optimizado para la eficiencia en teclado:
1.  **Salto Directo (`F4`)**: Al pulsar la tecla F4, el foco se desplaza instantáneamente al contenedor de la tabla (`#results-area`).
2.  **Filas Interactivas**: Si se provee la prop `onRowClick`, cada fila:
    -   Se incluye en el orden de tabulación (`tabIndex={0}`).
    -   Permite activación mediante las teclas `Enter` o `Espacio`.
    -   Muestra un "Focus Ring" (resalte visual) distintivo al recibir el foco táctil o de teclado.
3.  **Encabezados Ordenables**: Los títulos de columna que permiten ordenamiento son accesibles mediante `Tab` y se activan con teclado, permitiendo gestionar la vista de datos sin usar el ratón.

## Props Principales (\`DataTableProps<T>\`)

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `columns` | `Column<T>[]` | Array de configuración de las columnas. Cada objeto `Column` debe especificar `id`, `label`. Soporta opcionalmente: `align`, `render(row: T)`, `hideOnMobile`, `responsiveDisplay: Record<Breakpoint, 'none' | 'table-cell'>`, `sortable`. |
| \`data\` | \`T[]\` | Los datos crudos que alimentarán el cuerpo de la tabla. |
| \`isLoading\` | \`boolean\` | (Opcional) Indica a la tabla que debe mostrar el \`Spinner\` en lugar de los datos. |
| `emptyStateMessage`| `ReactNode` | (Opcional) Contenido a renderizar cuando el array `data` esté vacío. |
| `pagination` | `Object` | (Opcional) Estructura con `currentPage`, `totalPages`, `onPageChange` (requeridas). Adicionalmente soporta el selector de tamaño: `pageSize`, `pageSizeOptions` y `onPageSizeChange`. |
| `renderActions` | `(row: T) => ReactNode`| (Opcional) Render prop que inyectará una celda adicional de acciones al final de cada fila. |
| `actionsLabel` | `string` | (Opcional) String que se usará para generar la columna extra de acciones si se provee `renderActions`. Por defecto: "Acciones" |
| `actionsAlign` | `'inherit' \| 'left' \| 'center' \| 'right' \| 'justify'` | (Opcional) Alineación de la columna de acciones. |
| `renderGridItem`| `(row: T) => ReactNode` | (Opcional) Función para renderizar una tarjeta en vista de cuadrícula (Mosaico). |
| `defaultViewMode` | `'list' \| 'grid'` | (Opcional) Modo de visualización inicial. Se requiere `renderGridItem` para usar la opción de cuadrícula. Por defecto `"list"`. |
| `sortConfig` | `Object` | (Opcional) Configuración actual de ordenamiento en la tabla, conteniendo el `key` de columna y el sentido de ordenado (`direction` de tipo `'asc' | 'desc'`). |
| `onSort` | `(key: string) => void` | (Opcional) Callback ejecutado cuando un usuario hace clic en el título de una columna designada como `sortable: true`. |
| `leftHeaderAction` | `ReactNode` | (Opcional) Componente personalizado renderizado a la **izquierda** de la zona superior de controles (ej: selector adicional o acción secundaria). |
| `rightHeaderAction` | `ReactNode` | (Opcional) Componente personalizado renderizado a la **derecha** de la zona superior de controles (ej: botón principal "Nuevo Producto"). |
| `hideTopBar` | `boolean` | (Opcional) Si es `true`, oculta la barra de controles interna. Útil cuando se usa `PageToolbar` externamente. Por defecto: `false`. |
| `viewMode` | `'list' \| 'grid'` | (Opcional) Modo de vista actual controlado externamente. |
| `onViewModeChange` | `(mode: 'list' \| 'grid') => void` | (Opcional) Callback para cambiar el modo de vista controlado externamente. |
| `renderActions` | `(row: T) => ReactNode`| (Opcional) Render prop que inyectará una celda de acciones. Se recomienda usar `Stack` con `minWidth` para preservar el espacio. |

## Ejemplo Recomendado de Uso

\`\`\`tsx
import React, { useState } from 'react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { Button, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Definimos el tipo de nuestros datos
interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

const mockData: UserData[] = [
  { id: 1, name: 'Nombre Apellido', email: 'correo@example.com', role: 'Admin' },
  { id: 2, name: 'Nombre Apellido', email: 'correo@example.com', role: 'Editor' },
];

// Configuración de columnas asociadas al tipo
const columns: Column<UserData>[] = [
  { id: 'id', label: 'ID' },
  { id: 'name', label: 'Nombre Completo' },
  { id: 'email', label: 'Correo' },
  {
    id: 'role',
    label: 'Rol',
    // Usamos render si queremos formatear el valor
    render: (row) => <strong>{row.role.toUpperCase()}</strong>,
  }
];

export const UsuariosList = () => {
    const [page, setPage] = useState(1);

    const handleEdit = (user: UserData) => alert(\`Editando a \${user.name}\`);
    const handleDelete = (user: UserData) => alert(\`Borrando a \${user.name}\`);

    // Renderizamos los botones de acción para cada fila
    const productActions = (row: UserData) => (
        <>
            <IconButton color="primary" onClick={() => handleEdit(row)} size="small">
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton color="error" onClick={() => handleDelete(row)} size="small">
                <DeleteIcon fontSize="small" />
            </IconButton>
        </>
    );

    return (
        <DataTable
            columns={columns}
            data={mockData}
            isLoading={false}
            emptyStateMessage="No hay usuarios registrados"
            renderActions={productActions}
            pagination={{
                currentPage: page,
                totalPages: 3,
                onPageChange: (e, newPage) => setPage(newPage)
            }}
        />
    )
}
\`\`\`
