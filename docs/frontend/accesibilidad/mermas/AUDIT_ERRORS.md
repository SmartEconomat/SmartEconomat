# Auditoría UX/UI: Gestión de Mermas

Este documento registra los hallazgos de usabilidad y errores detectados en el sistema de reporte de pérdidas y descartes de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Registro y Concienciación
- **Gravedad del Reporte**: Los usuarios a veces registraban mermas como "ajustes de inventario" genéricos, perdiendo la trazabilidad del motivo real (rotura, caducidad, mal estado).
- **Acceso Directo**: La opción de reportar una merma estaba diluida dentro del detalle de cada producto del inventario, lo que dificultaba un reporte rápido cuando se detectaba una anomalía en bloque.
- **Feedback de Coste**: El usuario no tenía conciencia inmediata del impacto económico de la merma que estaba registrando, lo que restaba importancia a la precisión del reporte.

### 2. Accesibilidad (a11y)
- **Formulario de Merma**: El selector de "Motivo de Merma" no permitía una búsqueda rápida por teclado, obligando al usuario a navegar por toda la lista de opciones.
- **Gráficos de Impacto**: Las estadísticas visuales de mermas carecían de tablas de datos alternativas para usuarios que utilizan lectores de pantalla.

### 3. Responsividad
- **Dashboard de Mermas**: En dispositivos móviles, las tarjetas de resumen de coste y volumen de mermas presentaban problemas de alineación de texto.
- **Tabla de Historial**: La columna de "Responsable" y "Motivo Detallado" provocaba un scroll horizontal excesivo en resoluciones inferiores a 480px.
