# Componentes de Productos

Biblioteca de componentes especializados para la gestión del catálogo de productos, optimizados para la visualización de stock, precios y categorías alimentarias.

---

## ProductCard

Tarjeta interactiva para la visualización individual de productos en modo cuadrícula (Grid).

- **Ubicación**: `src/features/productos/ProductCard.tsx`
- **Props Clave**:
    - `producto`: Objeto `Producto` con toda la información (nombre, marca, pmp, stock, alérgenos).
    - `onEdit` / `onDelete` / `onRestore`: Handlers para las acciones del footer.
    - `isDeleted`: Booleano que aplica un filtro de escala de grises y marca visual de "Eliminado".
- **Características de Diseño**:
    - **Gestión de Imágenes**: Utiliza `CardMedia` con `object-fit: cover`. Si no hay imagen, muestra un contenedor con el icono de la categoría sobre un fondo dinámico.
    - **Visualización de Alérgenos**: Espacio reservado con `minHeight: 24px` para evitar saltos de línea. Los iconos de alérgenos incluyen `Tooltip` informativo.
    - **Reserva de Espacio**: El nombre y los chips de tipo tienen alturas mínimas calculadas para garantizar una alineación perfecta en filas del grid.
- **Accesibilidad**: El área superior es un `CardActionArea` con `aria-label` descriptivo. Los controles de alérgenos están marcados como `aria-hidden="true"` ya que la información se lee en el label principal.

## ProductFilters

Barra de búsqueda y filtrado inteligente basada en categorías.

- **Ubicación**: `src/features/productos/ProductFilters.tsx`
- **Props Clave**:
    - `filters`: Objeto de estado con las categorías seleccionadas.
    - `onChange`: Callback para actualizar los filtros globales.
- **Características**:
    - **Smart Autocomplete**: Permite selección múltiple de categorías con autocompletado.
    - **Chips Personalizados**: Cada categoría seleccionada muestra su icono visual representativo (Verdura, Carne, Lácteos, etc.) dentro del chip.
- **Microcopy**: Utiliza etiquetas específicas como "Filtrar categoría..." y provee `noOptionsText="Sin resultados"`.

## ProductoFormModal

Formulario dinámico para la creación y edición de productos.

- **Ubicación**: `src/features/productos/ProductoFormModal.tsx`
- **Relación**: Es una implementación especializada de `DynamicFormModal`.
- **Campos Estandarizados**:
    - **Identificación**: Nombre, Marca, Código de Barras (con integración de escáner).
    - **Clasificación**: Selector de Categoría y Alérgenos.
    - **Logística**: Contenido del envase y Unidad de Medida (vía `UnidadMedida` enum).
- **Lógica de Ayuda**: Integrado con el sistema de **Tips** para guiar al usuario en la definición de PMP (Precio Medio Ponderado) y gestión de mermas esperadas.
