# Auditoría UX/UI: Administración y Gestión de Usuarios

Este documento registra los hallazgos de usabilidad y de seguridad percibida en el panel de administración académica de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Gestión de Estructura Académica (Aulas y Usuarios)
- **Asignación de Profesores**: El proceso para vincular a un profesor con un aula (slot) específica resultaba opaco dentro de la tabla de aulas, obligando a los administradores a "editar" cada fila sin saber qué profesor estaba disponible.
- **Acciones de Gestión de Slots**: El botón de "Gestionar Slots" no se percibía como un interruptor de modo de edición, lo que provocaba que los usuarios intentaran arrastrar o editar elementos sin haber activado el modo previamente.
- **Jerarquía de Roles**: La diferencia entre los roles de sistema (fijos) y los roles personalizables no estaba suficientemente documentada en la interfaz, lo que generaba incertidumbre al intentar delegar permisos sensibles.

### 2. Accesibilidad (a11y)
- **Tablas de Administración**: La gestión de usuarios y roles mediante modales presentaba problemas de foco al cerrar; el foco no siempre volvía a la fila del usuario editado, interrumpiendo la fluidez de la gestión masiva.
- **Interruptores de Actividad**: Los controles para activar/desactivar usuarios carecían de etiquetas descriptivas que confirmaran el cambio de estado de forma auditiva.

### 3. Responsividad
- **Panel de Administración**: En dispositivos tipo Tablet, la navegación por pestañas del módulo de administración se desbordaba, ocultando las opciones de "Roles" y "Plantillas".
- **Gestión de Roles**: La rejilla de permisos en el editor de roles era impracticable en móviles, requiriendo un scroll horizontal masivo que dificultaba la auditoría de seguridad rápida.
