# Página: Centro de Incidencias

> **Ubicación:** `src/pages/Incidencias.tsx`
> **Última actualización:** 2026-03-07

## Propósito

La página de Incidencias es el panel central para gestionar discrepancias detectadas durante la recepción de pedidos. Permite a los administradores revisar faltas o errores registrados por el personal de almacén y cerrarlos una vez resueltos.

## Componentes Utilizados

- **[PageToolbar](../componentes/PageToolbar.md)**: Buscador de incidencias por proveedor u observaciones, filtro por estado de resolución y rango de fechas.
- **[DataTable](../componentes/DataTable.md)**: Listado de incidencias con columnas para fecha, proveedor, cantidad de líneas afectadas y estado.
- **[DetailModal](../componentes/DetailModal.md)**: Vista detallada que desglosa los productos específicos con discrepancias, cantidades esperadas vs recibidas, y notas de recepción/resolución.
- **[StatusChip](../componentes/StatusChip.md)**: Visualización semántica del estado (Pendiente en amarillo, Resuelta en verde con icono de check).
- **[ResolveIncidenciaModal](../../features/incidencias/ResolveIncidenciaModal.tsx)**: Formulario modal para capturar las observaciones de cómo se solucionó la incidencia.
- **[ConfirmDialog](../componentes/ConfirmDialog.md)**: Validación para la eliminación de registros de incidencia.

## Funcionalidades Clave

- **Resolución de Incidencias**: Al marcar una incidencia como resuelta, se abre un modal de formulario para detallar las acciones tomadas. Una vez enviada, el estado cambia visualmente y se bloquea la edición.
- **Resaltado de Resolución**: En el detalle de una incidencia resuelta, la información de la solución (quién, cuándo y qué se hizo) aparece destacada con un borde verde y fondo suave para diferenciarla de los datos de recepción.
- **Estabilización de Acciones**: La columna de acciones en la tabla mantiene su ancho incluso cuando desaparece el botón de "marcar como resuelta", asegurando que los iconos de "ver" y "eliminar" no se desplacen.
- **Filtrado Avanzado**: Capacidad de filtrar por estado de resolución (Todas, Resueltas, Pendientes) y por rango de fechas de creación.

## Estructura de Datos (Columnas)

| Columna | ID | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| Fecha | `createdAt` | Fecha | Fecha en la que se registró la discrepancia. |
| Proveedor | `proveedorNombre` | Texto | Nombre del proveedor asociado al pedido original. |
| Productos Afectados | `lineasCount` | Contador | Número de líneas de producto que presentaron diferencias. |
| Estado | `resuelta` | StatusChip | Estado logístico: Pendiente (Warning) o Resuelta (Success). |

## Servicios Consumidos

| Método | Endpoint | Uso |
| :--- | :--- | :--- |
| GET | `/incidencias` | Listado paginado con filtros. |
| PATCH | `/incidencias/:id/resolver` | Envío de observaciones para cerrar la incidencia. |
| DELETE | `/incidencias/:id` | Eliminación definitiva del registro. |
