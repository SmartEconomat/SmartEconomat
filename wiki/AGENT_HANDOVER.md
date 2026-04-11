**Contexto**: Este proyecto se encuentra en una fase de Refactorización Atómica, Auditoría de Accesibilidad (WCAG) y Refinamiento Estético Premium. Se han completado las fases de **Login**, **Inicio (Dashboard)** y el **Sistema de Diseño Premium (Slate Modern)**.

**Objetivo**: Continuar con la auditoría sistemática de los siguientes módulos:
- [ ] Catálogo de Productos (`/productos`)
- [ ] Gestión de Inventario (`/inventario`)
- [ ] Gestión de Pedidos (`/pedidos`)

---

## 🤖 Instrucciones para el Agente entrante

Sigue estos estándares establecidos para mantener la coherencia:

### 1. Estructura de Documentación
Toda auditoría debe registrarse en la carpeta `/wiki/[módulo]/` con dos archivos:
- `AUDIT_ERRORS.md`: Registro de hallazgos (Desktop/Tablet/Mobile + Accesibilidad).
- `AUDIT_SOLUTIONS.md`: Registro de soluciones técnicas implementadas.

### 2. Estándares Técnicos
- **Arquitectura**: Extraer componentes reutilizables a cada subcarpeta `components/` de cada feature.
- **Accesibilidad**: Todos los elementos interactivos deben tener `role`, `tabIndex` y manejar eventos de teclado (Enter/Space). Usar componentes de `@mui/material` con los overrides de `src/utils/theme/themes.ts`.
- **Contraste**: Validar ratios WCAG AA (4.5:1). No usar colores `.light` con texto blanco directamente.
- **Rendimiento y UX**: Evitar Spinners de pantalla completa. Priorizar el uso de **Skeletons** contextuales para mejorar la percepción de carga. Implementar `React.lazy` para componentes pesados.
- **Responsividad**: Usar layouts dinámicos con el hook `useBreakpoints`. Los elementos deben ser fluidos en 1280px, 768px y 375px.
- **Animaciones Naturales**: Priorizar transiciones nativas de CSS con retardos (delays) para evitar solapamientos visuales (ej: al cerrar el Sidebar, el texto desaparece antes del movimiento). Evitar `setTimeout` para lógica puramente visual.
- **Gestión de Carga (Anti-White Screen)**: No dejar el `Suspense` con fallback nulo. Usar siempre el componente `LinearLoader` en el tope superior para transiciones de chunks y junto a Skeletons para carga de datos.

### 3. Credenciales de Prueba
Para las pruebas de acceso:
- **Usuario**: `superadmin`
- **Contraseña**: `SmartEconomat2026!`
- **Puerto**: `5173` (Docker preferido).

### 4. Componentes Disponibles (UI Kit)
Consulta `wiki/ui-kit/UI_KIT.md` para ver los componentes ya refactorizados (`AuthLogo`, `SecondaryActionButton`, `DashboardMetricCard`, `DashboardQuickAction`, etc.) y reutilízalos.

---

**Siguiente paso prioritario**: Iniciar auditoría del módulo de **Productos**. Prioriza la detección de problemas de contraste en las tablas y la navegación por teclado en los filtros.

🚀 ¡Buena suerte, Agente!
