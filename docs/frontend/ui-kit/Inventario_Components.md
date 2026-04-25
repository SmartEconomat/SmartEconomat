# Componentes de Inventario

Biblioteca de componentes para la gestión precisa de existencias, control de ubicaciones y trazabilidad de lotes en el economato.

---

## InventarioFilters

Sistema de filtrado avanzado para la gestión de existencias y alertas de stock.

- **Ubicación**: `src/features/inventario/InventarioFilters.tsx`
- **Características**:
    - **Filtros de Alerta**: Permite filtrar rápidamente productos con "Stock Bajo" o "Stock Crítico".
    - **Filtrado por Ubicación**: Selector inteligente para visualizar existencias en zonas específicas (ej: Secos, Cámara, Congelador).
- **Diseño**: Compacto y responsivo, diseñado para integrarse en la `PageToolbar` sin ocupar espacio excesivo.

## InventoryDetailModal

El componente central para la gestión granular de un producto en el almacén.

- **Ubicación**: `src/components/inventario/InventoryDetailModal.tsx`
- **Modos de Operación**:
    - **Vista (View)**: Muestra el desglose de todos los lotes activos, sus proveedores, ubicaciones y fechas de caducidad.
    - **Auditoría (Audit)**: Habilita campos de edición para realizar ajustes manuales de stock (+/-) con validación en tiempo real para evitar stocks negativos.
- **Características de Cálculo**:
    - **Conversión de Unidades**: Calcula automáticamente el equivalente en la unidad de medida del producto (ej: "5 unidades ≈ 2.5 KG").
    - **Proyección de Stock**: Muestra visualmente el cambio resultante antes de confirmar la auditoría utilizando códigos de colores (Verde para incremento, Ámbar para reducción).
- **Acciones Críticas**:
    - **Reporte de Merma**: Botón destacado que abre un sub-flujo de registro de mermas con confirmación de seguridad.

## QuickLocationDialog

Diálogo ligero para la modificación rápida de la ubicación de un lote.

- **Ubicación**: `src/components/inventario/QuickLocationDialog.tsx`
- **Props Clave**:
    - `currentLocationId`: Ubicación actual del lote.
    - `onUpdate`: Callback que dispara el movimiento de inventario en el backend.
- **Diseño**: Minimiza el número de clics necesarios para reorganizar el almacén, ideal para uso en tablets durante la reposición.

## UbicacionesModal (Gestión de Estructura)

Componente administrativo para definir la estructura física del almacén.

- **Ubicación**: `src/components/inventario/UbicacionesModal.tsx`
- **Funcionalidad**: Permite crear, editar y archivar zonas de almacenamiento (Pasillos, Estanterías, Cámaras) que luego estarán disponibles en los selectores de toda la aplicación.
