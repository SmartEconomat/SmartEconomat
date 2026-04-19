# Reporte de Auditoría Lighthouse - Inicio (Dashboard) - Desktop

Este reporte analiza los resultados obtenidos el 11 de abril de 2026 para la página de Inicio.

## 📊 Resumen de Puntuaciones (Estimado)
- **Rendimiento**: 🔴 Pobre (FCP: 8.1s, LCP: 18.6s)
- **Accesibilidad**: 🟡 Media/Alta (Basado en correcciones previas)
- **Mejores Prácticas**: 🟢 Alta
- **SEO**: 🟢 Alta

## 🚀 Hallazgos en Rendimiento

### 1. Tiempo de Carga Inicial (LCP/FCP)
- **Problema**: El LCP es extremadamente alto (18.6s). Aunque las extensiones del navegador pueden inflar esto, un tiempo superior a 2.5s en localhost indica ineficiencia.
- **Causa Probable**: Importación ansiosa (eager loading) de modales pesados (`ProductoFormModal`, `RecetaFormModal`, `DynamicFormModal`) que se cargan junto con el componente principal.
- **Impacto**: Aumenta el tamaño del bundle principal y el tiempo de ejecución del script inicial.

### 2. Bloqueo del Hilo Principal
- **Problema**: El `Total Blocking Time` es de 520ms.
- **Causa**: El renderizado simultáneo de todas las tarjetas de estadísticas y la espera de múltiples llamadas a la API (`fetchDashboardStats`, `fetchAppNotifications`).

## ♿ Hallazgos en Accesibilidad

### 1. Estructura de Encabezados
- **Observación**: El dashboard usa un `h4` para el saludo y un `h6` para las secciones. Sería ideal normalizar el `h1` oculto para lectores de pantalla si no existe uno explícito por página.

### 2. Contraste de Color
- **Estado**: Las correcciones previas con `alpha()` han mejorado el contraste, pero Lighthouse podría seguir reportando advertencias en estados de `hover` si el color secundario es muy claro.

## 🛠️ Plan de Acción Propuesto

### Fase 1: Optimización de Rendimiento
1. **Code Splitting**: Implementar `React.lazy` para los modales de acciones rápidas. Estos solo se necesitan cuando el usuario hace clic.
2. **Skeleton Screens**: Mejorar la visualización del estado de carga (aunque ya existe un Spinner, el layout shift podría optimizarse si se reservan los espacios).
3. **Memoización**: Revisar si `DashboardMetricCard` necesita `React.memo` para evitar renders innecesarios al actualizar el reloj o notificaciones.

### Fase 2: Refuerzo de Accesibilidad
1. **ARIA Roles**: Asegurar que todos los iconos decorativos tengan `aria-hidden="true"`.
2. **Focus Management**: Verificar que al cerrar un modal, el foco regrese al botón que lo abrió.
3. **Anuncios en Vivo**: Usar `aria-live` para notificaciones críticas que aparezcan dinámicamente.

---
> [!IMPORTANT]
> Los resultados de rendimiento en el entorno de desarrollo (Vite/HMR) no reflejan fielmente la producción, pero sirven para identificar componentes pesados.
