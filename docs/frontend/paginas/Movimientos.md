# Página: Historial de Movimientos

> **Ubicación:** `src/pages/Movimientos.tsx`
> **Última actualización:** 2026-03-07

## Propósito

La página de Movimientos proporciona una auditoría detallada de todos los cambios en el inventario. Registra entradas, salidas, ajustes manuales y consumos por elaboración, permitiendo rastrear la trazabilidad de cualquier producto en el sistema.

## Componentes Utilizados

- **[PageToolbar](../componentes/PageToolbar.md)**: Buscador de movimientos, filtros por tipo de operación y rango de fechas.
- **[DataTable](../componentes/DataTable.md)**: Historial tabular con iconografía direccional para indicar el flujo del stock.
- **[StatusChip](../componentes/StatusChip.md)**: Etiquetas con variantes Outlined y colores semánticos según el tipo de movimiento.
- **[DetailModal](../componentes/DetailModal.md)**: Vista técnica del movimiento, incluyendo IDs de entidad relacionada (Pedido, Recepción, etc.) y lotes.
- **[InteractiveTour](../componentes/InteractiveTour.md)**: Guía paso a paso por el historial de trazabilidad.

## Ayuda y Auditoría Interactiva ✅

La página de Movimientos dispone de un asistente para facilitar el análisis del historial:

### Tour de Trazabilidad (4 pasos)
1. **Historial de Movimientos**: Registro central de cambios en stock.
2. **Filtrado por Tipo**: Localización de mermas, entradas o salidas específicas.
3. **Trazabilidad**: Identificación de responsables y productos.
4. **Detalles de Auditoría**: Acceso al origen (Pedido/Distribución) y lotes.

## Funcionalidades Clave

- **Visualización Direccional**: Los movimientos de entrada (compras, ajustes positivos) muestran iconos de flecha hacia arriba y colores verdes. Las salidas (ventas, elaboraciones, ajustes negativos) muestran flechas hacia abajo y colores rojos.
- **Contextualización Dinámica**: La descripción del producto se adapta según el origen del movimiento (Producto de Proveedor o Ingrediente de Elaboración).
- **Control de Usuario**: Muestra el nombre y avatar inicial del usuario que realizó la operación para fines de auditoría.
- **Filtros Multiselección**: Permite filtrar simultáneamente por múltiples tipos de movimiento (ej. ver solo Entradas y Ajustes).

## Estructura de Datos (Columnas)

| Columna | ID | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| Fecha | `createdAt` | Fecha/Hora | Momento exacto de la transacción. |
| Tipo | `tipo` | StatusChip | Naturaleza de la operación (Entrada, Salida, Ajuste, Elaboración). |
| Cantidad | `cantidad` | Numérico | Variación del stock principal. |
| Descripción | `producto` | Texto | Identificación del producto o lote afectado. |
| Usuario | `usuario` | Perfil | Responsable de la acción. |

## Servicios Consumidos

| Método | Endpoint | Uso |
| :--- | :--- | :--- |
| GET | `/movimientos` | Listado paginado con soporte para filtros de tipo y fecha. |
| GET | `/movimientos/:id` | Detalle extendido de una transacción específica. |
