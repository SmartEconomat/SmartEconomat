# 📊 Recepción de Productos — Diagramas

> Todos los diagramas del módulo en un único fichero ordenados por propósito.

---

## 1. 🧩 UML de Clases — Dominio Completo

Refleja las **entidades reales del código** con sus relaciones exactas.

```mermaid
classDiagram
    direction TB

    class BaseEntity {
        +UUID id
        +Date createdAt
        +Date updatedAt
        +int version
    }

    class Usuario {
        +string nombre
        +string username
        +string password
        +string email
        +rolUsuario rol
        +boolean activo
        +Pedido[] pedidos
        +Recepcion[] recepciones
        +Movimiento[] movimientos
        +Incidencia[] incidenciasResueltas
        +hashPassword() void
        +validarPassword(plain) boolean
    }

    class Proveedor {
        +string nombre
        +string cif
        +string email
        +string telefono
    }

    class Producto {
        +string nombre
        +string marca
        +string descripcion
        +UnidadProducto unidad
        +TipoProducto tipo
        +string codigoBarras
        +number contenido
    }

    class ProductoProveedor {
        +string marca
        +string codigoBarras
        +number precioUnitario
    }

    class Pedido {
        +Date fechaPedido
        +Date fechaEntrega
        +number costeTotal
        +EstadoPedido estado
        +string motivoCancelacion
        +calcularTotal() number
        +marcarComoEntregado() void
        +cancelar(motivo) void
    }

    class PedidoProducto {
        +number cantidad
        +number precioUnitario
        +string observaciones
        +get subtotal() number
    }

    class Recepcion {
        +Date fechaRecepcion
        +string observaciones
    }

    class RecepcionPedido {
        +Date fechaVinculacion
    }

    class RecepcionProducto {
        +number cantidadRecibida
        +string observaciones
        +Date fechaRecepcion
    }

    class Inventario {
        +number cantidadActual
        +number cantidadMinima
        +number cantidadMaxima
        +localInventario ubicacionAlmacen
        +Date fechaEntrada
        +Date fechaCaducidad
        +ajustarCantidad(delta) void
        +esBajoStock() boolean
        +proximoACaducar(dias) boolean
    }

    class Movimiento {
        +TipoMovimiento tipo
        +number cantidad
        +string entidad
        +UUID entidadId
        +Date fecha
        +string descripcion
    }

    class Incidencia {
        +JSONB datosOriginales
        +string observacionesResolucion
        +Date fechaResolucion
        +resolver(usuarioId, obs) void
        +estaResuelta() boolean
    }

    class Albaran {
        +string nAlbaran
        +boolean concordancia
        +Date fecha
    }

    class AlbaranPedidoRecepcion {
    }

    class HistorialPrecio {
        +number precio
        +Date fechaDesde
    }

    %% Herencia
    BaseEntity <|-- Usuario
    BaseEntity <|-- Proveedor
    BaseEntity <|-- Producto
    BaseEntity <|-- ProductoProveedor
    BaseEntity <|-- Pedido
    BaseEntity <|-- PedidoProducto
    BaseEntity <|-- Recepcion
    BaseEntity <|-- RecepcionPedido
    BaseEntity <|-- RecepcionProducto
    BaseEntity <|-- Inventario
    BaseEntity <|-- Movimiento
    BaseEntity <|-- Incidencia
    BaseEntity <|-- Albaran
    BaseEntity <|-- AlbaranPedidoRecepcion

    %% Producto ↔ Proveedor
    Producto "1" --> "N" ProductoProveedor : suministrado por
    Proveedor "1" --> "N" ProductoProveedor : suministra
    ProductoProveedor "1" --> "N" Inventario : tiene stock
    ProductoProveedor "1" --> "N" HistorialPrecio : historial

    %% Pedido
    Usuario "1" --> "N" Pedido : crea
    Pedido "1" --> "N" PedidoProducto : tiene líneas
    PedidoProducto "N" --> "1" ProductoProveedor : de

    %% Recepcion (Aggregate Root)
    Usuario "1" --> "N" Recepcion : realiza
    Recepcion "1" --> "N" RecepcionPedido : vincula
    RecepcionPedido "N" --> "1" Pedido : referencia
    Recepcion "1" --> "N" RecepcionProducto : detalla
    RecepcionProducto "N" --> "1" PedidoProducto : coteja con

    %% Trazabilidad automática (generado por el backend)
    Recepcion "1" --> "N" Incidencia : genera auto
    Recepcion "1" --> "N" Movimiento : genera auto
    Movimiento "N" --> "1" Inventario : actualiza
    Movimiento "N" --> "1" ProductoProveedor : referencia
    Usuario "1" --> "N" Movimiento : registra
    Incidencia "N" --> "1" Usuario : resuelve

    %% Albarán
    Albaran "1" --> "N" AlbaranPedidoRecepcion : incluye
    AlbaranPedidoRecepcion "N" --> "1" RecepcionPedido : de
```

---

## 2. 📌 Casos de Uso

```mermaid
graph LR
    Almacen(["👤 Responsable de Almacén"])
    Sistema(["⚙️ Sistema Backend"])
    Admin(["🔑 Administrador"])

    subgraph UC["📦 Módulo Recepción"]
        CU1["Consultar pedidos pendientes"]
        CU2["Iniciar nueva recepción"]
        CU3["Seleccionar pedidos a vincular"]
        CU4["Localizar producto (Escaneo/Nombre)"]
        CU5["Crear producto si es desconocido"]
        CU6["Rellenar cantidades por producto"]
        CU7["Añadir observaciones generales y por línea"]
        CU8["Revisar resumen de diferencias"]
        CU9["Confirmar y enviar batch"]
        CU10["AUTOMÁTICO: Crear Inventario lote"]
        CU11["AUTOMÁTICO: Generar Movimientos"]
        CU12["AUTOMÁTICO: Generar Incidencias"]
        CU13["AUTOMÁTICO: Actualizar estado Pedido"]
        CU14["Revisar incidencias de una recepción"]
        CU15["Resolver incidencia"]
        CU16["Consultar historial de recepciones"]
        CU17["Trazabilidad: búsqueda por lote/pedido"]
    end

    Almacen --> CU1
    Almacen --> CU2
    Almacen --> CU3
    Almacen --> CU4
    Almacen --> CU5
    Almacen --> CU6
    Almacen --> CU7
    Almacen --> CU8
    Almacen --> CU9
    Almacen --> CU14
    Almacen --> CU16

    Admin --> CU13
    Admin --> CU15
    Admin --> CU14

    CU9 -.->|include| CU10
    CU9 -.->|include| CU11
    CU9 -.->|extend si diferencias| CU12
    CU9 -.->|include| CU13

    Sistema --> CU10
    Sistema --> CU11
    Sistema --> CU12
    Sistema --> CU13
```

---

---

## 2b. 📷 Flujo de Escaneo de Productos (lookup + draft)

```mermaid
flowchart TD
    START(["Operario quiere añadir un producto al lote"]) --> METODO{"¿Cómo localiza
el producto?"}

    METODO -->|"Escanea código
de barras"| SCAN["GET /productos?codigoBarras={code}"]
    METODO -->|"Búsqueda textual
por nombre"| SEARCH["GET /productos?nombre={q}&limit=10"]

    SCAN --> RES1{"¿200 OK?"}
    RES1 -->|"Sí — encontrado"| FOUND
    RES1 -->|"404 — No existe"| NOTFOUND

    SEARCH --> RES2{"¿Resultados?"}
    RES2 -->|"Sí — selecciona"| FOUND["id + nombre + unidad + proveedores"]
    RES2 -->|"Sin coincidencias"| NOTFOUND["Modal: Producto desconocido"]

    FOUND --> PROV{"¿Tiene relación
con el proveedor
del pedido activo?"}
    PROV -->|"Sí"| ADD1["Añadir línea al draft
cantidadRecibida = 1"]
    PROV -->|"No / desconocido"| ADD2["Añadir línea al draft
sin proveedor vinculado"]

    NOTFOUND --> FORM["Operario rellena:
nombre, unidad, tipo, contenido"]
    FORM --> CONFIRM{"¿Confirma?"}
    CONFIRM -->|"Sí"| ADD3["Añadir al draft
productoNuevo.pendienteCreacion=true"]
    CONFIRM -->|"Cancelar"| CANCEL(["Descarta"])

    ADD1 --> SAVE["Auto-guardar draft en localStorage"]
    ADD2 --> SAVE
    ADD3 --> SAVE

    SAVE --> MORE{"¿Más productos?"}
    MORE -->|"Sí"| START
    MORE -->|"No"| DONE(["Continuar a Revisión Final"])
```

> **Clave**: en ningún punto de este flujo se escribe en la BD. Todo permanece en el estado local del cliente hasta el envío final del batch.

---

## 3. 🔄 Diagrama de Secuencia — Frontend Completo (Escaneo + Envio + Resultado)

```mermaid
sequenceDiagram
    autonumber
    actor Op as Operario Almacen
    participant FE as Frontend
    participant LS as localStorage
    participant API as Backend API

    Note over Op,API: FASE 1 — Seleccion de pedidos
    Op->>FE: Abre "Nueva Recepcion"
    FE->>API: GET /pedidos?estado=EN_PROCESO
    API-->>FE: Pedido[]
    FE-->>Op: Muestra pedidos disponibles
    Op->>FE: Selecciona PED-001 y PED-002
    FE->>API: GET /pedidos/PED-001 y GET /pedidos/PED-002
    API-->>FE: PedidoProducto[] por cada pedido
    FE->>LS: Guardar draft inicial

    Note over Op,API: FASE 2 — Escaneo del lote (sin escrituras en BD)
    loop Por cada producto físico recibido
        Op->>FE: Escanea codigo de barras
        FE->>API: GET /productos?codigoBarras={code}
        alt Producto encontrado (200)
            API-->>FE: { id, nombre, unidad, proveedores }
            FE->>FE: Añade linea al draft
        else No existe (404)
            API-->>FE: 404
            FE-->>Op: Modal "Producto desconocido"
            Op->>FE: Rellena nombre, unidad, tipo
            FE->>FE: Añade linea con productoNuevo.pendienteCreacion=true
        end
        FE->>LS: Auto-save draft (debounce 2s)
    end

    Note over Op,FE: FASE 3 — Relleno de cantidades (sin llamadas al backend)
    Op->>FE: Introduce cantidadRecibida por linea
    FE->>FE: Actualiza estado visual de cada linea
    FE->>LS: Auto-save draft

    Note over Op,FE: FASE 4 — Revision final
    Op->>FE: Pulsa "Revisar"
    FE->>FE: Construye tabla de diferencias
    FE-->>Op: Muestra resumen con estimacion de incidencias
    Op->>FE: Pulsa "Confirmar Recepcion"

    Note over Op,API: FASE 5 — Envio atomico y resultado
    FE->>FE: validarDraft() - validacion local
    alt Hay errores de formato
        FE-->>Op: Scroll al primer error y badge contador
    else Sin errores locales
        FE->>FE: Construye payload DTO completo
        FE-->>Op: Spinner "Enviando..."
        FE->>API: POST /recepciones {pedidoIds, productos, productosNuevos}
        API-->>FE: 201 Created - RecepcionResultado
        FE->>LS: localStorage.removeItem(DRAFT_KEY)
        FE-->>Op: Paso 4 RESULTADO con incidencias y estados de pedidos
    end

    opt Si el backend devuelve error
        API-->>FE: 4xx o 500
        FE-->>Op: Alerta de error
        Note over FE,LS: Draft NO se borra. Operario puede reintentar.
    end
```

---

## 4. 🔄 Diagrama de Secuencia — Backend (Transacción y Trazabilidad)

```mermaid
sequenceDiagram
    autonumber
    participant FE as 🖥️ Frontend
    participant API as 🔌 Controller (NestJS)
    participant SVC as ⚙️ RecepcionService
    participant DB as 🗄️ PostgreSQL

    FE->>API: POST /recepciones {pedidoIds, productos, productosNuevos, observaciones}
    API->>API: Valida DTO (class-validator)

    API->>SVC: crearRecepcion(dto, usuarioId)
    SVC->>DB: BEGIN TRANSACTION

    rect rgb(245, 245, 245)
        Note over SVC,DB: ─── OPCIONAL: Productos desconocidos ───
        SVC->>DB: ⓪ INSERT producto[] BULK (creación bajo demanda)
    end

    SVC->>DB: SELECT pedidos WHERE id IN (...)
    DB-->>SVC: Pedido[]
    SVC->>SVC: Valida estado ∈ [PENDIENTE, EN_PROCESO]

    SVC->>DB: ① INSERT recepcion
    DB-->>SVC: recepcion { id }

    SVC->>DB: ② INSERT recepcion_pedido[] BULK
    Note over SVC,DB: 1 fila por pedido vinculado

    SVC->>DB: ③ INSERT recepcion_producto[] BULK
    Note over SVC,DB: 1 fila por línea de producto

    rect rgb(220, 255, 220)
        Note over SVC,DB: ─── Trazabilidad AUTOMÁTICA ───
        SVC->>DB: ④ INSERT inventario[] BULK
        Note over SVC,DB: Solo líneas cantidad_recibida > 0 Nuevo lote FEFO por cada línea

        SVC->>DB: ⑤ INSERT movimiento[] BULK
        Note over SVC,DB: tipo=ENTRADA, entidad_tipo='Recepcion' entidad_id=recepcion.id, id_inventario=nuevo
    end

    rect rgb(255, 230, 220)
        Note over SVC,DB: ─── Incidencias AUTOMÁTICAS ───
        SVC->>SVC: Detecta líneas con diferencia (cant_pedida ≠ cant_recibida)
        SVC->>DB: ⑥ INSERT incidencia BULK
        Note over SVC,DB: datosOriginales: JSONB snapshot fecha_resolucion: NULL (pendiente)
    end

    rect rgb(230, 230, 255)
        Note over SVC,DB: ─── Estados de Pedidos ───
        loop Por cada Pedido vinculado
            SVC->>DB: SELECT SUM(cant_recibida) GROUP BY id_pedido_producto
            DB-->>SVC: Totales
            SVC->>SVC: calcularEstadoPedido()
            SVC->>DB: ⑦ UPDATE pedido SET estado = ?
        end
    end

    SVC->>DB: COMMIT
    DB-->>SVC: OK

    SVC-->>API: RecepcionResultado {id, incidencias[], movimientosGenerados, pedidosActualizados}
    API-->>FE: 201 Created

    opt Si falla cualquier paso
        SVC->>DB: ROLLBACK
        DB-->>SVC: OK
        SVC-->>API: Exception
        API-->>FE: 4xx / 500 — Nada persistido
    end
```

---

## 5. ⚙️ Máquina de Estados — `Recepcion` y `Pedido`

### Estados de la Recepcion

```mermaid
stateDiagram-v2
    direction LR

    [*] --> BORRADOR : Usuario abre el formulario

    BORRADOR --> BORRADOR : Edita líneas (auto-save local)

    BORRADOR --> ANULADA : El operario cancela antes de enviar
    ANULADA --> [*] : Estado local final (no se persiste en BD)

    BORRADOR --> ENVIANDO : Confirma y el frontend valida OK

    ENVIANDO --> PROCESANDO : POST enviado al backend

    note right of ENVIANDO
        Estados BORRADOR, ANULADA,
        ENVIANDO y PROCESANDO
        solo existen en el CLIENTE.
        El backend solo persiste
        la recepción ya completada.
    end note

    PROCESANDO --> COMPLETADA : Transacción OK Todas las líneas recibidas correctamente

    PROCESANDO --> PARCIAL : Transacción OK ≥1 línea recibida < pedida

    PROCESANDO --> CON_INCIDENCIAS : Transacción OK ≥1 línea con diferencia o cantidad = 0

    PROCESANDO --> ERROR : Rollback (nada persiste)
    ERROR --> BORRADOR : El draft local se conserva → reintentar

    COMPLETADA --> [*]
    PARCIAL --> [*]
    CON_INCIDENCIAS --> [*]
```

### Estados del Pedido impactados

```mermaid
stateDiagram-v2
    direction LR

    [*] --> PENDIENTE : Pedido creado

    PENDIENTE --> EN_PROCESO : Tramitado con proveedor

    EN_PROCESO --> RECIBIDO : sum(recibido) ≥ pedido en TODAS las líneas

    EN_PROCESO --> EN_PROCESO : Recepción parcial sum(recibido) < pedido en alguna línea

    EN_PROCESO --> INCIDENCIA : ≥1 línea con cantidad = 0 o discrepancia

    INCIDENCIA --> EN_PROCESO : Incidencia resuelta (reposición/devolución)

    EN_PROCESO --> CANCELADO : Anulado manualmente
    PENDIENTE --> CANCELADO : Anulado manualmente

    RECIBIDO --> [*]
    CANCELADO --> [*]
```

### Estados de la `Incidencia`

> ⚠️ **La entidad `Incidencia` real no tiene un campo `estado` enum.** El estado se infiere del campo `fechaResolucion`:
> - `fechaResolucion = NULL` → **PENDIENTE** (sin resolver)
> - `fechaResolucion = Date` → **RESUELTA** (el método `estaResuelta()` aplica esta lógica)

```mermaid
stateDiagram-v2
    direction LR

    [*] --> PENDIENTE : Generada AUTO en la transacción
    note right of PENDIENTE
        fechaResolucion = NULL
        usuarioResolutor = null
        datosOriginales: JSONB snapshot inmutable
        de las diferencias detectadas
    end note

    PENDIENTE --> RESUELTA : incidencia.resolver(usuarioId, obs)
    note right of RESUELTA
        fechaResolucion = NOW()
        usuarioResolutor = Usuario asignado
        observacionesResolucion almacenadas
    end note

    RESUELTA --> [*] : Cerrada
```

---

## 6. 🗃️ ERD — Relaciones entre tablas

```mermaid
erDiagram
    usuario {
        uuid id PK
        varchar nombre
        varchar username
        varchar email
        enum rol
    }

    recepcion {
        uuid id PK
        uuid id_usuario FK
        timestamptz fecha_recepcion
        enum estado
        text observaciones
    }

    recepcion_pedido {
        uuid id PK
        uuid id_recepcion FK
        uuid id_pedido FK
        timestamptz fecha_vinculacion
    }

    recepcion_producto {
        uuid id PK
        uuid id_recepcion FK
        uuid id_pedido_producto FK
        numeric cantidad_recibida
        text observaciones
    }

    pedido {
        uuid id PK
        uuid id_usuario FK
        enum estado
        numeric coste_total
        timestamptz fecha_pedido
    }

    pedido_producto {
        uuid id PK
        uuid id_pedido FK
        uuid id_producto_proveedor FK
        numeric cantidad
        numeric precio_unitario
    }

    producto_proveedor {
        uuid id PK
        uuid id_producto FK
        uuid id_proveedor FK
        numeric precio_unitario
    }

    producto {
        uuid id PK
        varchar nombre
        enum tipo
        enum unidad
    }

    proveedor {
        uuid id PK
        varchar nombre
    }

    inventario {
        uuid id PK
        uuid id_producto_proveedor FK
        numeric cantidad_actual
        enum ubicacion_almacen
        timestamptz fecha_caducidad
    }

    movimiento {
        uuid id PK
        uuid id_inventario FK
        uuid id_usuario FK
        enum tipo
        numeric cantidad
        varchar entidad_tipo
        uuid entidad_id
    }

    incidencia {
        uuid id PK
        uuid id_recepcion FK
        uuid id_usuario_resolutor FK
        jsonb datos_originales
        timestamptz fecha_resolucion
    }

    albaran {
        uuid id PK
        varchar n_albaran
        boolean concordancia
        timestamptz fecha
    }

    albaran_pedido_recepcion {
        uuid id PK
        uuid id_albaran FK
        uuid id_pedido_recepcion FK
    }

    usuario ||--o{ recepcion : realiza
    usuario ||--o{ pedido : crea
    usuario ||--o{ movimiento : registra
    usuario ||--o{ incidencia : resuelve

    recepcion ||--|{ recepcion_pedido : vincula
    recepcion ||--|{ recepcion_producto : detalla
    recepcion ||--o{ incidencia : genera

    recepcion_pedido }o--|| pedido : referencia
    recepcion_pedido ||--o{ albaran_pedido_recepcion : vinculada

    recepcion_producto }o--|| pedido_producto : coteja

    pedido ||--|{ pedido_producto : tiene
    pedido_producto }o--|| producto_proveedor : de

    producto_proveedor }o--|| producto : es
    producto_proveedor }o--|| proveedor : de
    producto_proveedor ||--o{ inventario : stock

    inventario ||--o{ movimiento : afectado

    albaran ||--|{ albaran_pedido_recepcion : incluye
```
