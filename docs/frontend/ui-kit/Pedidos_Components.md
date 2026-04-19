# Componentes de Pedidos

Sistema de componentes para la gestión del ciclo de vida de los pedidos, desde la solicitud del usuario hasta la consolidación de compras por lote.

---

## PedidosTabs

Control de navegación segmentado para alternar entre las diferentes dimensiones del módulo de pedidos.

- **Ubicación**: `src/features/pedidos/components/PedidosTabs.tsx`
- **Vistas Soportadas**:
    - **MIS PEDIDOS**: Vista personal del usuario (Historial y estado actual).
    - **PEDIDOS**: Vista administrativa para revisar todas las solicitudes.
    - **COMPRAS**: Gestión de pedidos a proveedores y lotes de compra.
- **Diseño**: Utiliza un contenedor con `alpha(theme.palette.divider, 0.05)` para crear un efecto de "botón segmentado" moderno. El indicador de pestaña activa tiene un radio de borde de `8px` y una sombra sutil para destacar sobre el fondo.

## PedidoCard

Componente atómico para representar un pedido de usuario en formato de tarjeta (Grid).

- **Ubicación**: `src/features/pedidos/components/PedidoCard.tsx`
- **Características**:
    - **Cabecera de Estado**: Integra `StatusChip` para indicar de forma clara si el pedido está Pendiente, Entregado o Cancelado.
    - **Resumen de Contenido**: Muestra el número global del pedido, la fecha y el coste total.
    - **Selección Operativa**: Incluye un `Checkbox` integrado (vía `selectionProps`) para permitir la selección múltiple en procesos de consolidación masiva.
- **Diseño**: Bordes redondeados y una elevación suave para separar visualmente los pedidos en la vista de cuadrícula.

## PedidosWeeklyBoard (Tablero Semanal)

Componente complejo de gestión logística que agrupa los pedidos por semana y usuario.

- **Ubicación**: `src/features/pedidos/components/PedidosWeeklyBoard.tsx`
- **Características Principales**:
    - **Agrupación Inteligente**: Utiliza `Accordions` anidados para organizar la información por:
        1. **Semana**: Rango de fechas calculado automáticamente (ej: "Semana 18/04 - 24/04").
        2. **Usuario**: Desglose de pedidos por cada solicitante dentro de la semana.
    - **Consolidación Masiva**: Permite seleccionar múltiples pedidos de diferentes usuarios y consolidarlos en un solo proceso con el botón "Consolidar semana".
    - **Integración con DataTable**: Cada sección de usuario inyecta una `DataTable` en modo `hideTopBar` para mostrar el detalle técnico de cada pedido sin saturar la interfaz.
- **Microcopy Operativo**: Incluye alertas informativas que guían al administrador sobre el propósito de la vista (ej: "Vista operativa para revisar los pedidos pendientes...").

## PedidoDetailDrawer

Panel lateral (Drawer) para la visualización profunda y edición rápida de un pedido.

- **Ubicación**: `src/features/pedidos/components/PedidoDetailDrawer.tsx`
- **Características**:
    - **Vista Deslizable**: Proporciona un acceso rápido al detalle sin perder el contexto de la lista principal.
    - **Acciones Rápidas**: Permite cambiar el estado del pedido o navegar al perfil del usuario directamente desde el panel.
    - **Resumen de Líneas**: Desglosa cada producto solicitado, su cantidad y el precio unitario en el momento de la compra.
