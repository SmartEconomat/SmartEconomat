# Página: Gestión de Mermas

**Ruta:** `/mermas`
**Ubicación:** `src/pages/Mermas.tsx`

## Propósito
La página de Mermas centraliza el registro y análisis de todas las pérdidas de stock no planificadas. Permite auditar los motivos de desperdicio (caducidad, rotura, error humano) y visualizar el impacto económico que estas pérdidas suponen para el centro, facilitando la toma de decisiones para reducir el desperdicio.

## Componentes Utilizados
- **MermasDashboard**: Panel superior con KPIs de volumen total y coste de las mermas del periodo.
- **ReportarMermaModal**: Formulario especializado para capturar el motivo, cantidad y observaciones de la pérdida.
- **MermasHistoryTable**: Listado detallado de todas las mermas registradas para auditoría.
- **[InteractiveTour](../componentes/InteractiveTour.md)**: Guía interactiva por el control de pérdidas.

## Asistencia en Control de Pérdidas ✅

El módulo cuenta con un sistema de ayuda para mejorar la precisión del reporte:

### Tour de Gestión de Mermas (4 pasos)
1. **Gestión de Mermas**: Introducción al control de pérdidas no planificadas.
2. **Reportar Merma**: Procedimiento para registrar una anomalía de stock.
3. **Estadísticas de Impacto**: Lectura de los indicadores de coste y volumen.
4. **Historial de Mermas**: Consulta y auditoría de registros pasados.

## Funcionalidades Clave
- **Cierre de Ciclo de Lote**: Las mermas descuentan el stock de lotes específicos para mantener la trazabilidad alimentaria exacta.
- **Análisis de Motivos**: Clasificación categórica para identificar áreas de mejora (ej. problemas de almacenamiento o de manipulación).
- **Indicadores de Coste Real**: El sistema calcula la pérdida basada en el PMP (Precio Medio Ponderado) actual del producto.

## Servicios Consumidos
| Método | Endpoint | Uso |
| :--- | :--- | :--- |
| GET | `/mermas` | Carga del histórico y estadísticas de pérdidas. |
| POST | `/mermas` | Registro de una nueva merma en el sistema. |
| GET | `/mermas/stats` | Obtención de métricas agregadas por motivo y fecha. |
