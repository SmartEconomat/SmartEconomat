# Página: Gestión de Inventario

**Ruta:** `/inventario`
**Ubicación:** `src/pages/Inventario.tsx`

## Propósito
La página de Inventario es el centro de control para el stock físico del economato. Permite visualizar niveles de existencias, gestionar ubicaciones, realizar ajustes manuales y auditar la disponibilidad de productos por lotes y almacenes.

## Componentes Utilizados
- **[PageToolbar](../componentes/PageToolbar.md)**: Acciones globales como "Añadir Inventario", búsqueda por escáner y gestión de ubicaciones.
- **[DataTable](../componentes/DataTable.md)**: Listado de stock con indicadores visuales de cantidad y alertas.
- **[SmartFilterAutocomplete](../componentes/SmartFilterAutocomplete.md)**: Filtrado avanzado por categorías, proveedores y ubicaciones.
- **[InteractiveTour](../componentes/InteractiveTour.md)**: Guía interactiva por los controles de auditoría y control.

## Ayuda y Control de Auditoría ✅

El módulo de Inventario cuenta con soporte interactivo para garantizar la precisión del stock:

### Tour de Gestión de Existencias (7 pasos)
1. **Gestión de Inventario**: Introducción a la centralización de stock.
2. **Entrada de Stock**: Cómo añadir productos manualmente.
3. **Configuración de Almacén**: Gestión de ubicaciones y zonas.
4. **Búsqueda e IA**: Uso del escáner y localización ágil.
5. **Filtros Inteligentes**: Refinado por categorías y almacenes.
6. **Ubicaciones y Slots**: Cambio entre vistas globales y asignadas.
7. **Acciones de Control**: Ajustes por mermas y auditoría de lotes.

## Funcionalidades Clave
- **Control de Caducidades**: Resaltado visual de lotes próximos a vencer.
- **Gestión Multi-Ubicación**: Organización de productos por estanterías, cámaras y zonas.
- **Ajustes en Caliente**: Posibilidad de corregir discrepancias de stock directamente desde la tabla mediante modales de regularización.
- **Integración con Compras**: Vinculación directa con los pedidos que generaron la entrada inicial.

## Servicios Consumidos
| Método | Endpoint | Uso |
| :--- | :--- | :--- |
| GET | `/inventario` | Obtención del stock consolidado con soporte para filtros. |
| POST | `/inventario/ajuste` | Registro de regularizaciones manuales con motivo. |
| GET | `/ubicaciones` | Carga de la estructura de almacén. |
