# Documentación de Componente: MainLayout

**Tipo:** Plantilla (Template)  
**Ubicación:** `src/layouts/MainLayout.tsx`

## Descripción General
<<<<<<< HEAD
El **MainLayout** es la estructura base de la aplicación. Implementa un sistema híbrido de navegación que se adapta al dispositivo: **Mini Drawer** para escritorio y **Overlay Drawer** para móviles.
=======
El **MainLayout** es la estructura base de la aplicación. Implementa el patrón **Mini Drawer**, permitiendo una navegación eficiente sin sacrificar espacio en pantalla.
>>>>>>> 40a2733 (fix:modificación final de componentes y estados globales de la aplicación, creación de tooltips para descripciones guiadas)

---

## Características UX
<<<<<<< HEAD
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
=======
-   **Sidebar Colapsable:**
    -   **Expandido:** Muestra iconos y etiquetas de texto.
    -   **Colapsado (Mini):** Muestra solo iconos para maximizar el área de contenido.
    -   **Tooltips Accesibles:** Cada elemento del menú incluye un `Tooltip` descriptivo que aparece al pasar el cursor o hacer foco (Tab), ideal para el estado colapsado.
-   **Sidebar Footer:** Aloja las acciones secundarias (`TutorialHelper`, `SettingsMenu`) al final de la lista de navegación, separándolas visualmente de las rutas principales.
-   **Header Optimizado:** 
    -   Altura aumentada a **100px** para mejorar la presencia de marca.
    -   Logo de gran tamaño (**80px** de altura).
>>>>>>> 40a2733 (fix:modificación final de componentes y estados globales de la aplicación, creación de tooltips para descripciones guiadas)

## Desglose Atómico Actualizado

### Organismo (Organism)
-   **MainLayout:**
<<<<<<< HEAD
    -   Orquesta la renderización condicional de `MuiDrawer` (Móvil) vs `DesktopDrawer` (Escritorio).
    -   Maneja el estado `isMobile` mediante `useMediaQuery`.
    -   Integra `LearningModeToggle`, `TutorialHelper` y `SettingsMenu`.
=======
    -   Gestiona el estado `open` del Drawer.
    -   Calcula los anchos dinámicos (`transition` CSS) para el contenido principal `main`.
    -   Renderiza `TutorialHelper` y `SettingsMenu` en modo `listitem` dentro del Drawer.
>>>>>>> 40a2733 (fix:modificación final de componentes y estados globales de la aplicación, creación de tooltips para descripciones guiadas)

---

## Patrones de Código
<<<<<<< HEAD
Utiliza renderización condicional basada en breakpoints (`theme.breakpoints.down('sm')`) para separar la lógica de móvil y escritorio, y componentes estilizados (`styled`) para las transiciones complejas del modo escritorio.
=======
Utiliza `styled` components de MUI y mixins (`openedMixin`, `closedMixin`) para manejar las transiciones CSS complejas del sidebar.
>>>>>>> 40a2733 (fix:modificación final de componentes y estados globales de la aplicación, creación de tooltips para descripciones guiadas)
