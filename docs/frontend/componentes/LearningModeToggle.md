# Documentación de Componente: LearningModeToggle (Tips)

**Tipo:** Molécula / Interruptor de Estado  
**Ubicación:** `src/components/common/Learning/LearningModeToggle.tsx`

## Descripción General
El **LearningModeToggle** (etiquetado en la interfaz como "Tips") es un interruptor que permite al usuario activar o desactivar el **Modo de Aprendizaje**. Cuando está activo, la interfaz de SmartEconomat muestra descripciones detalladas, tooltips persistentes y leyendas explicativas en diversos componentes para facilitar la familiarización con el sistema.

---

## Comportamiento Técnico

### 1. Estado Global
Este componente no maneja el estado de forma interna, sino que interactúa con el `ThemeContext` mediante el hook `useThemeContext`. El estado `isLearningMode` persiste durante la sesión para mantener la coherencia en todas las páginas.

### 2. Modos de Visualización
- **Modo Lista (`mode="listitem"`)**: Diseñado para el Sidebar. Incluye un switch visual (Badge "ON/OFF") y tipografía adaptativa.
- **Modo Icono (`mode="icon"`)**: Variante compacta para barras de herramientas superiores.

### 3. Impacto en la UI
Al activar los "Tips":
- Los tooltips estándar se expanden con descripciones pedagógicas.
- Ciertos iconos de ayuda secundaria se vuelven visibles.
- Se inyectan `aria-labels` más descriptivos para tecnologías de asistencia.

---

## UX Writing y Diseño
- **Label:** "Tips" (Simplificado para ser directo y ahorrar espacio).
- **Iconografía:** Usa `SchoolIcon` (Birrete) para evocar el concepto de formación y aprendizaje.
- **Microcopy:**
    - ON: *"Desactivar tips de uso (Ocultar descripciones de la interfaz)"*
    - OFF: *"Activar tips de uso (Mostrar descripciones de botones e iconos)"*

---

## Integración
El componente debe ser montado en el Sidebar para garantizar que el usuario siempre tenga control sobre el nivel de asistencia que recibe de la interfaz.

---

## Documentos Relacionados
- [TutorialHelper.md](./TutorialHelper.md) (Asistencia interactiva)
- [MainLayout.md](./MainLayout.md) (Estructura donde se aloja el toggle)
