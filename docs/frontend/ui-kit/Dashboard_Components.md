# Componentes de Dashboard

Biblioteca de componentes atómicos diseñados específicamente para el panel de control (Inicio).

## DashboardMetricCard

Tarjeta interactiva para visualización de KPIs principales.

- **Ubicación**: `src/features/dashboard/components/DashboardMetricCard.tsx`
- **Props**:
    - `title`: Título de la métrica.
    - `value`: Valor numérico o string.
    - `icon`: Elemento React (MUI Icon).
    - `color`: Tema de color (`primary`, `secondary`, `error`, `warning`, `info`, `success`).
    - `onClick`: Función al hacer clic.
    - `description`: Texto secundario opcional.
    - `trend`: (Opcional) `{ value: number, isPositive: boolean }`.
- **Accesibilidad**: Soporta navegación por teclado (Enter/Space), tiene `role="button"` y `aria-label` dinámico.
- **Diseño**: Utiliza `alpha()` para fondos suaves que garantizan contraste > 4.5:1 con el icono.

## DashboardQuickAction

Botón de acción rápida con feedback visual mejorado.

- **Ubicación**: `src/features/dashboard/components/DashboardQuickAction.tsx`
- **Props**:
    - `title`: Acción a realizar.
    - `icon`: Icono representativo.
    - `color`: Esquema de color.
    - `onClick`: Callback de acción.
    - `description`: Guía rápida de lo que hace el botón.
- **Comportamiento Hover**: Al pasar el ratón, el fondo del icono (`.action-icon-box`) se llena con el color principal y el propio icono se vuelve blanco, proporcionando un feedback visual de alta calidad.

## SummaryModal

Diálogo genérico para mostrar detalles de estadísticas con soporte de navegación filtrada.

- **Ubicación**: `src/components/ui/SummaryModal.tsx`
- **Características**:
    - **Limitación de Datos**: Muestra un máximo de 10 elementos para optimizar el rendimiento y la legibilidad.
    - **Navegación Inteligente**: Incluye un botón "Ver todos" que redirige al módulo correspondiente aplicando filtros automáticos.
    - **Microcopy Estándar**: Los botones de navegación utilizan etiquetas gramaticalmente correctas y específicas por tipo (ej: "Ver todos los proveedores" en lugar de construcciones dinámicas genéricas).
    - **Soporte de Tipos**: `productos`, `pedidos`, `incidencias`, `stock`, `proveedores`.

