# Auditoría UX/UI: Gestión de Incidencias

Este documento registra los hallazgos de usabilidad y diseño en el centro de resolución de discrepancias logísticas de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Flujo de Resolución
- **Ambigüedad en Discrepancias**: El sistema no explicaba claramente la diferencia entre faltas parciales y excesos de mercancía, derivando en resoluciones inconsistentes por parte de los administradores.
- **Acciones Críticas Ocultas**: El botón "Marcar como Resuelta" no siempre era percibido como el CTA principal del flujo, perdiéndose entre las opciones de visualización y borrado.
- **Feedback de Cierre**: Tras resolver una incidencia, la actualización visual del estado (Pendiente -> Resuelta) se percibía como brusca y carecía de una confirmación textual sobre qué se había ajustado exactamente en el inventario.

### 2. Accesibilidad (a11y)
- **Modales de Resolución**: El formulario para capturar las notas de resolución no aplicaba un foco automático al primer campo de texto, obligando al usuario a usar el ratón para iniciar la escritura.
- **Status Chips**: El contraste del color amarillo (Pendiente) sobre fondo blanco en algunas resoluciones no alcanzaba el ratio WCAG AA.

### 3. Responsividad
- **Tablas de Incidencia**: La visualización de "Productos Afectados" como un contador circular se desalineaba en pantallas tipo Tablet de 768px.
- **Información de Recepción**: El detalle de la incidencia (quién recibió, cuándo) se amontonaba en la parte superior del modal en dispositivos móviles.
