# Auditoría UX/UI: Gestión de Productos

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Visibilidad y Feedback (UI/UX)
- **Carga Silenciosa (Corregido ✅)**: Al filtrar productos o cambiar de página, se ha implementado `LinearLoader` para proporcionar feedback visual inmediato y consistente.
- **Estabilidad de Layout (CLS) (Corregido ✅)**: Eliminados saltos visuales en la tabla de productos mediante la sincronización total de anchos de columna entre `TableHead`, `TableRow` y `Skeletons`.
- **Jerarquía en Modal de Detalle**: El historial de precios utiliza una tabla muy densa sin separación visual clara entre registros, lo que dificulta la lectura rápida de la evolución de precios.
- **Empty State Genérico**: Si bien el mensaje de "No hay productos" es correcto, carece de un diseño "Wow" que invite a la acción principal (Añadir Producto) de forma más atractiva.

### 2. Accesibilidad (a11y)
- **Filtros de Búsqueda (Corregido ✅)**: Se han vinculado labels semánticos a los inputs y añadido `aria-label` descriptivos directamente en `htmlInput` (WAVE ready).
- **Contraste de Texto (Corregido ✅)**: El contraste de `text.secondary` en el tema oscuro se ha subido a **0.85** para cumplir con el estándar WCAG AA (WAVE ready).
- **Tablas de Historial (Corregido ✅)**: Añadidos descriptores `aria-label` en celdas críticas y controles de paginación.
- **Navegación por Teclado (Corregido ✅)**: El selector de vista (List/Grid) ahora tiene nombres accesibles para lectores de pantalla.
- **Estructura de Listas (Corregido ✅)**: El Sidebar ahora cumple con la semántica HTML5 (solo `<li>` dentro de `<ul>`).
- **Alertas de Legibilidad (Corregido ✅)**: Eliminadas alertas de "Very small text" subiendo el mínimo a **0.8rem (12.8px)** en todos los componentes.

### 3. Deuda Técnica (DX)
- **Tipado Laxo (Corregido ✅)**: Se han eliminado los `any` en `handleSaveProduct` y se utilizan interfaces estrictas (`ProductoFormValues`).
- **Suspense Fallback (Corregido ✅)**: Se ha sustituido `null` por `LinearLoader` en los fallbacks de componentes lazy-loaded.
