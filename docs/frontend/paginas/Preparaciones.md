# Página: Preparaciones y Elaboraciones

**Ruta:** `/preparaciones`
**Ubicación:** `src/pages/Preparaciones.tsx`

## Propósito
La página de Preparaciones gestiona el stock de productos finales elaborados en el centro (platos listos, raciones, elaboraciones intermedias). Permite realizar el seguimiento desde que una receta se convierte en un lote producido hasta su consumo final o descarte, asegurando el control de costes y caducidades culinarias.

## Componentes Utilizados
- **PreparacionesSummary**: Panel de indicadores con el volumen total de raciones producidas y disponibles.
- **PreparacionesTabs**: Navegación entre lotes activos e historial de producciones agotadas.
- **DetallePreparacionModal**: Ficha técnica del lote que incluye ingredientes (trazabilidad) y costes reales.
- **[InteractiveTour](../componentes/InteractiveTour.md)**: Guía interactiva por la gestión de cocina.

## Asistencia en Cocina ✅

El módulo cuenta con un sistema de ayuda especializado para el personal de producción:

### Tour de Gestión de Producción (5 pasos)
1. **Bolsa de Preparaciones**: Explicación del concepto de stock de platos elaborados.
2. **Estado de Producción**: Uso de las pestañas para monitorizar lotes activos.
3. **Registro de Consumo**: Procedimiento para descontar raciones servidas.
4. **Gestión de Mermas**: Cómo reportar pérdidas en el proceso de servicio.
5. **Control Detallado**: Acceso a la trazabilidad y datos técnicos del lote.

## Funcionalidades Clave
- **Control de Caducidad Estricto**: Alertas visuales para productos que superan los días de consumo recomendados definidos en la receta.
- **Descuento Automático**: Al registrar un consumo, el sistema actualiza el stock del lote de preparación sin afectar el inventario de materias primas (ya descontado al producir).
- **Trazabilidad de Ingredientes**: Permite identificar exactamente qué lotes de materia prima se utilizaron en una preparación específica ante una alerta sanitaria.

## Servicios Consumidos
| Método | Endpoint | Uso |
| :--- | :--- | :--- |
| GET | `/produccion-lotes` | Listado de lotes de preparaciones activos y pasados. |
| POST | `/produccion-lotes/:id/consumir` | Registro de salida de raciones. |
| POST | `/produccion-lotes/:id/merma` | Registro de pérdida de raciones del lote. |
