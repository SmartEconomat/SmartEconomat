# Mejoras en Gestión de Pedidos y Selección de Líneas

## Introducción

En el marco de la evolución de la gestión de pedidos, se han implementado mejoras críticas en la interfaz de usuario para permitir una mayor flexibilidad y precisión al realizar pedidos, tanto manuales como los generados desde las recetas.

---

## Selector de Líneas Avanzado (`PedidoLineasSelector`)

El nuevo componente `PedidoLineasSelector` sustituye a la lista estática de productos por una interfaz dinámica que permite:

### 1. Soporte Multi-Proveedor
El sistema permite añadir productos de diferentes proveedores en el mismo proceso de creación/edición de pedido.
-   **Agrupación Visual**: Las líneas del pedido se agrupan automáticamente por proveedor.
-   **Subtotales**: Se calcula un subtotal por cada proveedor y un total general estimado.

### 2. Autocompletado con Búsqueda Global
Se ha integrado el servicio `searchProductoProveedor` en el selector para:
-   **Búsqueda Rápida**: Filtrar por nombre de producto o marca.
-   **Precarga Automática**: Al seleccionar un producto, el sistema carga automáticamente su `precioUnitario` vigente con dicho proveedor, agilizando la creación del pedido.

### 3. Edición Flexible
-   **Edición de Precios y Cantidades**: Se permite corregir manualmente el precio unitario y la cantidad si el pedido real difiere ligeramente del catálogo.
-   **Eliminación Selectiva**: Posibilidad de quitar líneas individuales de forma sencilla.

---

## Mejoras Funcionales en Pedidos Genéricos

### 1. Edición de Pedidos Existentes
El sistema ha sido refinado para permitir la edición de pedidos que fueron autogenerados por el sistema (por falta de stock al preparar recetas). Ahora es posible:
-   Añadir productos extra a un pedido ya creado.
-   Cambiar las cantidades originales.
-   Actualizar los proveedores si el original no puede cumplir con el envío.

### 2. Gestión de Pedidos Multinivel
La lógica de validación se ha desacoplado para soportar tanto pedidos simples como la consolidación de pedidos complejos que involucran múltiples departamentos o ubicaciones.

---

## Componentes Técnicos Clave

### Frontend
-   **Componente**: `PedidoLineasSelector.tsx`
-   **Selector de Producto Final**: `ProductoResultadoSelector.tsx` (utilizado en recetas para vincular una preparación con su producto en el catálogo).
-   **Pantallas**: `Pedidos.tsx`, `Recetas.tsx`.

---

## Casos de Uso Cubiertos

| Caso de Uso | Descripción |
|-------------|-------------|
| **C-PED-EDT-01** | Edición de un pedido generado automáticamente para añadir más stock preventivo. |
| **C-PED-SEL-01** | Búsqueda y selección de productos mediante autocompletado con carga de precio base. |
| **C-PED-MLP-01** | Creación de un pedido con productos de 3 proveedores distintos visualizados en grupos. |
| **C-REC-PRO-01** | Asociación de una Receta con su Producto Resultante mediante el selector dinámico. |
