# Documentación de Componente: MainLayout

**Tipo:** Plantilla (Template)  
**Ubicación:** `src/layouts/MainLayout.tsx`

## Descripción General
El **MainLayout** es la estructura base de la aplicación. Implementa el patrón **Mini Drawer**, permitiendo una navegación eficiente sin sacrificar espacio en pantalla.

---

## Características UX
-   **Sidebar Colapsable:**
    -   **Expandido:** Muestra iconos y etiquetas de texto.
    -   **Colapsado (Mini):** Muestra solo iconos para maximizar el área de contenido.
    -   **Tooltips Accesibles:** Cada elemento del menú incluye un `Tooltip` descriptivo que aparece al pasar el cursor o hacer foco (Tab), ideal para el estado colapsado.
-   **Sidebar Footer:** Aloja las acciones secundarias (`TutorialHelper`, `SettingsMenu`) al final de la lista de navegación, separándolas visualmente de las rutas principales.
-   **Header Optimizado:** 
    -   Altura aumentada a **100px** para mejorar la presencia de marca.
    -   Logo de gran tamaño (**80px** de altura).

## Desglose Atómico Actualizado

### Organismo (Organism)
-   **MainLayout:**
    -   Gestiona el estado `open` del Drawer.
    -   Calcula los anchos dinámicos (`transition` CSS) para el contenido principal `main`.
    -   Renderiza `TutorialHelper` y `SettingsMenu` en modo `listitem` dentro del Drawer.

---

## Patrones de Código
Utiliza `styled` components de MUI y mixins (`openedMixin`, `closedMixin`) para manejar las transiciones CSS complejas del sidebar.
