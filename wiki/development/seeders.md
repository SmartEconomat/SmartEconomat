# Seeders y Datos de Desarrollo

Documentación de los seeders que pueblan la base de datos con datos de ejemplo para desarrollo y testing.

---

## Ejecución

```bash
cd backend/smart-economat-backend

# Ejecutar todos los seeders (solo entorno desarrollo)
npm run seed

# Reset completo: drop schema + sync + seed
npm run db:reset
```

> **Seguridad:** Los seeders solo se permiten en desarrollo (`NODE_ENV=development`). Si el entorno no es desarrollo o la base de datos tiene perfil de producción (ej. nombre con `prod`), la ejecución se bloquea.

---

## Orden de Ejecución

Los seeders se ejecutan secuencialmente respetando las dependencias entre entidades:

| # | Seeder | Entidades | Registros (dev) | Dependencias |
|---|--------|-----------|-----------------|--------------|
| 1 | `roles-permisos` | Permiso, PlantillaRol, Rol, RolPermiso | ~70 permisos + 4 plantillas + 4 roles de sistema | — |
| 2 | `usuario` | Usuario, Profesor, Alumno, AlumnoSlot, UsuarioRol | 1 admin + profesores + alumnos | Roles |
| 3 | `proveedor` | Proveedor | ~10 | — |
| 4 | `producto` | Producto, ProductoProveedor, ProductoAlergeno | ~25 productos | Proveedor |
| 5 | `inventario` | Inventario, Ubicacion | 1 por ProductoProveedor + 6 ubicaciones | ProductoProveedor |
| 6 | `pedido` | PedidoUsuario, PedidoUsuarioLinea, Pedido, PedidoProducto, PurchaseBatch | ~8 agregados con separación por proveedor | Usuario, Proveedor, ProductoProveedor |
| 7 | `recepcion` | Recepcion, RecepcionPedido, RecepcionProducto | 1 por Pedido | Pedido |
| 8 | `albaran` | Albaran, AlbaranPedidoRecepcion | ~5 | RecepcionPedido |
| 9 | `historial-precio` | HistorialPrecio | 1–5 por ProductoProveedor | ProductoProveedor |
| 10 | `incidencia` | Incidencia, IncidenciaLinea | 1–5 | RecepcionPedido, Pedido |
| 11 | `movimiento` | Movimiento | ~50 | Usuario, Producto, Pedido |
| 12 | `receta` | Receta, RecetaIngrediente | ~10 recetas, 2–5 ingredientes cada una | Producto |

---

## Grafo de Dependencias

```
roles-permisos ──► usuario
                      │
proveedor ──► producto (+ ProductoProveedor + ProductoAlergeno)
                  │
                  ├──► inventario (+ Ubicacion)
                  ├──► historial-precio
                  └──► receta
                      
pedido ──► recepcion ──► albaran
  │             │
  └─────────────┴──► incidencia

movimiento (referencia a Usuario, Producto, Pedido)
```

---

## Detalle por Seeder

### 1. Roles y Permisos (`roles-permisos.seeder.ts`)

Crea la estructura base de autorización:
- **~70 permisos** organizados por módulo (CRUD por cada módulo del sistema)
- **4 plantillas de rol**
- **4 roles dinámicos de sistema** sincronizados con sus permisos para pruebas del panel de acceso:

| Plantilla | Descripción |
|-----------|-------------|
| `SUPER_ADMIN` | Todos los permisos |
| `ADMINISTRADOR` | Gestión completa sin acceso a configuración del sistema |
| `PROFESOR` | Lectura de inventario, gestión de alumnos |
| `ALUMNO` | Acceso de solo lectura limitado |

### 2. Usuarios (`usuario.seeder.ts`)

Crea usuarios con diferentes roles:
- 1 usuario administrador
- 2–3 profesores con sus perfiles
- Alumnos asignados a profesores con slots de clase
- Asignación automática en `usuario_rol` según el rol semántico de cada usuario
- **Contraseña por defecto:** `SmartEconomat2026!` (hasheada con bcrypt)

### 3. Proveedores (`proveedor.seeder.ts`)

Genera ~10 proveedores con datos generados por Faker:
- Nombre, email, dirección, teléfono, NIF/CIF

### 4. Productos (`producto.seeder.ts`)

Crea ~25 productos con:
- **Datos de OpenFoodFacts:** Si la API está disponible, descarga productos reales del mercado español con sus alérgenos
- **Fallback a Faker:** Si la API no está disponible, genera datos ficticios
- Relaciones producto-proveedor (1–3 proveedores por producto)
- Mapeo de alérgenos desde la taxonomía de OpenFoodFacts

### 5. Inventario (`inventario.seeder.ts`)

- 1 registro de inventario por cada relación producto-proveedor
- 6 ubicaciones fijas de almacén
- Cantidades mínimas y máximas
- Fechas de caducidad

### 6. Pedidos (`pedido.seeder.ts`)

- Genera `PedidoUsuario` como agregado visible de negocio
- Crea automáticamente varios `Pedido` internos por proveedor cuando corresponde
- Genera `PedidoUsuarioLinea` para mantener la trazabilidad de la línea original
- Conserva `PurchaseBatch` para lotes administrativos de compra
- Incluye pedidos semanales históricos para poblar “Mis pedidos” y la vista semanal

### 7. Recepción (`recepcion.seeder.ts`)

- 1 recepción por cada pedido existente
- Recepción parcial (1–100% de la cantidad pedida)
- Seguimiento de cantidades recibidas vs. pedidas

### 8. Albaranes (`albaran.seeder.ts`)

- ~5 albaranes que vinculan 1–3 recepciones cada uno
- Referencia de documento generada automáticamente
- Flag de concordancia

### 9. Historial de Precios (`historial-precio.seeder.ts`)

- 1–5 registros históricos por relación producto-proveedor
- Variaciones de precio de ±30–50%

### 10. Incidencias (`incidencia.seeder.ts`)

- 1–5 incidencias de discrepancia en recepciones
- Líneas de diferencia (tipo FALTANTE)
- Estado de resolución (PENDIENTE)

### 11. Movimientos (`movimiento.seeder.ts`)

- ~50 registros de movimientos de stock
- Tipos de entidad: PRODUCTO, PEDIDO, AJUSTE
- Trazabilidad completa con referencia a UUID de la entidad

### 12. Recetas (`receta.seeder.ts`)

- ~10 recetas con 2–5 ingredientes cada una
- Niveles de dificultad y tiempos de preparación

---

## Comportamiento por Entorno

| Entorno | Registros | API OpenFoodFacts | Ejecución |
|---------|-----------|-------------------|-----------|
| **development** | Conjunto completo (~10 proveedores, ~25 productos, etc.) | Activada | `npm run seed` |
| **test** | Conjunto mínimo (~2 proveedores, datos reducidos) | Desactivada | Automática en E2E |
| **production** | — | — | **Bloqueada** |

## Notas de modelado recientes

- Los seeders de pedidos ya no deben asumirse como “un pedido = un proveedor = una fila visible”.
- `numeroGlobal` pertenece a `PedidoUsuario` y es el valor que la UI expone como numeración de negocio.
- Las recepciones y las incidencias siguen colgando de `Pedido` y `PedidoProducto`, no de `PedidoUsuario`.

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `src/seeders/seed.ts` | Runner principal que ejecuta todos los seeders en orden |
| `src/seeders/interfaces/seeder.interface.ts` | Interfaz base que deben implementar los seeders |
| `src/common/helpers/seeder-i18n.helper.ts` | Mensajes i18n para la salida de los seeders |
