# Módulo de Distribución

## Estado del documento

Este documento describe la **implementación funcional y técnica** de la `Distribución` (Fase 1) en SmartEconomat.

Define la arquitectura operativa para construir el puente entre `Pedidos`, `Recepción`, `Inventario` y `Preparaciones`.

---

## Objetivo

La distribución debe cubrir el tramo que hoy falta entre la compra/recepción y el consumo real por aula o usuario:

- partir de los `PedidoUsuario` realizados por alumnos o profesores,
- comprobar qué parte de esas líneas ya fue realmente comprada y recepcionada,
- mover físicamente stock desde el almacén general hacia un destino operativo,
- dejar trazabilidad exacta de qué pedido de usuario quedó servido,
- permitir que las preparaciones posteriores descuenten stock del aula correspondiente y no siempre del almacén general.

---

## Decisión de arquitectura

### No crear “inventarios separados” como módulos distintos

La mejor opción no es tener una segunda tabla o subsistema de inventario exclusivo para aulas.

La opción recomendada es:

- mantener una única entidad `Inventario`,
- seguir usando `Ubicacion` como partición física del stock,
- tratar cada aula como una `Ubicacion` operativa,
- registrar la distribución como un movimiento interno entre ubicaciones.

Esto encaja con la arquitectura actual porque ya existe:

- `Inventario.ubicacionId`,
- consulta de stock por ubicación,
- administración de `Ubicacion`,
- trazabilidad de movimientos,
- relación de alumnos con `AlumnoSlot` (`aula`, `numeroClase`, `profesor`).

---

## Modelo propuesto

### Flujo completo

```text
PedidoUsuario -> Pedido -> Recepción -> Inventario (Almacén Principal)
                                     -> Distribución -> Inventario (Aula)
                                     -> Preparación/Consumo desde Aula
```

### Qué representa `Distribución`

`Distribución` no es una segunda recepción ni un ajuste manual.

Es un movimiento logístico interno que:

- toma stock ya recepcionado,
- lo asigna a una línea concreta de `PedidoUsuario`,
- lo traslada desde una `Ubicacion` origen a una `Ubicacion` destino,
- deja el pedido de usuario parcial o totalmente servido.

### Agregados propuestos

#### `Distribucion`

Cabecera del proceso de reparto.

Campos propuestos:

- `usuarioResponsableId`
- `pedidoUsuarioId`
- `ubicacionOrigenId`
- `ubicacionDestinoId`
- `alumnoSlotId?`
- `estado` (`borrador`, `preparada` (Por recoger), `parcial`, `entregada`, `cancelada`)
- `fechaPreparacion`
- `fechaEntrega`
- `observaciones`

#### Estados y Colores (UI)

Para una mejor diferenciación visual:
- **`preparada` (Por recoger)**: Se muestra en **amarillo/naranja** (`warning`). Indica que la distribución está lista pero aún no ha sido recogida/entregada.
- **`entregada`**: Se muestra en **verde** (`success`).

#### `DistribucionLinea`

Detalle por línea entregable.

Campos propuestos:

- `distribucionId`
- `pedidoUsuarioLineaId`
- `productoProveedorId`
- `cantidadPedida`
- `cantidadRecepcionadaAtribuida`
- `cantidadYaDistribuida`
- `cantidadADistribuir`
- `cantidadEntregada`
- `inventarioOrigenId`
- `inventarioDestinoId?`
- `estado` (`pendiente`, `parcial`, `entregada`, `cancelada`)
- `observaciones`

---

## Trazabilidad exacta

La distribución puede ser exacta porque la cadena de relaciones ya existe en backend:

- `RecepcionProducto.pedidoProductoId`
- `PedidoProducto.pedidoUsuarioLineaId`

Eso permite calcular para cada `PedidoUsuarioLinea`:

- cantidad pedida,
- cantidad realmente recepcionada,
- cantidad ya distribuida,
- cantidad pendiente de servir.

Regla principal:

$$
cantidad\_a\_distribuir \le \min(recepcionado\_atribuido - ya\_distribuido,\ stock\_fisico\_disponible\_en\_origen)
$$

---

## Stock por aula

### Sí, se puede implementar

Y además encaja bien con lo que ya existe.

La propuesta correcta es:

- `Almacén Principal` sigue siendo la ubicación por defecto de recepción,
- cada aula relevante pasa a tener su propia `Ubicacion`,
- la distribución crea una salida del almacén general y una entrada en la ubicación del aula,
- las preparaciones del aula descuentan desde esa ubicación del aula.

### Por qué es mejor así

- mantiene un inventario único y consistente,
- permite ver dónde está físicamente cada producto,
- evita duplicar lógica de stock,
- reutiliza filtros, exports y consultas actuales de `Inventario`,
- hace posible auditoría completa de movimientos entre espacios.

---

## Relación entre aula y ubicación

### Opción recomendada

Mantener una relación explícita entre `AlumnoSlot` y `Ubicacion`.

Hay dos formas válidas:

#### Opción 1 — Relación directa en `Ubicacion`

- añadir `alumnoSlotId?` a `Ubicacion`,
- imponer unicidad para que un slot tenga como máximo una ubicación operativa,
- usar esa relación para inferir automáticamente el destino de distribución.

#### Opción 2 — Tabla puente `slot_ubicacion`

- crear una entidad de mapeo,
- útil solo si en el futuro un aula pudiera tener varias ubicaciones activas.

### Recomendación

Usar la **Opción 1**.

Hoy el modelo de negocio sugiere una correspondencia principal “slot/aula -> almacén operativo”, y no hace falta añadir una abstracción extra.

---

## Impacto en preparaciones

Este punto es importante: **a día de hoy las preparaciones consumen stock global**, no stock contextual del aula.

`ProduccionService`:

- suma inventario disponible de todas las ubicaciones para validar stock,
- va descontando de los `Inventario` encontrados sin restringir por aula,
- solo usa `ubicacionDestinoId` para decidir dónde deja el producto resultante.

### Qué hay que cambiar para que funcione por aula

Para que una preparación descuente del aula correcta hace falta una de estas dos reglas:

#### Regla A — Selección explícita de ubicación origen

- el usuario elige desde qué `Ubicacion` cocina/prepara,
- la producción solo consume stock de esa ubicación,
- si falta stock ahí, falla aunque exista stock en otra ubicación.

#### Regla B — Inferencia automática por usuario

- si el usuario es alumno, se toma su `AlumnoSlot`,
- se resuelve la `Ubicacion` vinculada a ese slot,
- la preparación consume de esa ubicación por defecto,
- un profesor o administrador puede sobrescribirla si tiene permiso.

### Recomendación

Implementar ambas:

- **autoselección** por slot/aula para alumnos,
- **selector visible** para profesor/admin cuando deban operar sobre otra ubicación.

---

## Reglas de negocio propuestas

### Reglas de distribución

- solo se puede distribuir lo que ya haya sido recepcionado,
- no se puede distribuir por encima del stock físico disponible en la ubicación origen,
- no se puede marcar una línea como entregada completa si queda cantidad pendiente,
- una cancelación de distribución debe revertir únicamente lo no confirmado o generar movimiento inverso explícito si ya estaba confirmada.

### Reglas de aula

- un `AlumnoSlot` puede tener una `Ubicacion` operativa asociada,
- si un usuario alumno crea o consume recursos, su slot puede actuar como contexto por defecto,
- una distribución a aula debe preferir `Ubicacion` del slot antes que texto libre.

### Reglas de estado del pedido de usuario

El estado actual de `PedidoUsuario` no distingue aún entre “recibido” y “distribuido al aula”.

Por eso se recomienda:

- mantener el estado actual de pedido sin romper la lógica existente en la primera iteración,
- añadir en `Distribución` el estado de servicio real,
- valorar en fase posterior un nuevo estado agregado de negocio si realmente aporta valor en UI.

---

## Movimientos de inventario

La distribución debe registrar movimientos propios, no reciclar `ajuste`.

### Nuevos tipos recomendados

- `salida_distribucion`
- `entrada_distribucion`

Con esto se puede reconstruir:

- qué salió del almacén principal,
- a qué aula fue,
- qué pedido de usuario motivó el traslado,
- qué stock quedó después por ubicación.

---

## Frontend propuesto

### Página principal

Nueva ruta y página:

- `src/pages/Distribucion.tsx`

### Feature sugerida

```text
src/features/distribucion/
├── components/
├── hooks/
├── services/
├── types/
└── utils/
```

### Comportamiento esperado

- listado de `PedidoUsuario` distribuibles,
- detalle por línea con cantidades `pedida / recepcionada / distribuida / pendiente`,
- selector de ubicación destino del aula,
- acción para preparar distribución,
- confirmación de entrega,
- vista filtrable por aula, profesor, alumno, estado y fecha.

#### Interacción y Usabilidad

- **Ordenación por columnas**: Las tablas de "Disponibles" e "Historial" permiten ordenación local (por página) haciendo clic en las cabeceras. Esto incluye lógica específica para:
    - `Pedido`: Numérico.
    - `Usuario/Aula/Destino`: Alfabético (case-insensitive).
    - `Fecha Entrega`: Cronológico.
    - `Pendiente/Líneas`: Cantidades agregadas.

---

## Backend propuesto

### Nuevo módulo

```text
src/modules/distribucion/
├── controller/
├── dto/
├── distribucion.entity/
├── distribucion-linea.entity/
├── enums/
├── service/
└── distribucion.module.ts
```

### Endpoints iniciales

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/distribuciones` | Listar distribuciones |
| `GET` | `/distribuciones/disponibles` | Listar pedidos usuario distribuibles |
| `POST` | `/distribuciones` | Crear borrador/preparación |
| `GET` | `/distribuciones/:id` | Ver detalle |
| `PATCH` | `/distribuciones/:id/confirmar` | Confirmar traslado/entrega |
| `PATCH` | `/distribuciones/:id/cancelar` | Cancelar distribución |

### Permisos nuevos

- `distribuciones:listar`
- `distribuciones:ver`
- `distribuciones:crear`
- `distribuciones:confirmar`
- `distribuciones:cancelar`

---

## Fases recomendadas

### Fase 1 — Distribución interna base

- módulo `Distribución`,
- líneas trazadas a `PedidoUsuarioLinea`,
- movimientos entre `Almacén Principal` y `Ubicacion` destino,
- UI inicial de preparación/confirmación.

### Fase 2 — Aula como contexto operativo

- relación `AlumnoSlot <-> Ubicacion`,
- autoselección de ubicación destino por aula,
- filtros por profesor/aula/alumno.

### Fase 3 — Consumo contextual

- preparaciones descuentan desde la ubicación del aula,
- fallback controlado para profesor/admin,
- reporting por aula y consumo real.

---

## Recomendación final

Sí, se puede implementar distribución con inventario por aula y es una buena dirección.

La decisión recomendada es:

- **usar `Ubicacion` como almacén por aula**, no otro inventario paralelo,
- **implementar `Distribución` como traslado interno trazado**, no como ajuste,
- **vincular aula/slot con ubicación** para que el sistema sepa dónde dejar y desde dónde consumir,
- **ajustar después preparaciones** para que consuman stock del aula correspondiente.

Ese enfoque conserva la coherencia del modelo actual y abre la puerta a inventario pedagógico por aula sin romper recepción ni el inventario general.