# Auditoría UX/UI: Gestión de Preparaciones (Cocina)

Este documento registra los hallazgos de usabilidad y errores detectados en el módulo de gestión de stock de platos elaborados de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Control de Producción y Stock
- **Diferenciación de Stock**: Los usuarios confundían el stock de materias primas con el stock de "Platos Elaborados", intentando buscar recetas en el inventario general de productos.
- **Registro de Consumo**: El botón para registrar que se ha servido una ración no era evidente, llevando a errores en el descuadre de lotes producidos.
- **Visibilidad de Caducidades**: En las elaboraciones de cocina, la fecha de caducidad es crítica. El sistema no alertaba visualmente de forma estricta sobre platos que debían consumirse en el día ("Consumo inmediato").

### 2. Accesibilidad (a11y)
- **Modales de Merma**: El registro de una merma sobre un lote de cocina (ej. plato quemado o contaminado) carecía de etiquetas descriptivas para los motivos, dificultando el reporte rápido por teclado.
- **Resumen de Raciones**: La información de "Porciones Restantes" no se anunciaba dinámicamente al actualizarse la tabla.

### 3. Responsividad
- **Ficha Técnica**: En dispositivos móviles, la visualización de los ingredientes utilizados en una preparación específica (trazabilidad del lote) provocaba un scroll excesivo.
- **Acciones de Fila**: Los botones de "Consumir" y "Merma" competían por espacio en pantallas pequeñas, provocando clics erróneos.
