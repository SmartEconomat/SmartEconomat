# Exploración: Botón Histórico de Precios por Proveedor (Productos)

## Estado Actual (Frontend)

### Ubicación del bloque de proveedores
- **Archivo**: [Productos.tsx](Productos.tsx)  
- **Componente**: `DetailModal` (líneas ~710-900+)
- **Sección**: "Proveedores asociados" 
- **Estructura**: Stack de Paper cards (uno por proveedor)

### Histórico de precios
- **Ya existe**: Sección "Histórico de precios" en DetailModal (línea ~870+)
- **Filtrado**: Dropdown por proveedor (estado `historyProviderFilter`)
- **Tabla**: Renderiza con columnas: Fecha, Proveedor, Cant., Precio, Doc.
- **Datos cargados**: En `useState<HistorialPrecio[]>` con carga async

### Servicios API
- **Función**: `fetchHistorialPrecios(productoId, proveedorId?)` en [producto.service.ts](producto.service.ts#L263)
- **Endpoint**: GET `/productos/{id}/historial-precios?proveedorId={id}` ✓ soporta filtrado
- **Backend**: Ya implementado en `ProductoService.getHistorialPrecios()` con filtrado por proveedorId

### Patrón de acciones existente
- **DataTable**: Prop `renderActions` (usada en Productos, Proveedores, Incidencias)
- **Componentes**: Tooltip + IconButton (VisibilityIcon, EditIcon, DeleteIcon)
- **Stack**: `<Stack direction="row" spacing={1} justifyContent="center">`

## Dónde está PMP
- **Mostrado en**: Sección "Información general" de DetailModal
- **Campo**: `p.pmp` (Typography con fontWeight={700}, color='primary.main')
- **Obtener**: Viene en `Producto.pmp` del listado

## Huecos de Tests
- Sí existen tests: [productoForm.helpers.test.ts](productoForm.helpers.test.ts)
- NO hay tests e2e para Productos.tsx (página de listado)
- Test.tsx existe (Recepcion.test.tsx) pero no Productos.test.tsx

## Recomendaciones para integración
1. **Botón en cada Paper**: Agregar IconButton con histórico en esquina superior derecha de cada Paper (proveedor)
2. **Acción**: onClick → filtrar histórico a ese proveedorId específico + scroll a tabla
3. **Ícono sugerido**: `HistoryIcon` o `TrendingUpIcon` de MUI
4. **Tooltip**: "Ver histórico de precios"
5. **Sin permisos nuevos**: Usar `'productos:ver'` existente (ya aplicado en endpoint)
