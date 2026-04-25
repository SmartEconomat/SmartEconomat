# SmartFilterAutocomplete

El componente `SmartFilterAutocomplete` es una evolución de alta gama del `Autocomplete` de Material UI (MUI), diseñado específicamente para los sistemas de filtrado de **SmartEconomat**. 

Combina una potente funcionalidad de búsqueda con un sistema de tags (chips) altamente responsivo y visualmente fluido, optimizado para ser utilizado dentro de barras de herramientas (`PageToolbar`).

## Características Premium

- **Orden Búsqueda-Primero**: El área de escritura se posiciona a la izquierda (junto al icono), permitiendo una interacción de búsqueda natural donde los filtros seleccionados se acumulan a la derecha. ✨
- **Scroll Horizontal Fluido**: Los filtros seleccionados (chips) no se apilan verticalmente, sino que se desplazan horizontalmente en una sola línea, manteniendo constante la altura del Toolbar. ↔️
- **Degradado Dinámico Inteligente (Smart Fade)**: 
    - Un degradado de transparencia (fade) aparece sutilmente solo cuando hay contenido oculto por el scroll.
    - Se desactiva automáticamente al inicio o final de la lista para mantener un "corte liso" y nítido.
- **Auto-Scroll Reactivo**: Al añadir una nueva categoría, el control se desplaza automáticamente hacia el final para confirmar visualmente la adición. 🎢
- **Zona de Seguridad**: Reserva espacio para los controles nativos de MUI (X para limpiar y flecha de despliegue), evitando solapamientos estéticos. 🛡️

## Propiedades (Props)

El componente es genérico `<T>` y hereda la mayoría de las props de `Autocomplete` de MUI, fijando el modo `multiple`.

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `placeholder` | `string` | Texto de ayuda que siempre se muestra en el área de búsqueda. |
| `ariaLabel` | `string` | Descripción de accesibilidad para lectores de pantalla. |
| `icon` | `ReactNode` | Icono identificador a la izquierda del input (default: `FilterList`). |
| `inputWidth` | `number \| string` | Ancho reservado para el área de escritura (default: `140`). |
| `...AutocompleteProps` | `Omit<...>` | Soporta la mayoría de props de MUI (`options`, `value`, `onChange`, `renderTags`, etc.). |

## Implementación Técnica

### Ejemplo de Uso (Módulo Productos)

```tsx
import SmartFilterAutocomplete from 'components/ui/SmartFilterAutocomplete';

<SmartFilterAutocomplete<CategoryOption>
  options={CATEGORIA_OPTIONS}
  value={selected}
  getOptionLabel={(opt) => opt.label}
  placeholder="Filtrar categoría..."
  onChange={(_, newValue) => handleCategoriesChange(newValue)}
  renderTags={(tagValue, getTagProps) => (
    // Personalización sutil de chips
  )}
/>
```

### Animación y Estilo
El componente utiliza `mask-image` con degradados lineales dinámicos calculados en tiempo real mediante el evento `onScroll`, garantizando una experiencia "SaaS Premium" coherente con la identidad visual del proyecto. ✅🚀
