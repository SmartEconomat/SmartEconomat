# Página: Pedidos

> **Ubicación:** `src/pages/Pedidos.tsx`

## Propósito

La página de Pedidos gestiona las órdenes de compra realizadas a los proveedores. Permite realizar un seguimiento exhaustivo desde la emisión de la orden hasta la recepción parcial o total de la mercancía.

## Componentes Utilizados

- **[PageToolbar](../componentes/PageToolbar.md)**: Gestiona el título, búsqueda por proveedor/estado y la creación de nuevos pedidos. Incluye el selector de modo de vista (Lista/Grid).
- **[DataTable](../componentes/DataTable.md)**: Muestra los pedidos de forma tabular con soporte para visualización responsiva.
- **[StatusChip](../componentes/StatusChip.md)**: Indica el estado actual del pedido (Pendiente, Recibido, Cancelado, etc.).
- **[DynamicFormModal](../componentes/DynamicFormModal.md)**: Formulario avanzado para la gestión de líneas de pedido y selección de proveedores.
- **[ConfirmDialog](../componentes/ConfirmDialog.md)**: Validación para la cancelación de pedidos.

## Funcionalidades Clave

- **Sincronización de Vista**: El modo de vista (Lista/Grid) se sincroniza entre la cabecera y la tabla.
- **Seguimiento de Estado**: Cambio dinámico de estados según la evolución de la orden.
- **Gestión de Líneas de Pedido**: Definición de productos, cantidades y precios unitarios por pedido.
- **Cálculo de Coste Total**: Actualización automática del coste total en base a las líneas de pedido registradas.

## Estructura de Datos (Columnas)

| Columna | ID | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| Fecha Pedido | `fechaPedido` | Fecha | Fecha de emisión de la orden. |
| Fecha Entrega | `fechaEntrega` | Fecha | Fecha prevista de llegada (oculto en móvil). |
| Proveedor | `proveedor` | Texto | Nombre del proveedor suministrador. |
| Coste Total | `costeTotal` | Moneda | Importe acumulado de la compra. |
| Estado | `estado` | Chip | Estado logístico (Pendiente, Parcial, Recibido, etc.). |
| Creado Por | `usuario` | Texto | Nombre del comprador (oculto en móvil). |
