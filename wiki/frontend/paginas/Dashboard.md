# Página: Dashboard / Inicio

**Ruta:** `/`
**Layout:** `MainLayout.tsx`
**Componente raíz:** `src/pages/Home.tsx`
**Última actualización:** 2026-03-21

---

## Descripción

El dashboard de SmartEconomat es la vista inicial de la aplicación autenticada. Durante esta rama se ha refactorizado para integrarse con el diseño global real de la app, reutilizar servicios existentes y alinearse con el sistema de permisos dinámicos y sesión `cookie-first`.

No es una pantalla “especial” fuera del sistema: se comporta como una ruta privada más, protegida por permisos y alimentada por el endpoint consolidado del backend.

---

## Fuentes de datos

### Endpoint principal

- **`GET /api/v1/dashboard/stats`**
- Servicio frontend: `src/services/dashboard.service.ts`
- Permiso backend requerido: `dashboard:ver_estadisticas`

Este endpoint devuelve en una sola respuesta:

- KPIs generales (`totalProductos`, `productosEsteMes`, `totalProveedores`)
- Resumen de inventario
- Resumen de pedidos
- Alertas de caducidad
- `movimientosRecientes`

Con esto se evita hacer una petición separada por cada widget del dashboard.

### Servicios reutilizados por acciones rápidas

Las acciones rápidas no usan endpoints paralelos ni lógica duplicada:

- `createProducto()`
- `createPedido()`
- `createReceta()`
- `fetchProveedores()` para poblar el selector de proveedor al crear pedidos

La navegación a recepción reutiliza la ruta oficial:

- `navigate('/recepciones')`

---

## Integración de permisos

### Acceso a la ruta

La ruta `/` se protege desde `menuConfig` y `AppRouter` con el permiso:

- `dashboard:ver_estadisticas`

Si el usuario no dispone de ese permiso:

- no se realiza la carga normal de estadísticas,
- la página entra en estado de error controlado,
- y la navegación directa sigue bloqueada por `ProtectedRoute`.

### Permisos granulares dentro del dashboard

Además del permiso base del dashboard, cada bloque visual se filtra con permisos específicos del módulo correspondiente:

| Bloque | Permiso |
|---|---|
| Productos | `productos:listar` |
| Pedidos | `pedidos:listar` |
| Incidencias | `incidencias:listar` |
| Inventario / stock | `inventario:listar` |
| Proveedores | `proveedores:listar` |
| Acción rápida “Nuevo Pedido” | `pedidos:crear` |
| Acción rápida “Añadir Producto” | `productos:crear` |
| Acción rápida “Registrar Recepción” | `recepciones:crear` |
| Acción rápida “Nueva Receta” | `recetas:crear` |

Esto garantiza coherencia con el resto de vistas: una tarjeta no aparece si el usuario no tiene acceso al módulo real.

---

## Persistencia local permitida

El dashboard usa `localStorage` solo para preferencias visuales, no para seguridad:

- **`dashboard_visible_metrics`**: lista de tarjetas visibles seleccionadas por el usuario.

Esto no afecta a:

- autenticación,
- permisos,
- contenido autorizado del backend,
- ni acceso a rutas.

La sesión sigue dependiendo exclusivamente de la cookie `httpOnly` y del `AuthContext`.

---

## Estructura visual actual

La vista se organiza en dos columnas principales:

1. **Columna principal**
   - cabecera con saludo,
   - tarjetas KPI,
   - acciones rápidas,
   - personalizador de métricas.

2. **Columna lateral**
   - actividad reciente,
   - acceso al historial completo de movimientos.

Este layout reutiliza `Paper`, `Card`, `Stack`, `Alert`, `Spinner` y el sistema tipográfico MUI ya presente en la aplicación, evitando introducir otro lenguaje visual paralelo.

---

## Componentes relacionados

| Archivo | Rol |
|---|---|
| `src/pages/Home.tsx` | Orquestador principal del dashboard |
| `src/services/dashboard.service.ts` | Acceso al endpoint consolidado de KPIs |
| `src/components/dashboard/MetricsCustomizer.tsx` | Selector de tarjetas visibles |
| `src/components/ui/SummaryModal.tsx` | Modal de resumen enlazado desde varias métricas |
| `src/routes/ProtectedRoute.tsx` | Guardia de sesión y permisos |
| `src/utils/config/menuConfig.tsx` | Declaración de la ruta `/` y su permiso |

---

## Decisiones de diseño relevantes

- El dashboard ya no depende de supuestos de rol; se basa en permisos efectivos del usuario.
- La carga de datos se centraliza en un único endpoint backend.
- La actividad reciente se ordena en cliente de más reciente a más antigua para mantener consistencia con la vista de movimientos.
- Las acciones rápidas reutilizan los servicios existentes del dominio en lugar de introducir wrappers específicos del dashboard.
- La personalización de UI permanece separada de la seguridad y la sesión.

---

## Historial de cambios recientes

| Fecha | Cambio |
|---|---|
| 2026-03-21 | Ruta `/` alineada con `dashboard:ver_estadisticas`; corrección de permisos granulares internos y documentación del modelo de personalización visual. |
| 2026-03-21 | Corrección de la tarjeta de incidencias para usar `incidencias:listar` en lugar de permisos de pedidos. |
| 2026-03-21 | Navegación de acción rápida de recepción actualizada a `/recepciones`. |
