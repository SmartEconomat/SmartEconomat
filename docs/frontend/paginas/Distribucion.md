# Página: Gestión de Distribución

**Ruta:** `/distribucion`
**Ubicación:** `src/pages/Distribucion.tsx`

## Propósito
La página de Distribución coordina el movimiento de mercancía desde el almacén central hacia los destinos finales (aulas, zonas de consumo, profesores). Es el eslabón final de la cadena de suministro interna que asegura la trazabilidad del stock hasta su entrega definitiva.

## Componentes Utilizados
- **DistribucionTabs**: Selector entre el listado de entregas pendientes e historial de operaciones.
- **DistribucionAsistenteModal**: Interfaz para seleccionar el destino, cantidad y responsable de la entrega.
- **DistribucionStatusChip**: Indicador visual del estado del movimiento (Pendiente, En Tránsito, Entregado).
- **[InteractiveTour](../componentes/InteractiveTour.md)**: Guía interactiva por el flujo de entregas.

## Asistencia en Entregas ✅

El módulo cuenta con un sistema de ayuda para facilitar la logística interna:

### Tour de Gestión de Entregas (5 pasos)
1. **Gestión de Entregas**: Introducción a las pestañas de pendientes e historial.
2. **Búsqueda Rápida**: Localización por pedido, usuario o destino.
3. **Listado de Pendientes**: Visualización de productos listos en almacén.
4. **Iniciar Entrega**: Uso del asistente para delegar el stock.
5. **Confirmación de Recepción**: Proceso de formalización del movimiento final.

## Funcionalidades Clave
- **Control de Lotes**: Asegura que se distribuye el lote correcto (FEFO - First Expired, First Out).
- **Confirmación Biométrica/Firma**: El sistema permite registrar quién recibe la mercancía para una trazabilidad total.
- **Filtros por Aula**: Organización de las tareas de entrega según la ruta física del repartidor.

## Servicios Consumidos
| Método | Endpoint | Uso |
| :--- | :--- | :--- |
| GET | `/distribuciones/pendientes` | Carga de stock recepcionado listo para entrega. |
| POST | `/distribuciones/entregar` | Registro del movimiento hacia una nueva ubicación. |
| PATCH | `/distribuciones/:id/confirmar` | Cierre del movimiento por parte del destinatario. |
