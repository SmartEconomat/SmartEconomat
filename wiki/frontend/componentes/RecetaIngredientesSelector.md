# Componente: RecetaIngredientesSelector

> **Ubicación:** `src/components/ui/RecetaIngredientesSelector.tsx`

## Propósito

Permite construir el escandallo de una receta seleccionando productos, cantidades, unidades y proveedor favorito por cada línea.

## Responsabilidades

- cargar el catálogo completo de productos recorriendo todas las páginas del endpoint;
- permitir alta, edición y borrado de líneas de ingrediente;
- recuperar detalles del producto seleccionado cuando la receta ya existe;
- sugerir automáticamente el proveedor más barato si no hay uno válido asignado;
- recalcular y mostrar alérgenos detectados a partir de los ingredientes elegidos.

## Comportamiento relevante

- **Carga paginada completa**: no se limita a la primera página de productos, evitando que el selector quede vacío o incompleto al añadir ingredientes nuevos.
- **Compatibilidad con edición**: si una receta tiene productos no presentes en la página actual del listado, el componente inyecta igualmente esas opciones en el `Autocomplete`.
- **Proveedor favorito automático**: si el proveedor asignado deja de ser válido, se reemplaza por el proveedor más barato disponible.
- **Cantidades decimales**: admite cantidades con decimales en las líneas de ingredientes.

## Dependencias

- `fetchProductos()`
- `getProductoById()`
- `EU_ALLERGENS`
- Tipos `Producto`, `ProductoProveedor` y `UnidadIngrediente`