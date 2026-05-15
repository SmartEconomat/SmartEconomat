# Auditoría Técnica Global — Frontend SmartEconomat

> **Fecha:** 14 de mayo de 2026  
> **Alcance:** 15 rutas funcionales · 13 features · 8 módulos auditados en paralelo  
> **Stack:** React 19 · Vite 6 · MUI 7 · React Router 7 · Context API · Redux Toolkit  
> **Metodología:** Análisis exhaustivo de código fuente por equipo de Staff Engineers especializados

---

## Índice de informes por módulo

| Módulo | Archivo de auditoría | Hallazgos | Críticos | Altos |
|--------|---------------------|-----------|----------|-------|
| Auth + Dashboard + Routing | [auditoria-auth-dashboard-routing.md](./auditoria-auth-dashboard-routing.md) | 21 | 0 | 4 |
| Productos + Proveedores | [auditoria-productos-proveedores.md](./auditoria-productos-proveedores.md) | 16 | 1 | 5 |
| Pedidos | [auditoria-pedidos.md](./auditoria-pedidos.md) | 21 | 3 | 6 |
| Recepción + Albaranes + Incidencias | [auditoria-recepcion-albaranes-incidencias.md](./auditoria-recepcion-albaranes-incidencias.md) | 31 | 1 | 7 |
| Inventario + Movimientos + Mermas | [auditoria-inventario-movimientos-mermas.md](./auditoria-inventario-movimientos-mermas.md) | 16 | 1 | 6 |
| Recetas + Preparaciones + Distribución | [auditoria-recetas-preparaciones-distribucion.md](./auditoria-recetas-preparaciones-distribucion.md) | 18 | 4 | 7 |
| Admin + Perfil + Usuarios | [auditoria-admin-perfil-usuarios.md](./auditoria-admin-perfil-usuarios.md) | 15 | 2 | 4 |
| Servicios + Hooks + Tipos Globales | [auditoria-servicios-hooks-tipos.md](./auditoria-servicios-hooks-tipos.md) | 23 | 0 | 5 |
| **TOTAL** | | **161** | **12** | **44** |

---

## Resumen Ejecutivo

SmartEconomat es un sistema de gestión de economato con una arquitectura globalmente coherente y decisiones de diseño sólidas: cookie httpOnly para JWT, RBAC granular con 80+ permisos, cliente HTTP centralizado, separación de capas en features/services/pages, y un sistema de draft para flujos complejos. La inversión en arquitectura es visible y valorable.

Sin embargo, la auditoría exhaustiva de los 15 módulos ha revelado **12 hallazgos críticos** que, en conjunto, representan riesgos reales e inmediatos para producción. Varios de estos problemas no son teóricos: son bugs activos que producen comportamientos incorrectos en este momento.

### Nivel de riesgo global: **ALTO**

El sistema **no debe desplegarse en producción** sin resolver al menos los 12 hallazgos críticos. Algunos de ellos son vulnerabilidades de seguridad (contraseñas hardcodeadas en el bundle JS), bugs de datos (pérdida silenciosa de borradores, merma siempre al 0%), fallos de RBAC (escalación de privilegios en pedidos) y problemas de rendimiento severos (carga de 20.000 registros en memoria).

### Principales fortalezas

- Arquitectura de autenticación cookie-first correctamente implementada
- RBAC granular bien estructurado con `permissions.constants.ts` exhaustivo
- Cliente HTTP centralizado en `api.service.ts` con normalización consistente
- Separación clara entre features, pages y services
- Sistema de draft para recepción y pedidos (correctamente planteado aunque con bugs de implementación)
- Uso de AbortController en peticiones críticas de auth
- Code splitting con React.lazy en componentes pesados
- i18n implementado en ambos idiomas (con defectos de interpolación)
- Tipos TypeScript bien estructurados (con excepciones puntuales)

### Principales problemas

- **Seguridad:** contraseña temporal hardcodeada en bundle JS (`Temp1234!`), generación de contraseñas con `Math.random()` en cliente
- **RBAC roto en pedidos:** `canCancel = canEdit` y `canApprove = canEdit` — escalación de privilegios silenciosa
- **Pérdida de datos:** borradores de pedido con optimistic delete sin rollback, merma aplicada siempre 0% en ingredientes
- **Rendimiento:** carga de inventario completo en memoria (hasta 20.000 registros), N+1 en recepciones y carga semanal de pedidos
- **Bugs activos:** estados de incidencias siempre ignorados (bug de casing), datos de muestra hardcoded en RecipeCarousel en producción
- **UX destructiva:** `window.prompt()` que confirma cancelación aunque el usuario pulse "Cancelar"
- **i18n rota:** interpolaciones `{count}` en lugar de `{{count}}` — valores dinámicos nunca visibles en mensajes de error

---

## Métricas Generales

| Dimensión | Calificación | Justificación |
|-----------|-------------|---------------|
| Seguridad | **Deficiente** | Contraseña hardcodeada, `Math.random()`, escalación RBAC en pedidos |
| Gestión de estado | **Aceptable** | Arquitectura correcta; problemas de race conditions y stale closures |
| Rendimiento | **Deficiente** | Carga completa de inventario (20K records), N+1 en recepciones |
| Tipado TypeScript | **Aceptable** | Buena base; `ApiResponse<T>` duplicada y algunos `any` puntuales |
| Manejo de errores | **Deficiente** | Errores silenciosos críticos en draft, logout, mermas |
| Coherencia de dominio | **Aceptable** | Inconsistencias puntuales en enums y contratos (merma, incidencias) |
| Accesibilidad | **Deficiente** | Múltiples componentes sin ARIA, AllergenSelector sin teclado |
| i18n / localización | **Deficiente** | Interpolación rota, strings hardcodeados en varios módulos |
| UX técnica | **Aceptable** | Patrones correctos con excepciones graves (window.prompt destructivo) |
| Resiliencia | **Deficiente** | Pérdida silenciosa de datos en múltiples flujos |
| Escalabilidad | **Deficiente** | Paginación en cliente, carga sin límite de registros |
| Mantenibilidad | **Buena** | Estructura de carpetas coherente, separación de capas correcta |

---

## Hallazgos Críticos Consolidados

Los siguientes 12 hallazgos son **bloqueantes para producción**. Se presentan en orden de riesgo real descendente.

---

### [GLOBAL-C01] Contraseña temporal hardcodeada en el bundle JavaScript del cliente

#### Severidad: Crítica
#### Módulo: Admin + Usuarios
#### Categoría: Seguridad

#### Descripción
`usuarioService.ts` define `const DEFAULT_TEMP_PASSWORD = 'Temp1234!'` como constante visible en el bundle JavaScript que se sirve a cualquier navegador. Cualquier atacante que descargue el bundle JS (sin autenticación) conoce la contraseña de todos los usuarios recién creados.

#### Riesgo real
Compromiso masivo de cuentas de usuario recién creadas. Cualquier actor con acceso al frontend (que no requiere autenticación para el bundle JS) puede intentar autenticarse como cualquier usuario nuevo con esta contraseña conocida.

#### Impacto
- **Seguridad:** Crítico — exposición de credenciales en texto plano en código público
- **Negocio:** Acceso no autorizado al sistema con cualquier cuenta recién creada
- **Cumplimiento:** Violación de principios básicos de seguridad (OWASP A02, A07)

#### Solución
El backend debe generar la contraseña provisional con `crypto.randomBytes()` y devolverla en la respuesta de creación de usuario (una única vez, en texto plano, en la respuesta JSON). El frontend no debe conocer ni gestionar contraseñas temporales.

#### Prioridad: **Inmediata — bloquea producción**

---

### [GLOBAL-C02] Generación de contraseñas con `Math.random()` en el cliente

#### Severidad: Crítica
#### Módulo: Admin + Usuarios
#### Categoría: Seguridad

#### Descripción
La función de generación de contraseñas usa `Math.random()` — no es criptográficamente seguro — y aplica un algoritmo de Fisher-Yates sesgado (`sort(() => 0.5 - Math.random())`). La arquitectura es invertida: el cliente genera la contraseña y la envía al backend, en lugar de que el backend la genere y la devuelva.

#### Riesgo real
Las contraseñas generadas tienen entropía predecible. Un atacante que conozca el momento de creación puede reducir dramáticamente el espacio de búsqueda.

#### Solución
Mover la generación de contraseñas al backend usando `crypto.randomBytes()`. El endpoint de creación de usuario devuelve la contraseña provisional en la respuesta. El frontend la muestra una única vez al administrador.

#### Prioridad: **Inmediata — bloquea producción**

---

### [GLOBAL-C03] Escalación de privilegios RBAC en módulo de Pedidos

#### Severidad: Crítica
#### Módulo: Pedidos
#### Categoría: Seguridad / RBAC

#### Descripción
`buildPedidoPermissions` deriva los permisos de cancelar y aprobar pedidos directamente del permiso de editar:

```typescript
canCancel: canEdit,   // INCORRECTO
canApprove: canEdit,  // INCORRECTO
```

Cualquier usuario con permiso `pedido:editar` puede cancelar y aprobar pedidos, saltándose completamente el flujo de aprobación del sistema.

#### Riesgo real
Un alumno con permiso de editar sus propios pedidos puede aprobar pedidos de compra de alto valor. Un usuario sin autorización puede cancelar pedidos en tránsito.

#### Solución
Mapear permisos específicos: `canCancel: hasPermission('pedido:cancelar')`, `canApprove: hasPermission('pedido:aprobar')`. Verificar que estos permisos existen en el backend RBAC.

#### Prioridad: **Inmediata — bloquea producción**

---

### [GLOBAL-C04] Pérdida silenciosa de borradores de pedido

#### Severidad: Crítica
#### Módulo: Pedidos
#### Categoría: Datos / Resiliencia

#### Descripción
`discardDraft` aplica un borrado optimista sin rollback: si el servidor falla al eliminar el draft, el estado local queda a `null` pero el draft persiste en el servidor. Adicionalmente, `saveDraft` (autosave) silencia todos los errores con `console.error` sin notificar al usuario.

#### Riesgo real
Un usuario puede perder minutos o decenas de líneas de pedido sin ninguna notificación visual. El sistema muestra el draft como eliminado cuando en realidad sigue existiendo en el servidor (inconsistencia de estado).

#### Solución
Implementar rollback en `discardDraft`. Mostrar notificación de error en `saveDraft` cuando el autosave falla.

#### Prioridad: **Inmediata**

---

### [GLOBAL-C05] `mermaAplicada` inaccesible — siempre 0% en todos los ingredientes

#### Severidad: Crítica
#### Módulo: Recetas
#### Categoría: Dominio / Bug

#### Descripción
El campo `mermaAplicada` no existe como columna editable en `RecetaIngredientesSelector`. El formulario envía silenciosamente `mermaAplicada: 0` en todos los ingredientes, ignorando las mermas esperadas configuradas en `ProductoProveedor`.

#### Riesgo real
Todos los costes de receta calculados son incorrectos porque no incluyen merma. El escandallo de producción subestima el consumo real de materias primas, afectando directamente a la rentabilidad del negocio.

#### Impacto
- **Negocio:** Costes de producción incorrectos → pérdidas económicas no visibles
- **Dominio:** Vulnera la regla de negocio central del escandallo

#### Prioridad: **Inmediata**

---

### [GLOBAL-C06] Datos de muestra hardcoded visibles en producción (RecipeCarousel)

#### Severidad: Crítica
#### Módulo: Recetas
#### Categoría: Bug / Dominio

#### Descripción
`RecipeCarousel` contiene un array `SAMPLE_RECIPES` con recetas ficticias (*"Handmade Marble Chicken"*, etc.) que se muestran cuando la carga falla o cuando no hay recetas reales. Estos datos de desarrollo están en producción.

#### Riesgo real
Los usuarios ven recetas inventadas como si fueran recetas reales del sistema. Daña la credibilidad del sistema y confunde al personal de cocina.

#### Prioridad: **Inmediata**

---

### [GLOBAL-C07] `window.prompt()` confirma cancelación destructiva ignorando la respuesta del usuario

#### Severidad: Crítica
#### Módulo: Distribución
#### Categoría: UX / Bug

#### Descripción
El flujo de cancelación de distribuciones usa `window.prompt()` para solicitar confirmación. El código evalúa `if (result !== null)` — pulsar "Cancelar" en el prompt del navegador devuelve `null`, pero la lógica está invertida: la cancelación se ejecuta igualmente.

#### Riesgo real
Cualquier usuario que intente rechazar la cancelación de una distribución la confirma accidentalmente. Acción irreversible ejecutada contra la voluntad explícita del usuario.

#### Prioridad: **Inmediata**

---

### [GLOBAL-C08] Bug de casing: estados de incidencias siempre ignorados

#### Severidad: Crítica
#### Módulo: Incidencias
#### Categoría: Bug / Dominio

#### Descripción
`normalizeEstadoIncidencia` convierte el estado a minúsculas (`toLowerCase()`) pero los `case` del switch usan enums en MAYÚSCULAS (`'NUEVA'`, `'RESUELTA'`, etc.). Ningún `case` coincide nunca. Todos los estados del backend se ignoran y se aplica un fallback heurístico basado en conteo de líneas y regex sobre texto libre.

```typescript
const normalized = estado.toLowerCase();  // 'nueva'
switch (normalized) {
  case 'NUEVA': ...  // nunca coincide
}
```

#### Riesgo real
Los estados de todas las incidencias se derivan de heurísticas frágiles, no del valor real del backend. Una nota con la palabra "cancelado" puede marcar una incidencia como cancelada erróneamente.

#### Prioridad: **Inmediata**

---

### [GLOBAL-C09] Carga completa de inventario en memoria del cliente

#### Severidad: Crítica
#### Módulo: Inventario
#### Categoría: Performance / Escalabilidad

#### Descripción
`fetchInventario` itera todas las páginas disponibles en un bucle `while`, cargando hasta 20.000 registros en memoria del navegador. La paginación visible es puramente client-side sobre este array completo.

#### Riesgo real
Con crecimiento normal del catálogo (1.000+ productos × 10 ubicaciones), la página de inventario se volverá inutilizable (OOM en tab del navegador, timeouts, freezes de UI de varios segundos).

#### Solución
Implementar paginación server-side real. El endpoint ya existe con soporte de paginación; el frontend debe usarlo correctamente.

#### Prioridad: **Inmediata**

---

### [GLOBAL-C10] N×Promise.all sin límite de concurrencia en pedidos semanales

#### Severidad: Crítica
#### Módulo: Pedidos
#### Categoría: Performance / Estabilidad del servidor

#### Descripción
`fetchPurchaseBatches` y la carga del tablero semanal de pedidos disparan todas las páginas simultáneamente con `Promise.all`. Con 200 páginas de lotes, se generan ~200 peticiones HTTP paralelas desde un único usuario, en un único evento de UI.

#### Riesgo real
Con varios usuarios concurrentes, el backend puede saturarse. El rate limiting (1000 req/min write) puede activarse para el usuario legítimo. El propio navegador puede throttlear las conexiones.

#### Prioridad: **Inmediata**

---

### [GLOBAL-C11] `logout()` no limpia el estado del usuario — datos previos persisten

#### Severidad: Alta (impacto de seguridad)
#### Módulo: Auth
#### Categoría: Seguridad / Estado

#### Descripción
`logout()` en `provider.tsx` llama a la API de logout pero no invoca `setUser(null)`. Los datos del usuario anterior (nombre, permisos, rol) permanecen en el contexto hasta que el componente se desmonte. En máquinas compartidas o sesiones rápidas, el siguiente usuario puede ver datos del anterior.

#### Prioridad: **Inmediata**

---

### [GLOBAL-C12] i18n: interpolaciones rotas — valores dinámicos nunca visibles

#### Severidad: Alta
#### Módulo: Servicios / i18n Global
#### Categoría: UX / Bug

#### Descripción
Múltiples claves i18n usan `{count}` (sintaxis de `printf`) en lugar de `{{count}}` (sintaxis de `i18next`). Los mensajes de error con valores dinámicos muestran la plantilla literal en lugar del valor.

Ejemplo: `"vinculada a {count} rol(es)"` se muestra literalmente como `"vinculada a {count} rol(es)"` en lugar de `"vinculada a 3 rol(es)"`.

#### Prioridad: **Alta — afecta UX de todos los mensajes de error con contadores**

---

## Hallazgos Altos Consolidados por Módulo

### Auth + Dashboard + Routing (4 altos)

| ID | Problema |
|----|----------|
| AUTHD-001 | `setTimeout` de 2200ms en login sin cleanup → race condition en desmontaje |
| AUTHD-004 | Logout silencia errores del backend → sesión httpOnly puede quedar activa en servidor |
| AUTHD-008 | Si `refreshUser()` falla post-login → usuario "autenticado" con datos vacíos |
| AUTHD-005 | Dashboard sin AbortController → petición tardía sobreescribe la más reciente |

### Productos + Proveedores (5 altos)

| ID | Problema |
|----|----------|
| PROD-001 | Race condition en doble submit de formulario de producto |
| PROD-003 | `loadProveedores` hasta 40 peticiones HTTP secuenciales |
| PROD-007 | `AllergenSelector` sin accesibilidad ARIA (role, aria-checked, teclado) |
| PROD-014 | Race condition en `Proveedores.loadData` sin cancel de peticiones obsoletas |
| PROD-004 | Formulario de producto: error del servidor no visible si el modal se cierra |

### Pedidos (6 altos)

| ID | Problema |
|----|----------|
| PED-004 | Estado `BORRADOR` invisible en todas las tabs de "Mis Pedidos" |
| PED-005 | Paginación rota en filtro "finalizados" — contadores inconsistentes |
| PED-006 | Botón "Iniciar Recepción" sin verificación de permiso |
| PED-007 | `PedidoDetailDrawer` siempre recibe `canEdit={false}` hardcodeado |
| PED-008 | `buildPedidoColumns()` ejecutado antes de que i18n cargue → claves en crudo |
| PED-009 | Labels del formulario hardcodeados en español, sin i18n |

### Recepción + Albaranes + Incidencias (7 altos)

| ID | Problema |
|----|----------|
| REC-001 | Debounce de autosave mal implementado — nuevos cambios se descartan |
| REC-002 | N+1: hasta 50 llamadas secuenciales en carga de pedidos para recepción |
| ALB-001 | Filtros de albaranes puramente client-side sobre página actual (≤50 items) |
| INC-003 | `proveedorId` mapeado al nombre del proveedor, no al UUID |
| REC-004 | `WeightScaleModal` sin timeout → bloqueante si la báscula se desconecta silenciosamente |
| REC-005 | `PasoEscaneo` sin cleanup de cámara en desmontaje → memory leak |
| INC-004 | `ResolveIncidenciaModal` no valida campos antes de enviar |

### Inventario + Movimientos + Mermas (6 altos)

| ID | Problema |
|----|----------|
| INV-002 | `bajoStock` evaluado por lote individual → falsos positivos de alerta |
| INV-003 | Filtros de ubicación almacenan nombres en lugar de IDs |
| INV-004 | `UbicacionesModal` elimina sin confirmación y sin await |
| INV-005 | Ajustes positivos indistinguibles de entradas por compra en historial |
| MER-001 | `MermaStats` suma cantidades heterogéneas (kg + L + uds) en un único número |
| MER-002 | `TipoMerma` y `MotivoMerma` desincronizados con enum backend modificado |

### Recetas + Preparaciones + Distribución (7 altos)

| ID | Problema |
|----|----------|
| REC-005 | Nombre de PDF de receta contiene coma (`split('T')` sin `[0]`) |
| REC-006 | `getFirstUserUbicacionId` y `getFirstAvailableDestinationId` son funciones idénticas |
| REC-007 | Sin debounce ni paginación en búsqueda de distribuciones (límite duro 50) |
| REC-008 | `loadUserUbicaciones` sin `try/catch` |
| REC-009 | `'Almacén Principal'` hardcodeado como string literal |
| REC-010 | Keys por índice en `RecetaIngredientesSelector` (además del crítico sobre merma) |
| REC-011 | `costoTotal` (preview endpoint) vs `costeTotal` (entidades) — vocabulario inconsistente |

### Admin + Perfil + Usuarios (4 altos)

| ID | Problema |
|----|----------|
| ADM-003 | Contraseña provisional expuesta en toast de 10 segundos |
| ADM-004 | Modal de "solicitar cambio de email" es funcionalidad dummy — no llama a la API |
| ADM-005 | `usePermission(undefined)` devuelve `true` → fail-open silencioso |
| ADM-006 | Verificación de rol con case-sensitivity incorrecta (`'Alumno'` vs `'ALUMNO'`) |

### Servicios + Hooks + Tipos (5 altos)

| ID | Problema |
|----|----------|
| SVC-009 | `DetailModal` y `SummaryModal` sin focus trap → accesibilidad rota para lectores de pantalla |
| SVC-010 | `ApiResponse<T>` duplicada con definiciones contradictorias |
| SVC-003 | Lógica de descarga/PDF duplicada entre `api.service.ts` y `download.service.ts` con implementaciones divergentes |
| SVC-014 | `SerialService.startContinuousRead` puede bloquearse indefinidamente |
| SVC-015 | `baseFetch` sin timeout — peticiones pueden quedar colgadas indefinidamente |

---

## Inconsistencias Globales Frontend/Backend

### Contratos semánticos rotos

| Módulo | Frontend | Backend | Impacto |
|--------|----------|---------|---------|
| Recetas | `costoTotal` | `costeTotal` | Datos no procesados silenciosamente |
| Incidencias | `normalizeEstadoIncidencia` con casing incorrecto | Enums en MAYÚSCULAS | Estados siempre ignorados |
| Mermas | `TipoMerma` con `CADUCIDAD` / `MotivoMerma` sin `CADUCIDAD` | Enum actualizado recientemente | Valores de merma no mapean correctamente |
| Distribución | `estado` tipado como `string` plano | Enum tipado | Sin validación en compilación |
| Inventario | Arrays serializados con coma (`id1,id2`) | Espera múltiples params | Filtros de `ubicacionIds` pueden no funcionar |
| Movimientos | `append` múltiple para arrays | `buildQueryParams` con coma | Inconsistencia en serialización de filtros |
| Pedidos | `canCancel/canApprove` derivados de `canEdit` | Permisos específicos en backend | Bypass de RBAC desde frontend |
| i18n | Interpolaciones `{count}` | N/A | Mensajes dinámicos rotos |
| Proveedor export | Envía `searchTerm` | Espera `id` de proveedor | PDF puede exponer datos de múltiples proveedores |

### Tipado inconsistente

- Dos interfaces `ApiResponse<T>` con definiciones contradictorias (`success: boolean` vs `success?: boolean`)
- `pedidoProductos` tipado como `unknown[]` en lugar de tipo específico
- `DificultadReceta` con valores con acentos — verificar contrato exacto con backend
- `UserStatus` usado como string literal en algunos módulos en lugar del enum

---

## Riesgos Potenciales Futuros

### Escalabilidad

1. **Inventario completo en memoria** (ya crítico): con 5.000+ registros, la página se vuelve inutilizable
2. **`Promise.all` sin límite** en pedidos semanales: con 10 usuarios concurrentes se generan 2.000 peticiones simultáneas
3. **Filtros client-side** en albaranes: con 500+ albaranes, el filtrado resulta inútil
4. **Búsqueda de distribuciones** con límite hardcodeado de 50: invisible para catálogos medianos
5. **DataTable** con índice como key: renders incorrectos al modificar datos en listados dinámicos

### Mantenibilidad

1. **Dos sistemas de permisos** (array en routing vs Redux map en componentes): al agregar permisos, fácil olvidar actualizar ambos
2. **`enumPresentation.ts`** no cubre todos los enums del sistema: al agregar valores al backend, las traducciones fallan silenciosamente
3. **`mergeUbicacionesFiltro`** con lógica compleja sin tests: regresiones invisibles al modificar
4. **Duplicación** de funciones idénticas (`getFirstUserUbicacionId` / `getFirstAvailableDestinationId`)

### Seguridad futura

1. **Email en `localStorage`** sin cifrado ni limpieza en logout: riesgo en dispositivos compartidos
2. **CSRF**: protección parcial dependiente del header `Origin` — revisar en despliegue con proxies
3. **Rate limiting en cliente**: sin exponential backoff en `baseFetch` — posibles cascadas de 429
4. **`usePermission(undefined)` fail-open**: al agregar nuevas rutas sin permiso definido, se muestran a todos

---

## Deuda Técnica Clasificada

### Deuda Crítica (bloquea producción o introduce riesgos inaceptables)

| Área | Problema | Esfuerzo estimado |
|------|----------|-------------------|
| Seguridad | Contraseña `Temp1234!` hardcodeada + `Math.random()` → migrar a backend | 4h |
| RBAC | `canCancel/canApprove = canEdit` en pedidos | 2h |
| Datos | `discardDraft` sin rollback + autosave silencioso | 3h |
| Dominio | `mermaAplicada` inaccesible en formulario de ingredientes | 4h |
| Bug | Bug de casing en `normalizeEstadoIncidencia` | 1h |
| Bug | `window.prompt()` invertido en cancelación de distribución | 1h |
| Bug | `RecipeCarousel` con datos de muestra hardcoded | 1h |
| Rendimiento | Paginación server-side en inventario | 8h |
| Auth | `logout()` sin `setUser(null)` | 1h |
| i18n | Interpolaciones `{count}` → `{{count}}` | 2h |

**Total deuda crítica: ~27h de desarrollo**

### Deuda Importante (impacta calidad y mantenibilidad)

| Área | Problema | Esfuerzo estimado |
|------|----------|-------------------|
| Performance | Límite de concurrencia en `Promise.all` (pedidos, recepciones) | 4h |
| API | Unificar serialización de arrays en `buildQueryParams` | 2h |
| i18n | Cubrir strings hardcodeados en módulos (pedidos, admin, distribución) | 6h |
| Tipado | `ApiResponse<T>` duplicada → unificar | 2h |
| Servicios | Timeout en `baseFetch` | 1h |
| Servicios | Unificar lógica PDF/descarga en un único servicio | 3h |
| Accesibilidad | AllergenSelector, DetailModal, SummaryModal | 6h |
| Estados | `BORRADOR` invisible en tabs de Mis Pedidos | 3h |
| Filtros | Albaranes client-side → server-side | 4h |
| UX | `canEdit={false}` hardcodeado en `PedidoDetailDrawer` | 1h |

**Total deuda importante: ~32h de desarrollo**

### Deuda Tolerable (mejoras de calidad sin impacto inmediato)

- Debounce en filtros directos de Movimientos
- Unificar dos sistemas de permisos (array vs Redux map)
- Extraer strings literales hardcodeados (nombre de almacén, etc.)
- DataTable keys por índice → keys por ID único
- Dead code: `aceptarPedido`, `PedidosTabs`, funciones idénticas
- Tests unitarios para `pedidoPermissions`, `normalizeEstadoIncidencia`, `mergeUbicacionesFiltro`

---

## Recomendaciones Estratégicas

### 1. Sprint de seguridad inmediato (no negociable)

Antes de cualquier despliegue a producción, resolver en este orden:

1. `Temp1234!` hardcodeado + `Math.random()` → endpoint backend para generación de contraseñas provisionales
2. `logout()` → añadir `setUser(null)` y manejar errores del servidor
3. `canCancel/canApprove = canEdit` → mapear a permisos específicos del backend
4. Bug de casing en `normalizeEstadoIncidencia` → `case 'nueva':` (minúsculas) o normalizar los enums
5. `window.prompt()` invertido → usar `ConfirmDialog` del propio sistema

### 2. Paginación server-side en inventario

El `fetchInventario` con carga completa en cliente es técnicamente incorrecto. El endpoint ya soporta paginación. El cambio es acotado pero su impacto en escalabilidad es enorme. Este trabajo debe planificarse en el siguiente sprint.

### 3. Corrección de `mermaAplicada` en RecetaIngredientesSelector

La merma siempre al 0% es un bug de dominio que afecta directamente a la rentabilidad. Agregar la columna editable en el selector de ingredientes con validación `[0, 100]`.

### 4. Auditoría de contratos de enums frontend/backend

Los enums `TipoMerma`, `MotivoMerma`, `EstadoIncidencia` y `DificultadReceta` tienen desincronizaciones. Establecer un proceso (o generación automática de tipos) para mantener los enums frontend sincronizados con el backend. Considerar un script de generación de tipos desde el Swagger del backend.

### 5. Límite de concurrencia en cargas paralelas

Implementar un helper `fetchAllPagesWithLimit(fetchFn, maxConcurrent = 5)` y usarlo en todos los puntos donde se usa `Promise.all` para cargar páginas. Esto previene saturación del servidor con usuarios concurrentes.

### 6. Unificar interpolación i18n y completar cobertura

Auditar todos los archivos i18n con `{count}` y corregir a `{{count}}`. Completar `enumPresentation.ts` para cubrir todos los valores de todos los enums activos.

### 7. AccessibleDialog como estándar para todos los modales

`DetailModal` y `SummaryModal` usan `Dialog` directamente sin focus trap. Migrar a `AccessibleDialog` que ya existe y está bien implementado.

### 8. Eliminar datos hardcoded de desarrollo

- `RecipeCarousel`: eliminar `SAMPLE_RECIPES` o moverlo a un entorno de desarrollo (`import.meta.env.DEV`)
- `'Almacén Principal'` como string literal → usar ID de ubicación desde API
- `DEFAULT_TEMP_PASSWORD` → eliminar completamente

---

## Plan de Acción Priorizado

### Semana 1 — Críticos de seguridad y bugs de dominio

| Tarea | Módulo | Severidad | Effort |
|-------|--------|-----------|--------|
| Eliminar `Temp1234!` + migrar generación de contraseña al backend | Admin | Crítica | 4h |
| Fix `logout()` → `setUser(null)` + manejo de errores | Auth | Alta | 1h |
| Fix `canCancel/canApprove` permisos en pedidos | Pedidos | Crítica | 2h |
| Fix bug casing `normalizeEstadoIncidencia` | Incidencias | Crítica | 1h |
| Fix `window.prompt()` invertido en distribución | Distribución | Crítica | 1h |
| Eliminar `SAMPLE_RECIPES` hardcoded de `RecipeCarousel` | Recetas | Crítica | 1h |
| Fix `mermaAplicada` en `RecetaIngredientesSelector` | Recetas | Crítica | 4h |
| Fix `discardDraft` rollback + notificación de autosave fallido | Pedidos | Crítica | 3h |
| Fix interpolaciones i18n `{count}` → `{{count}}` | Global | Alta | 2h |

### Semana 2 — Performance y estabilidad

| Tarea | Módulo | Severidad | Effort |
|-------|--------|-----------|--------|
| Paginación server-side en Inventario | Inventario | Crítica | 8h |
| Límite de concurrencia en `Promise.all` de pedidos | Pedidos | Crítica | 4h |
| N+1 en carga de pedidos para recepción | Recepción | Alta | 3h |
| Fix debounce de autosave en `useRecepcionDraft` | Recepción | Alta | 2h |
| Timeout en `baseFetch` | Servicios | Alta | 1h |
| Fix `proveedorId` → UUID en mapeo de incidencias | Incidencias | Alta | 1h |

### Semana 3 — Calidad y UX

| Tarea | Módulo | Severidad | Effort |
|-------|--------|-----------|--------|
| Accesibilidad: `AllergenSelector` con ARIA | Productos | Alta | 3h |
| Migrar `DetailModal`/`SummaryModal` a `AccessibleDialog` | UI | Alta | 2h |
| Unificar `ApiResponse<T>` → eliminar duplicación | Global | Alta | 2h |
| Fix `BORRADOR` invisible en tabs de Mis Pedidos | Pedidos | Alta | 3h |
| Filtros de albaranes → server-side | Albaranes | Alta | 4h |
| Fix `canEdit={false}` hardcodeado en `PedidoDetailDrawer` | Pedidos | Alta | 1h |
| Fix `bajoStock` en inventario (por total, no por lote) | Inventario | Alta | 2h |

---

## Conclusión Final

SmartEconomat tiene una base arquitectónica seria y bien pensada. Las decisiones de diseño fundamentales — cookie httpOnly, RBAC granular, cliente HTTP centralizado, sistema de draft, separación de capas — son correctas y constituyen un fundamento sólido.

Sin embargo, la auditoría revela que entre la arquitectura planteada y su implementación concreta existen **12 hallazgos críticos** que en conjunto representan:

- **2 vulnerabilidades de seguridad** que exponen credenciales en el bundle JS
- **1 escalación de privilegios** en el módulo de pedidos que bypasea el RBAC del backend
- **3 bugs activos de dominio** (merma al 0%, estados de incidencias ignorados, datos de muestra en producción)
- **2 problemas graves de resiliencia** (pérdida silenciosa de datos, comportamiento destructivo invertido)
- **2 problemas de rendimiento** que harán el sistema inutilizable al escalar
- **2 bugs de infraestructura global** (logout sin limpieza, i18n con interpolaciones rotas)

El veredicto es claro: **el sistema no debe desplegarse en producción en su estado actual**. La semana 1 del plan de acción es condición bloqueante. El esfuerzo total estimado para los críticos es de ~19h de desarrollo — razonable para el nivel de riesgo que representan.

Una vez resueltos los críticos y la mayoría de los altos (~60-70h totales en 3 semanas), el sistema alcanzaría un nivel de calidad adecuado para producción. La deuda técnica restante sería manejable mediante trabajo continuo de calidad en sprints normales.

---

*Auditoría generada el 14 de mayo de 2026. Para ver el análisis detallado de cada módulo con evidencias de código, consulta los informes individuales referenciados en la tabla del índice.*
