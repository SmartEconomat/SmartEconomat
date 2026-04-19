# Auditoría UX/UI: Gestión de Inventario

Este documento registra los hallazgos de usabilidad y fricción detectados en el módulo de Inventario de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Orientación y Flujo de Trabajo
- **Complejidad del Almacén**: Los usuarios nuevos mostraban dificultad para entender el sistema de ubicaciones y slots de forma intuitiva sin una guía previa.
- **Acciones Críticas Ocultas**: Operaciones como el ajuste por mermas o la regularización de stock se percibían como procesos complejos al requerir la navegación por múltiples sub-menús.
- **Descubrimiento de Herramientas**: El uso del escáner de códigos de barras para auditoría rápida no era evidente para usuarios que no conocían la funcionalidad de antemano.

### 2. Accesibilidad (a11y)
- **Navegación por Teclado**: La gestión de ubicaciones en la barra de herramientas carecía de un flujo de foco coherente, dificultando la operación sin ratón.
- **Feedback de Filtrado**: El cambio de estado en la tabla tras aplicar filtros de "Próxima Caducidad" no proporcionaba una confirmación auditiva o visual suficiente para lectores de pantalla.

### 3. Responsividad
- **Diálogos de Auditoría**: En dispositivos pequeños, los modales de ajuste de stock presentaban desbordamientos en campos numéricos pesados.
- **Clasificación en Móvil**: La vista de "Slots" se volvía excesivamente densa en pantallas inferiores a 375px, comprometiendo la legibilidad de las cantidades.
