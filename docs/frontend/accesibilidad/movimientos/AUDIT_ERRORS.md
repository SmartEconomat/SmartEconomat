# Auditoría UX/UI: Historial de Movimientos

Este documento registra los hallazgos de auditoría sobre la trazabilidad y el registro histórico de existencias de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Trazabilidad y Contexto
- **Identificación de Origen**: Los usuarios tenían dificultades para distinguir rápidamente si un movimiento provenía de una Recepción, un Ajuste Manual o un Consumo de Receta basándose solo en el texto de la tabla.
- **Detección de Anomalías**: La falta de una guía sobre cómo filtrar movimientos por tipo o usuario dificultaba la detección de fugas de stock o errores de registro de forma ágil.
- **Carga de Datos Históricos**: La visualización de meses anteriores sin un selector de fechas claro provocaba una navegación lenta y repetitiva.

### 2. Accesibilidad (a11y)
- **Indicadores Direccionales**: El uso de flechas (Up/Down) para representar entradas y salidas carecía de un soporte textual oculto (`aria-label`) suficiente para usuarios ciegos.
- **Detalle de Transacción**: El modal de detalle no seguía una estructura de encabezados lógica, mezclando datos técnicos con datos del producto.

### 3. Responsividad
- **Tablas de Auditoría**: En dispositivos móviles, la columna de "Descripción" del movimiento (lotes, IDs) se cortaba o provocaba un scroll horizontal excesivo que ocultaba los botones de "Ver Detalle".
