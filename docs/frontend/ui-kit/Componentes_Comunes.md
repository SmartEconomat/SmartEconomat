# Componentes Comunes y Globales

Esta sección detalla los componentes transversales que forman el núcleo de la interfaz de usuario en SmartEconomat. Estos componentes están diseñados para ser reutilizables, accesibles y consistentes en todos los módulos.

---

## DataTable

El componente principal para la visualización de datos masivos. Soporta vistas de lista y cuadrícula, paginación y ordenamiento.

- **Ubicación**: `src/components/ui/DataTable.tsx`
- **Props Clave**:
    - `columns`: Array de configuración de columnas (`id`, `label`, `render`, `sortable`).
    - `data`: Array de objetos con la información.
    - `viewMode`: `'list' | 'grid'` (controla la representación visual).
    - `pagination`: Objeto con `currentPage`, `totalPages` y handlers de cambio.
    - `renderActions`: Función para inyectar botones de acción por fila.
- **Accesibilidad**: Utiliza `TableContainer` y `TablePagination` nativos de MUI. Implementa `aria-label` dinámico para filas interactivas vía `getRowAriaLabel`.
- **Diseño**: Soporta esqueletos de carga (`isLoading`) y estados vacíos personalizados. En modo móvil, permite ocultar columnas automáticamente vía `hideOnMobile`.

## PageToolbar

Cabecera unificada para todas las páginas del sistema. Gestiona la identidad de la sección y las acciones globales.

- **Ubicación**: `src/components/ui/PageToolbar.tsx`
- **Props Clave**:
    - `title`: Nombre de la sección actual.
    - `icon`: Icono representativo del módulo.
    - `searchValue` / `onSearchChange`: Control de la búsqueda global de la página.
    - `primaryAction`: Objeto con `label`, `onClick` e `icon` para la acción principal (ej: "Añadir Producto").
    - `filters`: Slot para inyectar componentes de filtrado avanzado.
    - `totalItems`: Badge opcional con el recuento de elementos.
- **Diseño**: Utiliza `sticky` para mantenerse visible durante el scroll. Adapta su disposición en móviles (apilamiento vertical) usando el hook `useBreakpoints`.

## StatusChip

Representación visual de estados, categorías y niveles de dificultad.

- **Ubicación**: `src/components/ui/StatusChip.tsx`
- **Props Clave**:
    - `status`: Identificador del estado (ej: `"success"`, `"pending"`, `"fácil"`).
    - `label`: Texto a mostrar (si no se provee, intenta traducir el id del `status`).
- **Diseño**: 
    - **Lógica de Colores**: Mapea automáticamente estados lógicos (`entregado` -> `success`, `cancelado` -> `error`).
    - **Categorías**: Si el status es una `CategoriaProducto`, inyecta automáticamente el icono correspondiente y ajusta el ancho mínimo.
    - **Tipografía**: Utiliza `0.65rem` con `fontWeight: 600` y `letterSpacing` para máxima legibilidad en tamaños pequeños.

## ConfirmDialog

Diálogo de seguridad para acciones críticas.

- **Ubicación**: `src/components/ui/ConfirmDialog.tsx`
- **Props Clave**:
    - `isOpen`: Control de visibilidad.
    - `onConfirm`: Callback de ejecución.
    - `message`: Contenido (acepta ReactNode para advertencias complejas).
    - `isLoading`: Muestra un spinner en el botón de confirmación mientras se procesa la acción.
- **Accesibilidad**: Basado en el componente `AccessibleDialog`, gestiona correctamente el `focus trap` y el cierre con `Esc`.

## DetailModal

Visualizador avanzado de detalles de entidad con capacidad de edición integrada.

- **Ubicación**: `src/components/ui/DetailModal.tsx`
- **Props Clave**:
    - `sections`: Array de `DetailSection` que organiza los campos por grupos lógicos.
    - `headerMedia`: Slot para imágenes o visualizaciones grandes en la parte superior.
    - `onEdit`: Callback para disparar el flujo de edición (usa `DynamicFormModal` internamente).
- **Diseño**: Implementa un sistema de Grid responsivo para los campos (`DetailField`) pudiendo configurar el `colSpan` para ocupar varias columnas en pantallas grandes.

## InteractiveTour (Tour de Ayuda)

Sistema de onboarding y asistencia visual para reducir la curva de aprendizaje.

- **Ubicación**: `src/components/common/Tutorial/InteractiveTour.tsx`
- **Características**:
    - **Modo Tips**: Muestra diálogos educativos anclados a elementos de la UI.
    - **Navegación**: Soporta teclado (Flechas para navegar, `Esc` para salir).
    - **Contexto**: Se integra con `TutorialContext` para rastrear qué pasos han sido vistos.
- **Diseño**: Utiliza `Popper` de MUI para posicionamiento dinámico ajustándose al espacio disponible en la pantalla para evitar cortes visuales.
