# 🖥️ Recepción de Productos — Frontend

> Diseño del cliente: flujo de escaneo, resolución de productos, persistencia del draft y comunicación con el backend.

---

## 1. Principio Clave: Una Sola Llamada al Backend

```
❌ INCORRECTO: 1 POST por producto → N peticiones → inconsistencias posibles
✅ CORRECTO  : Construir todo en cliente → 1 POST atómico → transacción ACID
```

El frontend es responsable de **construir el objeto completo** y enviarlo como una única petición. El backend decide todo lo que ocurre después (inventario, movimientos, incidencias).

---

## 2. 🔍 Flujo de Escaneo de Productos

Este es el flujo crítico que precede al relleno de cantidades. El operario escanea el código de barras de cada producto recibido físicamente.

### 2.1 Mecanismos de búsqueda de productos

El operario dispone de **dos formas equivalentes** para localizar un producto. Ambas son ciudadanas de primera clase:

| Mecanismo | Cuándo se usa | Endpoint |
|-----------|---------------|----------|
| **Escaneo de código de barras** | El producto tiene etiqueta EAN/QR legible | `GET /productos?codigoBarras={code}` |
| **Búsqueda textual por nombre** | No hay escáner, el código no es legible, o el producto no tiene EAN | `GET /productos?nombre={q}&limit=10` |

**Flujo común tras localizar el producto (por cualquier vía):**

```
    ┌────────────────────────────────────────────────┐
    │ Producto encontrado (200 / item seleccionado)  │ No encontrado (404 o sin resultados)
    │ { id, nombre, unidad, proveedores[] }          │
    │         │                                      │
    │         ▼                                      ▼
    │ ¿Tiene relación con el proveedor          Abrir modal: "Producto desconocido"
    │  del pedido activo?                       → Crear producto nuevo (flujo 2.2)
    │         │                                      │
    │   ┌─────┴─────┐                               │
    │ Sí│           │No                             │
    │   ▼           ▼                               │
    │ Añadir     Añadir al draft                    │
    │ al draft   sin proveedor vinculado            │
    └────────────────────────────────────────────────┘
              │
              ▼
    Añadir línea al draft local
    cantidad_recibida = 1 (por defecto, editable)
    estado visual: "escaneado"
```

### 2.2 Creación de Producto Nuevo (Modal Inline)

Si el código de barras no existe, se interrumpe el flujo con un **modal sin abandonar la pantalla**:

```
┌──────────────────────────────────────────────────┐
│  ⚠️  Producto desconocido                         │
│  Código: 8410188003028                            │
│                                                  │
│  Nombre:    [________________]  *                │
│  Marca:     [________________]                   │
│  Unidad:    [kg ▼]              *                │
│  Tipo:      [SECO ▼]            *                │
│  Contenido: [___]               *                │
│                                                  │
│  ℹ️  Se creará en la BD al confirmar              │
│                                                  │
│         [Cancelar]   [Añadir al lote →]          │
└──────────────────────────────────────────────────┘
```

> **Decisión arquitectónica clave**: el producto **NO se crea en la BD en este momento**. Se encola en el draft como `productoNuevo: { pendienteCreacion: true, datos: {...} }`. La creación real ocurre en el backend al procesar el batch final, en la misma transacción.

### 2.3 Endpoints de Consulta (Solo Lectura, Sin Escritura)

| Método | Ruta | Uso |
|--------|------|-----|
| `GET` | `/productos?codigoBarras={code}` | Lookup por código de barras al escanear |
| `GET` | `/productos?nombre={q}&limit=10` | Búsqueda textual (fallback si no hay escáner) |
| `GET` | `/pedidos?estado=EN_PROCESO` | Pedidos disponibles para recepcionar |
| `GET` | `/pedidos/:id` | Líneas del pedido (`pedidoProductos[]`) |

> ⚠️ Durante la fase de construcción del lote (pasos 1–3 del wizard) **no se realiza ninguna escritura en la BD**. Todo permanece en cliente.

---

## 3. Estructura del Draft Local (Estado del Lote)

El lote es el objeto completo que acumula todo lo que el operario escanea y rellena. **No puede perderse** bajo ninguna circunstancia (cierre accidental, recarga, error de red).

```typescript
interface RecepcionDraft {
  // ── Meta ───────────────────────────────────────────
  version: number;            // Incrementa en cada cambio (detección de conflictos)
  creadoEn: string;           // ISO timestamp del inicio del borrador
  modificadoEn: string;       // Última modificación

  // ── Cabecera ───────────────────────────────────────
  observaciones: string;

  // ── Pedidos vinculados (≥1) ────────────────────────
  pedidosSeleccionados: PedidoDraft[];

  // ── Productos escaneados sin pedido previo ─────────
  // (productos físicamente recibidos no ligados a pedido activo)
  productosEspontaneos: LineaDraft[];

  // ── Control de UI ──────────────────────────────────
  paso: PasoWizard;
  erroresPorLinea: Record<string, string[]>;
  enviando: boolean;
}

interface PedidoDraft {
  id: string;
  descripcion: string;
  proveedor: string;
  lineas: LineaDraft[];
}

type PasoWizard =
  | 'SELECCION_PEDIDOS'    // Paso 1: elegir pedidos
  | 'ESCANEO_LOTE'         // Paso 2: escanear y rellenar cantidades
  | 'REVISION_FINAL'       // Paso 3: revisar resumen con diferencias
  | 'RESULTADO';           // Paso 4: resultado devuelto por el backend

interface LineaDraft {
  pedidoProductoId: string | null;  // null si es producto espontáneo
  nombreProducto: string;
  unidad: string;
  cantidadPedida: number;           // 0 si no venía en ningún pedido

  // ── Producto nuevo (pendiente de crear en BD) ──────
  productoNuevo?: {
    pendienteCreacion: true;
    codigoBarras: string;
    nombre: string;
    marca?: string;
    unidad: string;
    tipo: string;
    contenido: number;
  };

  // ── Campos editables ───────────────────────────────
  cantidadRecibida: number | '';
  observaciones: string;

  // ── Estado visual ──────────────────────────────────
  estado: 'escaneado' | 'sin_rellenar' | 'valida' | 'error' | 'parcial' | 'rechazada' | 'exceso';
}
```

> **Nota**: No hay `estadoCalidad` en `RecepcionProducto` en el código actual. El estado se infiere comparando `cantidadPedida` vs. `cantidadRecibida`. Las **Incidencias las genera el backend automáticamente** — el frontend solo informa visualmente al operario de las discrepancias.

---

## 4. 💾 Persistencia del Draft: Anti-pérdida de Datos

El draft **nunca puede perderse** entre pasos, recargas o cierres accidentales. Se usa una estrategia de doble persistencia:

### 4.1 Estrategia

| Mecanismo | Cuándo | Por qué |
|-----------|--------|---------|
| **`localStorage`** | Cada cambio en el draft (throttle 2s) | Supervive a recargas de pestaña |
| **`sessionStorage`** | Respaldo de sesión activa | Supervive a navegación interna |
| **`beforeunload`** | Antes de cerrar/recargar la pestaña | Escritura síncrona de emergencia |

```typescript
// Clave de almacenamiento
const DRAFT_KEY = 'recepcion_draft_v2';

// Auto-save con throttle (evita escrituras excesivas)
useEffect(() => {
  if (!draft) return;
  const timer = setTimeout(() => {
    const serializado = JSON.stringify({
      ...draft,
      modificadoEn: new Date().toISOString(),
    });
    localStorage.setItem(DRAFT_KEY, serializado);
  }, 2000); // 2 segundos de debounce
  return () => clearTimeout(timer);
}, [draft]);

// Escritura de emergencia al cerrar la pestaña
useEffect(() => {
  const handler = () => {
    if (draft && draft.paso !== 'RESULTADO') {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [draft]);

// Restaurar draft al montar el componente
function restaurarDraftSiExiste(): RecepcionDraft | null {
  const guardado = localStorage.getItem(DRAFT_KEY);
  if (!guardado) return null;

  const draft: RecepcionDraft = JSON.parse(guardado);

  // Draft caducado (>24h) — preguntar al usuario
  const antigüedad = Date.now() - new Date(draft.modificadoEn).getTime();
  const horas = antigüedad / 1000 / 3600;

  if (horas > 24) {
    const continuar = window.confirm(
      `Hay un borrador de hace ${Math.round(horas)}h. ¿Continuar con él o descartarlo?`
    );
    if (!continuar) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
  }

  return draft;
}
```

### 4.2 Cuándo se elimina el draft

El draft se borra de `localStorage` **únicamente** cuando:
- El backend devuelve `201 Created` exitosamente.
- El operario pulsa **"Descartar borrador"** de forma explícita.

En **ningún otro caso** se borra:
- ❌ Error 500 del backend → draft intacto, el operario puede reintentar.
- ❌ Cierre accidental del navegador → draft restaurado al volver.
- ❌ Navegación interna → draft preservado.

---

## 5. Flujo Multi-paso (Wizard)

```
┌──────────────────────────────────────────────────────────────┐
│  PASO 1 — Selección de Pedidos                               │
│                                                              │
│  Pedidos disponibles (estado EN_PROCESO):                    │
│  ☑  PED-001 · Makro · 12 productos · 22/02/2026             │
│  ☑  PED-002 · Anfac · 5 productos  · 21/02/2026             │
│  ☐  PED-003 · Gutenberg · 3 productos (ya recepcionado)     │
│                                           [Continuar →]      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  PASO 2 — Escaneo y Relleno de Lote                          │
│                                                              │
│  📷 [Escanear código de barras]  o  🔍 [Buscar por nombre]   │
│                                                              │
│  Lote actual (3 líneas):                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ � Tomate San Marzano — PED-001                        │  │
│  │  Pedido: 20 kg   Recibido: [18  ] kg   -2 kg ⚠️       │  │
│  │  Obs: [Falta 1 caja]                                   │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 🔴 Aceite Oliva EVOO — PED-001                         │  │
│  │  Pedido: 10 l    Recibido: [0   ] l    No entregado ❌ │  │
│  │  Obs: [No llegó en el camión]                          │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ ✅ Harina de Trigo — PED-002                           │  │
│  │  Pedido: 25 kg   Recibido: [25  ] kg   OK ✅           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  💾 Borrador guardado automáticamente                        │
│  Obs. generales: [Entrega en buen estado general]           │
│                    [◀ Atrás]  [Revisar →]                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  PASO 3 — Revisión Final                                     │
│  ┌──────────────────┬──────────┬──────────┬────────────┐     │
│  │ Producto         │ Pedido   │ Recibido │ Diferencia │     │
│  ├──────────────────┼──────────┼──────────┼────────────┤     │
│  │ Tomate           │ 20 kg    │ 18 kg    │ −2 kg ⚠️   │     │
│  │ Aceite           │ 10 l     │ 0 l      │ −10 l ❌   │     │
│  │ Harina           │ 25 kg    │ 25 kg    │ OK ✅      │     │
│  └──────────────────┴──────────┴──────────┴────────────┘     │
│                                                              │
│  ⚠️  2 incidencias se generarán automáticamente             │
│                                                              │
│             [◀ Editar]   [✅ Confirmar Recepción]            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  PASO 4 — Resultado (respuesta del backend)                  │
│  ✅ Recepción registrada                   ID: rec-001       │
│                                                              │
│  📦 1 movimiento de entrada generado                         │
│  � Pedido PED-001 → INCIDENCIA                              │
│  📋 Pedido PED-002 → RECIBIDO                                │
│                                                              │
│  ┌──── Incidencias generadas (2) ──────────────────────┐    │
│  │ ⚠️  Tomate: recibido 18/20 kg (falta 2 kg)          │    │
│  │     → Estado: PENDIENTE DE RESOLUCIÓN                │    │
│  │ ❌  Aceite EVOO: recibido 0/10 l (no entregado)      │    │
│  │     → Estado: PENDIENTE DE RESOLUCIÓN                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [Ver detalle de recepción]   [Nueva recepción]             │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Indicadores Visuales por Línea

| Indicador | Color | Condición |
|-----------|-------|-----------|
| `✅ OK` | Verde | `cantidadRecibida == cantidadPedida` |
| `⚠️ Parcial` | Amarillo | `0 < cantidadRecibida < cantidadPedida` |
| `🔵 Exceso` | Azul | `cantidadRecibida > cantidadPedida` |
| `❌ No entregado` | Rojo | `cantidadRecibida == 0` |
| `🆕 Nuevo` | Gris punteado | `productoNuevo.pendienteCreacion == true` |

> Los indicadores **no bloquean el envío**. El backend generará incidencia si detecta diferencias.

---

## 7. Validaciones en Cliente (pre-submit)

```typescript
function validarDraft(draft: RecepcionDraft): Record<string, string[]> {
  const errores: Record<string, string[]> = {};

  if (draft.pedidosSeleccionados.length === 0 && draft.productosEspontaneos.length === 0) {
    errores['global'] = ['El lote está vacío. Escanea al menos un producto.'];
  }

  const todasLineas = [
    ...draft.pedidosSeleccionados.flatMap(p => p.lineas),
    ...draft.productosEspontaneos,
  ];

  todasLineas.forEach(linea => {
    const e: string[] = [];
    if (linea.cantidadRecibida === '') {
      e.push('Introduce la cantidad recibida (puede ser 0)');
    } else if (Number(linea.cantidadRecibida) < 0) {
      e.push('La cantidad no puede ser negativa');
    }
    if (linea.productoNuevo && !linea.productoNuevo.nombre.trim()) {
      e.push('El producto nuevo requiere nombre');
    }
    if (e.length > 0) errores[linea.pedidoProductoId ?? linea.nombreProducto] = e;
  });

  return errores;
}
```

> Las validaciones de negocio (pedido cancelado, duplicados, reglas de dominio) las hace el backend. El cliente solo valida formato y presencia.

---

## 8. Envío Atómico y Comunicación de Resultado

### 8.1 Construcción del Payload

```typescript
async function confirmarRecepcion(draft: RecepcionDraft): Promise<void> {
  const errores = validarDraft(draft);
  if (Object.keys(errores).length > 0) {
    setErroresPorLinea(errores);
    setPaso('ESCANEO_LOTE');
    return;
  }

  setEnviando(true);

  const payload: CreateRecepcionDto = {
    observaciones: draft.observaciones || undefined,
    pedidoIds: draft.pedidosSeleccionados.map(p => p.id),
    // Líneas de pedidos
    productos: draft.pedidosSeleccionados
      .flatMap(p => p.lineas)
      .map(linea => ({
        pedidoProductoId: linea.pedidoProductoId!,
        cantidadRecibida: Number(linea.cantidadRecibida),
        observaciones: linea.observaciones || undefined,
      })),
    // Productos nuevos pendientes de creación
    productosNuevos: [
      ...draft.pedidosSeleccionados.flatMap(p => p.lineas),
      ...draft.productosEspontaneos,
    ]
      .filter(l => l.productoNuevo?.pendienteCreacion)
      .map(l => l.productoNuevo!),
  };

  try {
    // UNA SOLA LLAMADA — el backend hace todo en una transacción
    const resultado: RecepcionResultado = await recepcionApi.crear(payload);

    // Limpiar draft SOLO si el backend confirma éxito
    localStorage.removeItem(DRAFT_KEY);

    // Mostrar resultado (incidencias, movimientos, estados de pedidos)
    setResultado(resultado);
    setPaso('RESULTADO');
  } catch (error) {
    manejarErrorApi(error);
    // NO se limpia el draft → el operario puede reintentar
  } finally {
    setEnviando(false);
  }
}
```

### 8.2 Respuesta del Backend (201 Created)

El backend devuelve toda la información necesaria para informar al operario sin necesidad de hacer peticiones adicionales:

```typescript
interface RecepcionResultado {
  id: string;                           // UUID de la Recepcion creada
  fechaRecepcion: string;               // ISO timestamp

  // ── Incidencias generadas automáticamente ─────────
  incidencias: {
    id: string;
    datosOriginales: {
      productos: {
        idPedidoProducto: string;
        nombreProducto: string;
        cantidadPedida: number;
        cantidadRecibida: number;
        diferencia: number;             // negativo = falta, positivo = exceso
        tipo: 'FALTA' | 'EXCESO' | 'NO_ENTREGADO';
      }[];
    };
  }[];

  // ── Cambios de estado en pedidos ──────────────────
  pedidosActualizados: {
    id: string;
    estadoAnterior: string;
    estadoNuevo: string;                // RECIBIDO | INCIDENCIA | EN_PROCESO
  }[];

  // ── Resumen de trazabilidad ────────────────────────
  movimientosGenerados: number;
  inventariosCreados: number;
}
```

### 8.3 Renderizado del Resultado en el Cliente

```
Tras recibir 201:

① Mostrar banner de éxito (verde) con ID de recepción.

② Por cada pedidosActualizados:
   - PED-001 → [INCIDENCIA] (badge rojo)
   - PED-002 → [RECIBIDO]   (badge verde)

③ Por cada incidencia en resultado.incidencias:
   - Tarjeta expandible con:
     · Nombre del producto
     · Cantidad pedida vs. recibida
     · Tipo de diferencia (FALTA / EXCESO / NO_ENTREGADO)
     · Estado: "PENDIENTE DE RESOLUCIÓN"
     · Botón "Ver incidencia" → navega al detalle

④ Limpiar localStorage (draft eliminado)

⑤ Botones:
   - "Ver detalle de recepción" → GET /recepciones/:id
   - "Nueva recepción" → resetear wizard
```

---

## 9. Manejo de Errores del Backend

```typescript
function manejarErrorApi(error: ApiError): void {
  switch (error.statusCode) {
    case 400:
      // Errores de validación de DTO — mostrar por línea
      if (error.erroresPorLinea) {
        setErroresPorLinea(error.erroresPorLinea);
        setPaso('ESCANEO_LOTE');
      } else {
        mostrarAlerta(`Error de validación: ${error.message}`);
      }
      break;

    case 409:
      // Pedido actualizado por otro usuario mientras rellenabas
      mostrarAlerta(
        'Conflicto: este pedido fue actualizado por otra sesión. ' +
        'Tu borrador se ha conservado. Recarga los pedidos y comprueba el estado.'
      );
      // El draft NO se borra — el operario revisa y reenvía
      break;

    case 500:
      // Rollback total — nada se guardó en BD
      mostrarAlerta(
        'Error del servidor. La recepción NO se ha guardado en la base de datos. ' +
        'Tu borrador sigue disponible. Puedes reintentar.'
      );
      // El draft NO se borra — el operario puede reintentar exactamente igual
      break;
  }
}
```

---

## 10. Estrategia para Listas Grandes

| Problema | Solución |
|----------|----------|
| Renderizar 200+ filas | Virtualización con `react-window` |
| Validar en cada tecla | Validar solo en `onBlur` (abandono del campo) |
| Escaneo rápido secuencial | Agregar líneas al lote sin re-renders globales (zustand slice) |
| Aplicar mismo valor a todas | Botón "Aplicar a todas" para cantidad/observación batch |
| Pérdida de trabajo | Auto-save en `localStorage` con debounce 2s + `beforeunload` síncrono |
| Localizar errores | Badge contador en header + scroll automático al primer error |
| Draft caducado (>24h) | Diálogo de recuperación con timestamp del borrador |

---

## 11. Endpoints API Consumidos

| Método | Ruta | Fase | Descripción |
|--------|------|------|-------------|
| `GET` | `/productos?codigoBarras={code}` | Escaneo | Lookup por código de barras |
| `GET` | `/productos?nombre={q}&limit=10` | Escaneo | Búsqueda textual fallback |
| `GET` | `/pedidos?estado=EN_PROCESO` | Paso 1 | Pedidos disponibles para recepcionar |
| `GET` | `/pedidos/:id` | Paso 1 | Líneas del pedido seleccionado |
| `POST` | `/recepciones` | Envío | **Batch atómico** — crea todo en una transacción |
| `GET` | `/recepciones` | Historial | Historial paginado de recepciones |
| `GET` | `/recepciones/:id` | Resultado | Detalle con incidencias, movimientos e inventarios |

> ⚠️ **No existe `POST /productos` en el flujo de escaneo**. Los productos nuevos se incluyen en el payload de `POST /recepciones` y el backend los crea en la misma transacción ACID.
