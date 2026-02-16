# Documentación de Componente: Menú de Configuración

**Tipo:** Molécula (Molecule) / Organismo Pequeño  
**Ubicación:** `src/components/common/Settings/SettingsMenu.tsx`

## Descripción General
El **SettingsMenu** es un componente desplegable que permite al usuario personalizar la apariencia de la aplicación. Se ubica típicamente en la barra de navegación superior.

---

## Funcionalidades
-   **Cambio de Tema:** Permite seleccionar entre Tema Claro, Oscuro y variantes de Alto Contraste.
-   **Tamaño de Fuente:** Controla el tamaño base de la tipografía (Pequeño, Mediano, Grande).

## Construcción Atómica
-   **Disparador:** Un `IconButton` con el icono de engranaje (`SettingsIcon`).
-   **Contenedor:** Un `Menu` de Material UI flotante.
-   **Items:** `MenuItem` con iconos representativos (`LightMode`, `DarkMode`, etc.) y checks de confirmación para la opción activa.

## Props
-   `mode`: `'icon' | 'listitem'` (Opcional, default: `'icon'`). Define si se renderiza como botón circular o elemento de lista.
-   `isOpen`: `boolean` (Opcional, default: `true`). Controla la visibilidad del texto en modo lista.

<<<<<<< HEAD
## Accesibilidad y UX
-   **Tooltip Inteligente:**
    -   Muestra "Configuración" solo cuando el sidebar está colapsado.
    -   Integra lógica para no duplicar información visual cuando el texto del botón ya es visible.
=======
## Accesibilidad
-   Envuelto en un `Tooltip` que describe la acción ("Configuración de tema y apariencia"), mejorando la experiencia para usuarios que dependen de tecnologías de asistencia.
>>>>>>> 40a2733 (fix:modificación final de componentes y estados globales de la aplicación, creación de tooltips para descripciones guiadas)


## Integración
Consume el contexto global de tema (`ThemeContext`) para leer la configuración actual (`currentThemeName`, `fontSize`) y aplicar los cambios (`setTheme`, `setFontSize`).

```typescript
// Ejemplo de uso en Sidebar
<SettingsMenu mode="listitem" isOpen={open} />
```
