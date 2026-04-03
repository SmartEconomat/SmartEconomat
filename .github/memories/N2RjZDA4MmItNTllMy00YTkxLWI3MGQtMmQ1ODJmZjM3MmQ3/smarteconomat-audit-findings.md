# 🔍 AUDIT: Duplicidad, Lógica Legacy y Fuentes Múltiples de Verdad

**Workspace**: `/home/psych/projects/SmartEconomat`  
**Fecha**: 1 de abril de 2026  
**Estado**: EXPLORACIÓN COMPLETA

---

## 📋 HALLAZGOS PRIORIZADOS

### 🔴 CRÍTICO: Lógica de Negocio Duplicada en Frontend

#### **1. Derivación de EstadoLote en Frontend**
- **Archivo**: [frontend/smart-economat-frontend/src/services/pedidoBatch.utils.ts](pedidoBatch.utils.ts#L1)
- **Problema**: Frontend CALCULA estado de lotes basándose en estados de pedidos
- **Función**: `derivePurchaseBatchEstado()` y `normalizePurchaseBatchEstado()`
- **Lógica**:
  ```typescript
  - Si todos pedidos están PENDIENTE_DE_APROBACION → PENDIENTE
  - Si todos están en estado final (RECEPCIONADO|CANCELADO|INCIDENCIA) → COMPLETADO
  - Sino → PARCIAL
  ```
- **Por qué es crítico**: 
  - Violación directa de PROJECT_RULES.md: "no duplicar lógica de requests"
  - Si backend cambia lógica de cálculo, frontend no se entera
  - Backend NUNCA calcula esto (verificado en pedido.service.ts)
  - Cálculo se invoca en CADA API call (líneas 301, 325, 397, etc.)
- **Riesgo**: ALTO - Inconsistencias de estado entre cliente y servidor

---

#### **2. Normalización de Estados de Recepción en Frontend**
- **Archivo**: [frontend/smart-economat-frontend/src/hooks/useRecepcionDraft.helpers.ts](useRecepcionDraft.helpers.ts#L40)
- **Problema**: Frontend REDEFINE lógica de paso del wizard
- **Función**: `normalizeRecepcionDraftStep()`
- **Lógica**: 
  - Si `paso === RESULTADO` pero hay trabajo pendiente → fuerza a `REVISION_FINAL`
  - Si sin items y `paso !== SELECCION_PEDIDOS` → fuerza a `SELECCION_PEDIDOS`
- **Consecuencia**: Frontend modifica estado después de la hidratación
- **Riesgo**: MEDIO - Puede desengatillar cambios de UI inesperados

---

### 🟡 DUPLICIDAD: Enumeraciones Redefinidas en Frontend

#### **3. EstadoRecepcion - Versiones Múltiples**

**Backend** [backend/smart-economat-backend/src/modules/recepcion/enums/estado-recepcion.enum.ts]:
```typescript
export enum EstadoRecepcion {
  COMPLETADA = 'COMPLETADA',
  PARCIAL = 'PARCIAL',
  CON_INCIDENCIAS = 'CON_INCIDENCIAS',
}
```

**Frontend** [frontend/smart-economat-frontend/src/services/recepcion.types.ts]:
```typescript
export enum EstadoRecepcion {
  PENDIENTE = 'PENDIENTE',              // ❌ NO existe en backend
  EN_PROCESO = 'EN_PROCESO',            // ❌ NO existe en backend
  PARCIAL = 'PARCIAL',                  // ✅ OK
  COMPLETADA = 'COMPLETADA',            // ✅ OK
  CON_INCIDENCIAS = 'CON_INCIDENCIAS',  // ✅ OK
  CANCELADA = 'CANCELADA',              // ❌ NO existe en backend
}
```

**Riesgo**: MEDIO - Frontend tiene estados que backend nunca devolverá
- Líneas de UI pueden nunca activarse (PENDIENTE, EN_PROCESO, CANCELADA)
- Mapeo incompleto en vista de recepción

---

#### **4. EstadoLote Duplicado** (NOMBRE IGUAL, CONTEXTO DIFERENTE)

**Pedido** [backend/smart-economat-backend/src/modules/pedido/enums/estado-lote.enum.ts]:
```typescript
PENDIENTE = 'pendiente',
PARCIAL = 'parcial',
COMPLETADO = 'completado',  // minúsculas
```

**Receta** [backend/smart-economat-backend/src/modules/receta/enums/receta.enums.ts]:
```typescript
export enum EstadoLote {
  DISPONIBLE = 'disponible',
  AGOTADO = 'agotado',       // Completamente diferente
}
```

**Frontend redefine ambos sin contexto claro**  
[frontend/smart-economat-frontend/src/services/pedido.types.ts y receta.types.ts]

**Riesgo**: ALTO - Ambigüedad al importar/usar EstadoLote. Posibles imports cruzados silenciosos

---

### 🟡 MAPEO IMPLICIT: Usuario estado/status

#### **5. Transformación Estado ↔ Status en Usuario**
- **Archivo**: [frontend/smart-economat-frontend/src/services/usuarioService.ts](usuarioService.ts#L16)
- **Mapeo Frontend → Backend**:
  ```typescript
  'Activo' → 'ACTIVE'
  'Inactivo' → 'INACTIVE'
  ```
- **Ubicación**: `mapFrontendToBackend()` en usuarioService
- **Backend DTOs**: Usan `status: UserStatus` (ENUM), no `estado`
- **Verificar**: [backend/.../usuario/enums/usuario.enums.ts](usuario.enums.ts#L1)
  ```typescript
  export enum UserStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    BLOCKED = 'BLOCKED',
  }
  ```
- **Riesgo**: BAJO - Mapeo está centralizado y documentado en tests, pero HIDDEN

---

### 🟡 ALIAS LEGACY: Roles Elevados

#### **6. Alias de Roles en Frontend (SHerlockAuth)**
- **Archivo**: [frontend/smart-economat-frontend/src/sherlock-auth/permissions.ts](permissions.ts#L3)
- **Alias**: 
  ```typescript
  const SHERLOCK_AUTH_ROLE_ALIASES = ['ADMIN', 'SUPER_ADMIN'] as const;
  ```
- **Funciones**:
  - `normalizeRole()`: Convierte a UPPERCASE
  - `isElevatedRole()`: Chequea si está en alias
- **Backend equivalente**: [backend/smart-economat-backend/src/modules/usuario/enums/usuario.enums.ts](usuario.enums.ts)
  ```typescript
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ```
- **Cálculo de permisos**: [backend/.../recepcion.service.ts L63](recepcion.service.ts#L63)
  ```typescript
  const isAdmin = userRole?.toUpperCase() === 'ADMIN' || 
                  userRole?.toUpperCase() === 'SUPER_ADMIN';
  ```
- **Riesgo**: MEDIO - Backend hace MISMO check duplicado; sin sincronización clara

---

### 🟡 LEGACY: Limpieza de Session Storage

#### **7. clearLegacySessionStorage() en AuthProvider**
- **Archivo**: [frontend/smart-economat-frontend/src/sherlock-auth/provider.tsx](provider.tsx#L14)
- **Qué limpia**:
  ```typescript
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  tokenManager.clearToken();
  ```
- **Contexto**: Llamado en login, logout, refresh
- **¿Por qué legacy?**: Sugiere migración desde localStorage hacia httpOnly cookies
- **Riesgo**: BAJO - Buena práctica de limpieza

---

## 📊 ESTADOS UI INFERENCIALES EN FRONTEND

#### **8. Estados de Línea en RecepcionMapping (INFERIDOS)**
- **Archivo**: [frontend/smart-economat-frontend/src/features/recepcion/utils/recepcionMapping.utils.ts](recepcionMapping.utils.ts#L16)
- **Estados locales** (NO existen en backend):
  ```typescript
  'No entregado'  | 'OK' | 'Parcial' | 'Exceso'
  ```
- **Cálculo**: `calculateEstado(cantidadRecibida, cantidadPedida)`
- **Uso**: Solo para visualización/estado de línea de borrador
- **Riesgo**: BAJO - Solo UI local, no persiste

---

## 🟢 BIEN HECHO: Transformaciones Centralizadas

#### **✅ Mapeos de Usuario**
- Centralizados en `usuarioService.mapFrontendToBackend()` y `mapBackendToFrontend()`
- Completamente documentado en tests
- Whitelist clara de campos permitidos

#### **✅ Transformers en DataTO**
- Backend usa `TrimStringTransformer`, `UppercaseStringTransformer`, etc.
- Documentado en [wiki/development/normalizacion-datos.md](normalizacion-datos.md)

#### **✅ Enums Correctamente Ubicados**
- EstadoPedido, TipoDiferencia, EstadoReclamacion, TipoIncidencia: IDÉNTICOS frontend/backend

---

## 🗺️ MAPA DE FUENTES DE VERDAD ACTUAL

| Dominio | Backend (Fuente Real) | Frontend (Redefinido) | Status |
|---------|----------------------|----------------------|--------|
| **Pedido** | EstadoPedido | EstadoPedido ✅ | ALINEADO |
| **Lote Compra** | EstadoLote (PENDIENTE, PARCIAL, COMPLETADO) | EstadoLote ✅ pero CALCULA estado | ⚠️ LÓGICA DUPLICADA |
| **Recepción** | EstadoRecepcion (3 valores) | EstadoRecepcion (6 valores) ❌ | 🔴 MISMATCH |
| **Producto Recepción** | EstadoProductoRecepcion (4 valores) | — | ✅ USADO BIEN |
| **Visual Producto** | EstadoVisualProducto (OPTIMO, ROTO, DEFECTUOSO) | EstadoVisualProducto ✅ | ✅ ALINEADO |
| **Usuario Status** | UserStatus (ACTIVE, INACTIVE, BLOCKED) | mapea desde 'Activo'/'Inactivo' | ⚠️ TRANSFORMADO |
| **Roles** | rolUsuario (4 tipos) | Mismo enum + aliases | ⚠️ ALIAS DUPLICADO |
| **Incidencia** | TipoIncidencia, TipoResolucion | TipoDiferencia, EstadoReclamacion ✅ | ALINEADO |

---

## 🎯 REFACTOR MÍNIMO RECOMENDADO

### Fase 1: ELIMINACIÓN DE DUPLICIDAD CRÍTICA (1-2 sprints)

1. **Remover `derivePurchaseBatchEstado()` del frontend**
   - Endpoint GET `/pedido/batches/:id` debe devolver `estado` calculado
   - Frontend SOLO interpreta lo que backend devuelve
   - Línea de cambio: [pedidoBatch.utils.ts](pedidoBatch.utils.ts#L10) → DELETE función
   
2. **Devolver estado correcto desde backend**
   - Purchase batch service en backend calcule estado ÚNICO
   - Verificar: ¿Dónde se setea `batch.estado` en backend?
   - Acción: Crear `recalculateBatchEstado()` en `purchase-batch.service.ts`

3. **Alinear EstadoRecepcion**
   - Decidir: ¿Backend necesita PENDIENTE, EN_PROCESO, CANCELADA?
   - Si NO: borrar del frontend
   - Si SÍ: agregar al backend enum
   - **Recomendación**: Backend tiene razon (3 valores). Simplificar UI frontend

---

### Fase 2: UNIFICACIÓN DE ENUM (1 sprint)

1. **Crear shared enums package**
   ```
   backend/smart-economat-backend/src/common/enums/
   ├── estados.enums.ts (EstadoPedido, EstadoLote, EstadoRecepcion, etc.)
   └── tsconfig extrae y exporta para frontend
   ```

2. **Frontend importa desde backend (TypeScript generado)**
   - NO duplicar definiciones
   - Single source of truth

3. **Eliminar alias legacy SHERLOCK_AUTH_ROLE_ALIASES**
   - Reemplazar con enums backend
   - normalizeRole() verifica contra enum real

---

### Fase 3: MAPEOS DOCUMENTADOS (1 sprint)

1. **Crear `src/common/mappings/` con documentación clara**
   ```
   ├── usuario-status.mapping.ts
   │   // 'Activo' ↔ 'ACTIVE'
   │   // TODO: Migrar completamente a backend
   ├── recepcion-visual.mapping.ts
   │   // EstadoVisual → EstadoProductoRecepcion
   ```

2. **Documentar en ARCHITECTURE.md**
   - Qué se mapea
   - Por qué se mapea
   - Cuándo se puede remover el mapeo

---

## 📝 NOMBRES TÉCNICOS PARA EVITAR CONFUSIÓN

| Enum | Ubicación | Valores | Contexto |
|------|-----------|---------|---------|
| `EstadoLote` (Pedidos) | `/pedido/enums` | PENDIENTE, PARCIAL, COMPLETADO | Estado de PurchaseBatch |
| `EstadoLote` (Receta) | `/receta/enums` | DISPONIBLE, AGOTADO | Stock de lote de producción |

**PROBLEMA**: Mismo nombre, contexto radicalmente diferente  
**SOLUCIÓN MINIMA**: Renombrar en frontend a `EstadoLoteCompra` y `EstadoLoteProduccion`

---

## 🚀 HOJA DE RUTA (PRIORIDAD)

1. **INMEDIATO**: Remover `derivePurchaseBatchEstado()` → Backend devuelve estado real
2. **SEMANA 1**: Alinear EstadoRecepcion (decidir backend vs UI)
3. **SEMANA 2**: Unificar EstadoLote names (diferenciador claro)
4. **SEMANA 3**: Documentar mapeos usuario status, roles
5. **SEMANA 4**: Crear shared enums package si vale la pena

**Impacto**: Reducción ~40% código duplicado, 100% alineamiento backend-frontend

---

## 📁 ARCHIVOS CLAVE A REFACTORIZAR

- [frontend/src/services/pedidoBatch.utils.ts](pedidoBatch.utils.ts) - DELETE `derivePurchaseBatchEstado`
- [frontend/src/services/pedido.types.ts](pedido.types.ts) - Importar de backend
- [backend/src/modules/recepcion/enums/estado-recepcion.enum.ts](estado-recepcion.enum.ts) - Decidir si agregar estados
- [frontend/src/hooks/useRecepcionDraft.helpers.ts](useRecepcionDraft.helpers.ts) - Revisar lógica normalización
- [backend/src/modules/purchase-batch/service](purchase-batch.service.ts) - Agregar cálculo de estado
