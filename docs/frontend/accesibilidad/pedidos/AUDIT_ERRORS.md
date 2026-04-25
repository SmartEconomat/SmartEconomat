# Auditoría UX/UI: Gestión de Pedidos

Este documento registra los hallazgos de usabilidad y experiencia de usuario en el flujo de aprovisionamiento de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Jerarquía y Navegación
- **Fragmentación de Vistas**: La división entre "Mis Pedidos", "Pedidos Globales" y "Lotes de Compra" (Compras) resultaba ambigua para el usuario sin una explicación previa del flujo logístico.
- **Pérdida de Trabajo (Borradores)**: Los usuarios no percibían claramente que su trabajo se guardaba automáticamente, lo que generaba duplicidad de pedidos al intentar "empezar de cero" por miedo a perder datos.
- **Densidad de Datos**: Las tablas de pedidos agrupan mucha información (Fechas, Costes, Estados, Usuarios) que en dispositivos móviles provocaba una lectura fragmentada.

### 2. Accesibilidad (a11y)
- **Cambio de Estado**: La transición entre estados de un pedido (Pendiente -> En proceso) no siempre se notificaba de forma semántica a los lectores de pantalla a través de la tabla principal.
- **Componentes Complejos**: Los selectores segmentados de estado en "Mis Pedidos" carecían de etiquetas descriptivas robustas fuera de su representación visual.

### 3. Responsividad
- **Tabs en Móvil**: La navegación por pestañas del módulo presentaba problemas de scroll horizontal en dispositivos de menos de 360px de ancho.
- **Diálogos de Confirmación**: Los modales de recuperación de borrador bloqueaban acciones críticas en móviles debido a un centrado inadecuado de los botones.
