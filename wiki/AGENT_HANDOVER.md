**Contexto**: Este proyecto se encuentra en una fase de Refactorización Atómica, Auditoría de Accesibilidad (WCAG) y Refinamiento Estético. Se han completado las fases de **Login**, **Inicio (Dashboard)**, el **Sistema de Diseño Premium (Slate Modern)** y el **Sistema de Onboarding y Ayuda Interactiva**.

**Objetivo**: Iniciar auditoría sistemática de los módulos educativos y de producción:
- [x] Catálogo de Productos (`/productos`) -> FINALIZADO ✅
- [x] Gestión de Inventario (`/inventario`) -> FINALIZADO ✅
- [x] Gestión de Pedidos (`/pedidos`) -> FINALIZADO ✅
- [ ] Módulo Educativo / Admin (`/administracion`)
- [ ] Producción y Recetas (`/recetas`, `/preparaciones`)

---

## 🤖 Instrucciones para el Agente entrante

Sigue estos estándares establecidos para mantener la coherencia:

### 1. Estructura de Documentación
Toda auditoría debe registrarse en la carpeta `/wiki/[módulo]/` con dos archivos:
- `AUDIT_ERRORS.md`: Registro de hallazgos.
- `AUDIT_SOLUTIONS.md`: Registro de soluciones técnicas implementadas.

### 2. Estándares Técnicos
- **Ayuda Interactiva**: Todo módulo principal DEBE tener una entrada en `tutorialData.tsx` y un botón `TutorialHelper` funcional. 
- **Accesibilidad de Ayuda**: Los tours deben ser navegables por teclado (`Arrows`, `Esc`) y soportar el **Modo Compacto** para pantallas bajas.
- **Modo Tips**: Integrar descripciones pedagógicas en los tooltips que se activen con el estado `isLearningMode`.
- **Accesibilidad Global**: Todos los elementos interactivos deben tener `role`, `tabIndex` y manejar eventos de teclado (Enter/Space).
- **Rendimiento**: Priorizar **Skeletons** contextuales. Implementar `React.lazy` para componentes pesados (modales, scanners).
- **Responsividad**: Usar layouts dinámicos con `useBreakpoints` y asegurar que no haya desbordamientos en diálogos flotantes.

### 3. Credenciales de Prueba
Para las pruebas de acceso:
- **Usuario**: `superadmin`
- **Contraseña**: `SmartEconomat2026!`

### 4. Componentes Disponibles (UI Kit)
Consulta `wiki/ui-kit/UI_KIT.md` para ver los componentes ya refactorizados (`InteractiveTour`, `TutorialHelper`, `LearningModeToggle`, `DashboardMetricCard`, etc.).

---

**Siguiente paso prioritario**: Iniciar auditoría del módulo **Educativo / Administración**. Centrarse en el flujo de gestión de alumnos y la asignación de profesores, asegurando que el proceso sea intuitivo y esté guiado por el nuevo sistema de tutoriales.

🚀 ¡Buen trabajo, Agente! La base de SmartEconomat es ahora mucho más sólida y accesible.
