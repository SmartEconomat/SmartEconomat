# Auditoría UX/UI: Gestión de Distribución

Este documento registra los hallazgos de usabilidad y errores detectados en el módulo de entregas internas y movimientos a destino de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Visibilidad y Control de Entregas
- **Ambigüedad del Estado del Producto**: Los preparadores de pedidos tenían dificultades para saber si un producto recepcionado estaba "esperando en muelle" o ya disponible para ser llevado a su aula/zona de destino.
- **Acceso a Acciones Críticas**: El botón para iniciar el asistente de entrega se percibía como secundario, provocando que los usuarios buscaran la opción dentro de menús de inventario general en lugar de usar la vista de distribución.
- **Confirmación de Recepción**: El flujo de cierre (donde el destinatario confirma que recibió el stock) no estaba claramente señalizado, lo que dejaba movimientos en estado "en tránsito" por tiempo indefinido.

### 2. Accesibilidad (a11y)
- **Filtrado de Destinos**: La selección de aula o zona destino mediante desplegable carecía de etiquetas ARIA claras, dificultando la asignación de entregas por teclado.
- **Status Chips de Entrega**: El contraste de los colores de estado ("En tránsito", "Entregado") requería ajustes para cumplir con el estándar WCAG AA en modo oscuro.

### 3. Responsividad
- **Layout de Entregas**: En dispositivos tipo tablet (orientación vertical), la información del lote y la fecha de caducidad se solapaba con los botones de acción de fila.
- **Asistente de Entrega**: El modal de distribución presentaba desbordamientos en pantallas compactas cuando la lista de alumnos/aulas era extensa.
