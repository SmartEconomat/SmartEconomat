# 📦 Recepción de Productos — Dominio y Backend

> **SmartEconomat · Escuela de Cocina**  
> Módulo de Recepción: análisis de dominio DDD, diseño backend y propuesta de base de datos.

---

## 1. 🏗️ Modelo de Dominio (DDD)

### Aggregate Roots del módulo

```
BC Almacén
├── AR: Recepcion  ← Aggregate Root principal (Entry Point)
│   ├── RecepcionPedido[]      (entidades internas — vincula N pedidos)
│   └── RecepcionProducto[]    (entidades internas — líneas de detalle)
│
├── AR: Inventario  (impactado; lote nuevo por cada línea ACEPTADA)
├── AR: Movimiento  (generado automáticamente tras confirmar)
└── AR: Incidencia  (generada automáticamente si hay diferencias)

BC Compras (dependencia de solo lectura)
├── AR: Pedido
└── PedidoProducto[]

BC Documentación
├── Albaran
└── AlbaranPedidoRecepcion (tabla puente Albaran ↔ RecepcionPedido)
```

### Entidades y sus campos (Real — del código actual)

| Entidad | Campos clave | Rol en el proceso |
|---------|-------------|-------------------|
| **Recepcion** | `id`, `id_usuario`, `fecha_recepcion`, `estado` *(nuevo)*, `observaciones` | Aggregate Root — cabecera del acto de recepción |
| **RecepcionPedido** | `id_recepcion`, `id_pedido`, `fecha_vinculacion` | Puente N:M Recepcion ↔ Pedido |
| **RecepcionProducto** | `id_recepcion`, `id_pedido_producto`, `cantidad_recibida`, `observaciones`, `fecha_recepcion` | Línea de detalle con cotejo pedido vs. real |
| **Incidencia** | `id_recepcion`, `id_usuario_resolutor`, `datos_originales (JSONB)`, `observaciones_resolucion`, `fecha_resolucion` | Estado inferido: `NULL` = PENDIENTE, con fecha = RESUELTA |
| **Inventario** | `id_producto_proveedor`, `cantidad_actual`, `cantidad_minima`, `cantidad_maxima`, `ubicacion_almacen`, `fecha_entrada`, `fecha_caducidad` | Stock físico por lote (FEFO) |
| **Movimiento** | `tipo`, `cantidad`, `id_usuario`, `id_inventario`, `id_producto_proveedor`, `entidad_tipo`, `entidad_id`, `fecha`, `descripcion` | Auditoría de cada cambio (polimórfico) |
| **Albaran** | `n_albaran`, `concordancia`, `fecha` | Documento físico del proveedor — vinculado opcionalmente tras confirmar |
| **AlbaranPedidoRecepcion** | `id_albaran`, `id_pedido_recepcion` | Puente Albaran ↔ RecepcionPedido |
| **Pedido** | `estado`, `coste_total`, `fecha_pedido`, `fecha_entrega` | Estados: PENDIENTE → EN_PROCESO → RECIBIDO / INCIDENCIA |

---

## 2. 📋 Reglas de Negocio

1. Solo se pueden recepcionar pedidos en estado **`PENDIENTE`** o **`EN_PROCESO`**.
2. `cantidad_recibida >= 0` (CHECK en BD). Si es 0, el ítem se considera no entregado.
3. **Trazabilidad automática**: al confirmar la recepción en el backend se desencadena la cadena completa sin intervención manual:
   - `RecepcionProducto` → crea `Inventario` (lote nuevo, FEFO).
   - `Inventario` creado → genera `Movimiento(tipo=ENTRADA, entidad_tipo='Recepcion', entidad_id=recepcion.id)`.
   - Si existen diferencias o cantidad=0 → genera `Incidencia` con snapshot JSONB de los datos originales.
   - Estado del `Pedido` se recalcula automáticamente.
4. **Recepción parcial**: si `suma(cantidad_recibida) < cantidad_pedida` en alguna línea → el Pedido permanece en `EN_PROCESO`. Se puede crear otra Recepción futura para completarlo.
5. **Incidencia automática** (sin acción del usuario): se crea si:
   - `cantidad_recibida < cantidad_pedida` (falta mercancía)
   - `cantidad_recibida > cantidad_pedida` (exceso)
   - `cantidad_recibida == 0` (ítem no entregado)
6. **Productos desconocidos** (escaneo de código de barras no registrado): si el frontend envía el campo `productosNuevos[]`, el backend los crea en la **misma transacción ACID** antes de procesar las líneas de recepción. Si la creación del producto falla, hay rollback de todo.

---

## 2b. 🔍 Lookup de Productos (Solo Lectura, Fase Pre-Recepción)

Antes de confirmar la recepción, el frontend consulta si un producto existe al escanear su código de barras. Esto **no escribe nada en la BD**.

### `GET /productos?codigoBarras={codigo}`

| Caso | Respuesta | Acción en frontend |
|------|-----------|--------------------|
| Producto encontrado | `200 { id, nombre, unidad, proveedores[] }` | Añadir línea al draft local |
| No encontrado | `404` | Mostrar modal inline para crear producto nuevo |

### `GET /productos?nombre={q}&limit=10`

Fallback textual si no hay escáner físico o el código de barras no es legible.

> **Importante**: el cliente **no hace `POST /productos`** durante la fase de escaneo. Los productos desconocidos se acumulan en el draft como `productoNuevo: { pendienteCreacion: true }` y se envían en el campo `productosNuevos[]` del payload de creación de recepción.

---

## 3. ⚙️ Transacción ACID — Inserción Batch

El servicio ejecuta **una única transacción** con el siguiente orden garantizado:

```
BEGIN TRANSACTION

① Validar pedidos (estado IN ['PENDIENTE', 'EN_PROCESO'])

── OPCIONAL: Productos nuevos escaneados ──────────────────────
①b Si payload.productosNuevos[].length > 0:
   INSERT producto[] BULK (nombre, unidad, tipo, codigoBarras...)
   → Si falla, ROLLBACK total (nadie recibe nada)
───────────────────────────────────────────────────────────────

② INSERT recepcion          → genera recepcion.id (UUID)
③ INSERT recepcion_pedido[] → BATCH (uno por pedido vinculado)
④ INSERT recepcion_producto[]→ BATCH (una línea por producto recibido)

─────────────── Trazabilidad automática ───────────────

⑤ Por cada RecepcionProducto con cantidad_recibida > 0:
   INSERT inventario { productoProveedor, cantidadActual, fechaEntrada, fechaCaducidad, ... }
   INSERT movimiento { tipo=ENTRADA, entidad_tipo='Recepcion', entidad_id=recepcion.id, id_inventario }

⑥ Por cada RecepcionProducto con diferencia (pedido ≠ recibido):
   INSERT incidencia {
     id_recepcion,
     datos_originales: JSONB {
       productos: [{ idPedidoProducto, cantidadPedida, cantidadRecibida, diferencia }],
       observacionesRecepcion
     },
     fecha_resolucion: NULL  ← pendiente
   }

⑦ Por cada Pedido vinculado:
   Calcular sum(recibido) por línea:
   - Si todas completas → UPDATE pedido SET estado='RECIBIDO'
   - Si hay incidencias → UPDATE pedido SET estado='INCIDENCIA'
   - Si recibido parcial → UPDATE pedido SET estado='EN_PROCESO'

COMMIT (o ROLLBACK total si falla cualquier paso)
```

### Consideraciones de rendimiento

| Técnica | Detalle |
|---------|---------|
| **Bulk INSERT** | `manager.save(array[])` → un solo statement por tabla |
| **Índice FEFO** | `(id_producto_proveedor, fecha_caducidad ASC)` en inventario |
| **Índice polimórfico** | `(entidad_id, entidad_tipo)` en movimiento — queries de trazabilidad rápidas |
| **Optimistic Locking** | `@VersionColumn` en Inventario — previene race conditions en alta concurrencia |
| **JSONB en Incidencia** | Sin joins — snapshot inmutable de las discrepancias, válido para auditoría |

---

## 4. 📡 DTOs de la API

### `GET /productos?codigoBarras={codigo}` — Lookup pre-recepción

```typescript
// Response 200 — Producto encontrado
{
  "id": "uuid-prod-001",
  "nombre": "Tomate San Marzano",
  "marca": "La Organic",
  "unidad": "kg",
  "tipo": "FRESCO",
  "codigoBarras": "8410188003028",
  "contenido": 1,
  "proveedores": [
    { "id": "uuid-pp-001", "proveedor": { "id": "uuid-prov-001", "nombre": "Makro" }, "precioUnitario": 1.80 }
  ]
}
// 404 si no existe → el frontend muestra el modal de creación
```

---

### `POST /recepciones` — Payload único (batch)

```typescript
// Request Body
{
  "observaciones": "Caja 3 llega golpeada",
  "pedidoIds": ["uuid-ped-001", "uuid-ped-002"],

  // ── Productos de pedidos (siempre presentes) ──────────────────
  "productos": [
    {
      "pedidoProductoId": "uuid-pp-01",
      "cantidadRecibida": 18.5,
      "observaciones": "Falta 1.5 kg"
    },
    {
      "pedidoProductoId": "uuid-pp-02",
      "cantidadRecibida": 0,
      "observaciones": "No vino en el camión"
    }
  ],

  // ── Productos nuevos (escaneados pero no existían en BD) ───────
  // OPCIONAL — solo si el operario escaneó productos desconocidos
  "productosNuevos": [
    {
      "codigoBarras": "8410188009999",
      "nombre": "Aceite de Girasol Bio",
      "marca": "Naturalia",
      "unidad": "l",
      "tipo": "SECO",
      "contenido": 1,
      "cantidadRecibida": 6,
      "observaciones": "Primera recepción de este producto"
      // El backend crea Producto + ProductoProveedor + Inventario en la misma TX
    }
  ]
}

// Response 201 — Incluye TODO lo que el frontend necesita renderizar
{
  "id": "uuid-rec-001",
  "fechaRecepcion": "2026-02-22T16:25:00Z",

  // ── Incidencias generadas automáticamente ─────────────────────
  "incidencias": [
    {
      "id": "uuid-inc-001",
      "datosOriginales": {
        "productos": [
          {
            "idPedidoProducto": "uuid-pp-01",
            "nombreProducto": "Tomate San Marzano",
            "cantidadPedida": 20,
            "cantidadRecibida": 18.5,
            "diferencia": -1.5,
            "tipo": "FALTA"
          },
          {
            "idPedidoProducto": "uuid-pp-02",
            "nombreProducto": "Aceite Oliva EVOO",
            "cantidadPedida": 10,
            "cantidadRecibida": 0,
            "diferencia": -10,
            "tipo": "NO_ENTREGADO"
          }
        ]
      }
    }
  ],

  // ── Estados de pedidos actualizados ───────────────────────────
  "pedidosActualizados": [
    { "id": "uuid-ped-001", "estadoAnterior": "EN_PROCESO", "estadoNuevo": "INCIDENCIA" },
    { "id": "uuid-ped-002", "estadoAnterior": "EN_PROCESO", "estadoNuevo": "RECIBIDO" }
  ],

  // ── Resumen de trazabilidad ────────────────────────────────────
  "movimientosGenerados": 2,
  "inventariosCreados": 2,

  // ── Productos creados en esta transacción ─────────────────────
  "productosCreados": [
    { "id": "uuid-prod-nuevo", "nombre": "Aceite de Girasol Bio", "codigoBarras": "8410188009999" }
  ]
}
```

---

## 5. 🔍 Trazabilidad Bidireccional

```
HACIA ADELANTE (origen → destino):
  Pedido.id
    → RecepcionPedido.id_pedido
      → Recepcion.id
        → RecepcionProducto.id_recepcion
          → Inventario (via fecha_entrada + id_producto_proveedor)
            → Movimiento.id_inventario

HACIA ATRÁS (auditoría sanitaria):
  Movimiento.entidad_tipo = 'Recepcion'
  Movimiento.entidad_id = Recepcion.id
    → Recepcion → RecepcionProducto → PedidoProducto → ProductoProveedor → Proveedor
    → Recepcion → Incidencia.datos_originales (JSONB — snapshot inmutable)
    → Recepcion.usuario → ¿Quién recibió?
    → Recepcion.fecha_recepcion → ¿Cuándo?
```

### Query de trazabilidad completa por ID de recepción

```sql
SELECT
    r.id                        AS recepcion_id,
    r.fecha_recepcion,
    u.nombre                    AS recibido_por,
    p.nombre                    AS producto,
    pv.nombre                   AS proveedor,
    rp.cantidad_recibida,
    pp.cantidad                 AS cantidad_pedida,
    pp.cantidad - rp.cantidad_recibida AS diferencia,
    m.tipo                      AS movimiento,
    m.id                        AS movimiento_id,
    inv.cantidad_actual,
    inv.fecha_caducidad,
    inv.ubicacion_almacen,
    i.datos_originales          AS incidencia_snapshot
FROM recepcion r
JOIN usuario u                 ON u.id = r.id_usuario
JOIN recepcion_producto rp     ON rp.id_recepcion = r.id
JOIN pedido_producto pp        ON pp.id = rp.id_pedido_producto
JOIN producto_proveedor ppv    ON ppv.id = pp.id_producto_proveedor
JOIN producto p                ON p.id = ppv.id_producto
JOIN proveedor pv              ON pv.id = ppv.id_proveedor
LEFT JOIN movimiento m         ON m.entidad_id = r.id AND m.entidad_tipo = 'Recepcion'
LEFT JOIN inventario inv       ON inv.id = m.id_inventario
LEFT JOIN incidencia i         ON i.id_recepcion = r.id
WHERE r.id = $1;
```

---

## 6. 📄 Flujo del Albarán

El `Albaran` representa el **documento físico** que entrega el proveedor junto a la mercancía (número de albarán del proveedor, fecha, concordancia con el pedido).

### ¿Cuándo se vincula?

- **Es opcional** — no bloquea la confirmación de la Recepción.
- Se vincula **después de confirmar** la recepción: el operario introduce el número de albarán del proveedor y el sistema lo asocia a las `RecepcionPedido` correspondientes vía `AlbaranPedidoRecepcion`.
- Puede crearse en la misma pantalla de resultado (paso 4 del wizard) o desde una pantalla independiente de albaranes.

### Reglas de negocio del Albarán

| Regla | Detalle |
|-------|--------|
| Un albarán puede vincular **N** `RecepcionPedido` | Si el proveedor entrega varios pedidos con un solo albarán |
| Un `RecepcionPedido` puede aparecer en **N** albaranes | Si la entrega fue fraccionada en varias entregas documentadas |
| `concordancia` | Boolean que indica si el albarán físico coincide con lo pedido. Lo marca el operario al revisarlo |
| No es obligatorio para confirmar | La transacción ACID de recepción no espera al albarán |

### Flujo del albarán

```
[Recepcion confirmada → 201 OK]
         │
         ▼ (opcional, fuera de la transacción)
[Operario introduce n_albaran del proveedor]
         │
         ▼
POST /albaranes { nAlbaran, fecha, concordancia }
         │
         ▼
[Albaran creado → id_albaran]
         │
         ▼
POST /albaranes/:id/vincular { recepcionPedidoIds[] }
         │
         ▼
[INSERT albaran_pedido_recepcion[] BULK]
         │
         ▼
[El albarán queda trazable desde Recepcion → RecepcionPedido → AlbaranPedidoRecepcion → Albaran]
```

---

## 7. 🗄️ Esquema Relacional Propuesto (DDL)

```sql
-- ENUMERADOS
CREATE TYPE estado_pedido    AS ENUM ('PENDIENTE','EN_PROCESO','RECIBIDO','INCIDENCIA','CANCELADO');
CREATE TYPE tipo_movimiento  AS ENUM ('ENTRADA','SALIDA','DEVOLUCION','AJUSTE');
CREATE TYPE local_inventario AS ENUM ('CAMARA_FRIA','CAMARA_CONGELACION','ALMACEN_SECO','ALMACEN_GENERAL','DESPENSA_AULA');

-- recepcion  (AGGREGATE ROOT)
CREATE TABLE recepcion (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario      UUID REFERENCES usuario(id) ON DELETE SET NULL,
    fecha_recepcion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version         INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_recepcion_usuario ON recepcion(id_usuario);
CREATE INDEX idx_recepcion_fecha   ON recepcion(fecha_recepcion);

-- recepcion_pedido  (puente N:M)
CREATE TABLE recepcion_pedido (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_recepcion      UUID NOT NULL REFERENCES recepcion(id)    ON DELETE RESTRICT,
    id_pedido         UUID NOT NULL REFERENCES pedido(id)        ON DELETE RESTRICT,
    fecha_vinculacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version           INT NOT NULL DEFAULT 0,
    UNIQUE (id_recepcion, id_pedido)
);
CREATE INDEX idx_rp_recepcion ON recepcion_pedido(id_recepcion);
CREATE INDEX idx_rp_pedido    ON recepcion_pedido(id_pedido);

-- recepcion_producto  (líneas de detalle)
CREATE TABLE recepcion_producto (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_recepcion       UUID NOT NULL REFERENCES recepcion(id)       ON DELETE CASCADE,
    id_pedido_producto UUID NOT NULL REFERENCES pedido_producto(id) ON DELETE RESTRICT,
    cantidad_recibida  NUMERIC(12,3) NOT NULL,
    observaciones      TEXT,
    fecha_recepcion    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version            INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_cant_recibida CHECK (cantidad_recibida >= 0)
);
CREATE INDEX idx_recprod_recepcion  ON recepcion_producto(id_recepcion);
CREATE INDEX idx_recprod_pedidoprod ON recepcion_producto(id_pedido_producto);

-- inventario  (stock físico por lote FEFO)
CREATE TABLE inventario (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_producto_proveedor UUID NOT NULL REFERENCES producto_proveedor(id) ON DELETE RESTRICT,
    cantidad_actual       NUMERIC(12,3) NOT NULL DEFAULT 0,
    cantidad_minima       NUMERIC(12,3) NOT NULL DEFAULT 0,
    cantidad_maxima       NUMERIC(12,3),
    ubicacion_almacen     local_inventario NOT NULL,
    fecha_entrada         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_caducidad       TIMESTAMPTZ NOT NULL,
    version               INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_cant_actual CHECK (cantidad_actual >= 0),
    CONSTRAINT chk_cant_min   CHECK (cantidad_minima >= 0),
    CONSTRAINT chk_cant_max   CHECK (cantidad_maxima IS NULL OR cantidad_maxima >= cantidad_minima)
);
CREATE INDEX idx_inv_pp     ON inventario(id_producto_proveedor);
CREATE INDEX idx_inv_fefo   ON inventario(id_producto_proveedor, fecha_caducidad ASC);
CREATE INDEX idx_inv_ubic   ON inventario(ubicacion_almacen);

-- movimiento  (auditoría polimórfica — generado automáticamente)
CREATE TABLE movimiento (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo                  tipo_movimiento NOT NULL,
    cantidad              NUMERIC(12,3) NOT NULL,
    id_usuario            UUID REFERENCES usuario(id)           ON DELETE SET NULL,
    id_inventario         UUID REFERENCES inventario(id)        ON DELETE SET NULL,
    id_producto_proveedor UUID REFERENCES producto_proveedor(id) ON DELETE SET NULL,
    entidad_tipo          VARCHAR(50) NOT NULL,  -- 'Recepcion' | 'Pedido' | 'AjusteManual'
    entidad_id            UUID NOT NULL,
    fecha                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descripcion           TEXT,
    version               INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_mov_cant CHECK (cantidad >= 0)
);
CREATE INDEX idx_mov_polimorfico ON movimiento(entidad_id, entidad_tipo);
CREATE INDEX idx_mov_inventario  ON movimiento(id_inventario);
CREATE INDEX idx_mov_fecha       ON movimiento(fecha);

-- incidencia  (generada automáticamente si hay diferencias)
CREATE TABLE incidencia (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_recepcion             UUID NOT NULL REFERENCES recepcion(id) ON DELETE CASCADE,
    id_usuario_resolutor     UUID REFERENCES usuario(id)            ON DELETE SET NULL,
    datos_originales         JSONB NOT NULL,  -- snapshot inmutable de diferencias
    observaciones_resolucion TEXT,
    fecha_resolucion         TIMESTAMPTZ,     -- NULL = pendiente
    version                  INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_inc_recepcion ON incidencia(id_recepcion);
CREATE INDEX idx_inc_datos     ON incidencia USING GIN(datos_originales);

-- albaran_pedido_recepcion (vincula albarán con recepcion_pedido)
CREATE TABLE albaran_pedido_recepcion (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_albaran          UUID NOT NULL REFERENCES albaran(id)          ON DELETE CASCADE,
    id_pedido_recepcion UUID NOT NULL REFERENCES recepcion_pedido(id) ON DELETE CASCADE,
    version             INT NOT NULL DEFAULT 0
);
```
