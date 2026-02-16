# Documentación de Componente: MainLayout

**Tipo:** Plantilla (Template)  
**Ubicación:** `src/layouts/MainLayout.tsx`

## Descripción General
El **MainLayout** es la estructura base de la aplicación. Implementa un sistema híbrido de navegación que se adapta al dispositivo: **Mini Drawer** para escritorio y **Overlay Drawer** para móviles.

---

## Características UX
-   **Navegación Responsive:**
    -   **Escritorio:** Barra lateral permanente (fija) que puede colapsarse (Mini).
    -   **Móvil:** Barra lateral temporal (`temporary`) que se superpone al contenido (overlay), optimizando el espacio en pantallas pequeñas.
    -   **Sincronización:** El botón de menú ("hamburguesa") controla ambos estados fluidamente.
-   **Header Adaptativo:**
    -   **Altura Variable:** 100px en escritorio / 80px en móvil.
    -   **Logo Responsive:** Se escala (80px / 60px) manteniendo la proporción y alineación con la barra.
    -   **Menú de Usuario:** Acceso rápido al perfil y cierre de sesión.
-   **Sistema de Ayuda Integrado:**
    -   **Tooltips Inteligentes:** Muestran descripciones detalladas o títulos simples según el estado del menú y el "Modo Aprendizaje".
    -   **Modo Aprendizaje:** Toggle dedicado para activar ayudas extendidas.
    -   **Footer Funcional:** Aloja tutoriales, ajustes y configuración de aprendizaje.

## Desglose Atómico Actualizado

### Organismo (Organism)
-   **MainLayout:**
    -   Orquesta la renderización condicional de `MuiDrawer` (Móvil) vs `DesktopDrawer` (Escritorio).
    -   Maneja el estado `isMobile` mediante `useMediaQuery`.
    -   Integra `LearningModeToggle`, `TutorialHelper` y `SettingsMenu`.

---

## Patrones de Código
Utiliza renderización condicional basada en breakpoints (`theme.breakpoints.down('sm')`) para separar la lógica de móvil y escritorio, y componentes estilizados (`styled`) para las transiciones complejas del modo escritorio.
