# Arquitectura UI del módulo de inventario

Este documento describe las funcionalidades y estructura del Frontend para la gestión de productos almacenados y la conciliación de stock (`Inventario.tsx`).

## 1. Visión General
El componente principal de inventario reside en `src/pages/Inventario.tsx`. 
A diferencia de los movimientos brutos, esta vista es responsable de mostrar **una agregación de stock total** (todos los lotes unificados) por cada producto, reduciendo el ruido visual para el usuario.

## 2. Acciones sobre el dato
Recientemente se añadió una columna final de **Acciones** a la tabla de productos para permitir la exploración granular de ese stock unificado.

### 2.1 Ver detalles y lotes
- Se despliega el modal interactivo `InventoryDetailModal.tsx` en modo **view**.
- Muestra el desglose renglón por renglón de todos los lotes individuales que conforman el stock de ese producto en específico.
- **Datos visibles:** ID acortado de lote, Nombre del Proveedor, Ubicación física y Fecha de Caducidad.

### 2.2 Auditar o conciliar stock
- Despliega `InventoryDetailModal.tsx` en modo **audit**.
- Lista exactamente los mismos lotes, pero transforma la celda de cantidad numérica en un `TextField` *input* editable.
- Permite a los supervisores de almacén re-introducir los conteos manuales y guardarlos directamente presionando el botón de Disquete. 
- Al guardar, la herramienta consume dinámicamente el endpoint `PATCH /inventario/:id` mediante el servicio interno `updateInventarioItem` localizado en `src/services/inventario.service.ts`.
- Una vez actualizada la línea, el modal notifica al padre (`Inventario.tsx`) que despache un re-render general (`reloadInventario`) provocando que el stock unificado de la página principal refleje instantáneamente el ajuste auditado.

## 3. Consideraciones Técnicas
- **Componentes Empleados**: Material UI (`DataTable`, `Dialog`, `TextField`, `IconButton`), React Hooks estándar (`useState`, `useEffect` para re-poblar el modal).
- **Validación Rápida**: El modal previene que un usuario aplique cantidades negativas o "vacías" (`NaN`) mediante advertencias (Toasts).
- **Escalabilidad**: Actualmente el endpoint de API subyacente devuelve un gran payload de inventarios no paginado y el frontend procesa localmente el *reduce* (en `agregarInventarioPorProducto`). Si en un futuro el catálogo de lotes escalara masivamente, esta suma agregada deberá trasladarse al backend para aliviar la carga de memoria en el cliente React.

