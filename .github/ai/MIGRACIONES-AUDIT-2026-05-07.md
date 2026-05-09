# 🔍 AUDITORÍA EXHAUSTIVA DEL SISTEMA DE MIGRACIONES

## RESUMEN EJECUTIVO

El proyecto tiene **14 migraciones** que juntas representan el estado esperado del sistema. Las migraciones históricas son esenciales y no pueden eliminarse directamente sin consolidación previa en el baseline.

### Estructura de Migraciones
1. **1775000000000-BaselineSchema.ts** — Estado inicial (incompleto)
2. **1775000002000-AddAccionToMovimiento.ts** — Columna `movimiento.accion` (enum)
3. **1775000003000-AddMissingColumnsToMovimiento.ts** — Columnas `datos_antes`, `datos_despues` (JSONB)
4. **1775050000000-SherlockAuthMigration.ts** — Auth init (seeders)
5. **1775100000000-SeedCatalogoEconomatoProductosReales.ts** — Data seed
6. **1775200000000-SeedDefaultAdminAccounts.ts** — Data seed
7. **1775300000000-AddConsolidacionEstadoToPedidoUsuario.ts** — Columna `consolidacion_estado` (enum)
8. **1775350000000-RemoveAlmacenUnifyUsuarioUbicacion.ts** — Refactor legacy (almacen → ubicacion)
9. **1775400000000-AddEstadoToIncidencia.ts** — Columna `estado` (enum)
10. **1775400001000-AddProveedorIdToIncidencia.ts** — FK `proveedor_id` en incidencia
11. **1775450000000-AddUsuarioUbicacionesM2M.ts** — Tabla puente `usuario_ubicacion`
12. **1775700000000-EnsureUsuarioUbicacionJoinTable.ts** — DUPLICADO de 1775450000000
13. **1775800000000-FixIncidenciaLineaSchema.ts** — Refactor incidencia_linea (rename + columnas)
14. **1775850000000-AddPreferencesToUsuario.ts** — Columna `preferences` (JSONB)

---

## 📊 MAPEO DE CAMBIOS ESTRUCTURALES

### Tabla: `movimiento`
| Cambio | Migración | Estado | Tipo |
|--------|-----------|--------|------|
| `accion` (enum) | 1775000002000 | FALTANTE en baseline | Column |
| `datos_antes` (jsonb) | 1775000003000 | FALTANTE en baseline | Column |
| `datos_despues` (jsonb) | 1775000003000 | FALTANTE en baseline | Column |

### Tabla: `usuario`
| Cambio | Migración | Estado | Tipo |
|--------|-----------|--------|------|
| `almacen_id` | 1775350000000 | Eliminada (refactor) | Removed |
| `ubicacion_id` | 1775350000000 | AÑADIDA (refactor) | Column |
| `preferences` (jsonb) | 1775850000000 | FALTANTE en baseline | Column |

### Tabla: `ubicacion`
| Cambio | Migración | Estado | Tipo |
|--------|-----------|--------|------|
| `almacen_id` | 1775350000000 | Eliminada (refactor) | Removed |

### Tabla: `usuario_ubicacion` (M2M)
| Cambio | Migración | Estado | Tipo |
|--------|-----------|--------|------|
| Table Create | 1775450000000 | FALTANTE en baseline | Table |
| Duplicate | 1775700000000 | REDUNDANTE | Table |

### Tabla: `pedido_usuario`
| Cambio | Migración | Estado | Tipo |
|--------|-----------|--------|------|
| `consolidacion_estado` (enum) | 1775300000000 | FALTANTE en baseline | Column |

### Tabla: `incidencia`
| Cambio | Migración | Estado | Tipo |
|--------|-----------|--------|------|
| `estado` (enum) | 1775400000000 | FALTANTE en baseline | Column |
| `proveedor_id` (FK) | 1775400001000 | FALTANTE en baseline | Column + FK |

### Tabla: `incidencia_linea`
| Cambio | Migración | Estado | Tipo |
|--------|-----------|--------|------|
| `cantidad_esperada` → `cantidad_pedida` | 1775800000000 | Rename | Column |
| `cantidad_ajustada` | 1775800000000 | FALTANTE en baseline | Column |
| `estado` (enum) | 1775800000000 | FALTANTE en baseline | Column |
| `necesita_ajuste` (bool) | 1775800000000 | FALTANTE en baseline | Column |

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. **Baseline Schema Incompleto**
- Muchas columnas definidas en entidades NO se crean en el baseline
- Dependencia frágil de migraciones posteriores
- Riesgo de drift entre instalaciones nuevas vs. antiguas

### 2. **Migraciones Redundantes**
- `1775450000000` y `1775700000000` crean exactamente lo mismo (`usuario_ubicacion`)
- Ambas tienen `IF NOT EXISTS` pero es ineficiente

### 3. **Refactorización Legacy Sin Consolidación**
- `1775350000000` elimina `almacen` pero baseline nunca lo creó
- Lógica de migración asume estado previo que no existe en nuevas BD

### 4. **Nombres de Columnas Inconsistentes**
- `cantidad_esperada` → `cantidad_pedida` rename es confuso
- El dominio esperaría consistencia desde el inicio

### 5. **Ausencia de Validaciones de Schema**
- No existen verificaciones post-migración
- No existen tests de integridad relacional
- No existen validaciones de estado esperado vs. real

---

## 📋 LISTA DE CAMBIOS A CONSOLIDAR EN BASELINE

Para que las migraciones históricas sean eliminables, el nuevo baseline debe incluir:

### Enums a crear
```sql
- accion_movimiento (CREAR, ACTUALIZAR, ELIMINAR, CONFIG_CHANGE, RESOLVEINCIDENCIA, AUDIT, OTRO)
- estado_consolidacion (not_consolidated, consolidated)
- incidencia_estado_enum (ABIERTA, EN_PROCESO, RESUELTA)
- incidencia_linea_estado_enum (SIN_PROBLEMA, PENDIENTE_AJUSTE, AJUSTADO)
```

### Columnas a agregar en BaselineSchema
- `movimiento.accion` (enum, nullable)
- `movimiento.datos_antes` (jsonb, nullable)
- `movimiento.datos_despues` (jsonb, nullable)
- `usuario.ubicacion_id` (uuid, nullable) + FK + Index
- `usuario.preferences` (jsonb, default '{}')
- `pedido_usuario.consolidacion_estado` (enum, default 'not_consolidated')
- `incidencia.estado` (enum, default 'ABIERTA')
- `incidencia.proveedor_id` (uuid, nullable) + FK + Index
- `incidencia_linea.cantidad_ajustada` (numeric, default 0)
- `incidencia_linea.estado` (enum, default 'PENDIENTE_AJUSTE')
- `incidencia_linea.necesita_ajuste` (bool, default true)
- Renombrar `incidencia_linea.cantidad_esperada` → `cantidad_pedida`

### Tablas a crear en BaselineSchema
- `usuario_ubicacion` (M2M con índices)

---

## 🎯 ESTRATEGIA DE CONSOLIDACIÓN

### Fase 1: Crear Nuevo BaselineSchema Consolidado
1. Duplicar `1775000000000-BaselineSchema.ts` → `1775000000001-ConsolidatedBaselineSchema.ts`
2. Integrar TODOS los cambios estructurales de las 14 migraciones
3. Incluir todos los enums, columnas, tablas, FKs, índices
4. Mantener exactamente el mismo estado final que las 14 migraciones juntas

### Fase 2: Crear "Stub" Migrations
1. Convertir migraciones 1775000002000...1775850000000 en migraciones "pass-through"
2. Cada una verifica: "¿ya está aplicado?" → IF NOT EXISTS → retorna sin hacer nada
3. Esto garantiza compatibilidad con BD antiguas que ya ejecutaron las migraciones

### Fase 3: Validar Consistencia
1. Ejecutar en BD vacía con ConsolidatedBaseline + Stubs → debe funcionar
2. Ejecutar en BD con todas las migraciones antiguas → debe funcionar
3. Ejecutar tests exhaustivos en ambos casos

### Fase 4: Eliminar Migraciones Históricas
1. Una vez validado, eliminar archivos de migraciones 1775000002000...1775850000000
2. TypeORM sabe que ya se ejecutaron, no las ejecutará de nuevo
3. El proyecto depende SOLO del ConsolidatedBaseline

---

## 🧪 VALIDACIONES REQUERIDAS

### Test: Nueva BD con ConsolidatedBaseline
```
✓ Todas las tablas existen
✓ Todos los enums existen
✓ Todas las columnas existen con tipos correctos
✓ Todos los indexes existen
✓ Todas las FKs existen
✓ El sistema funciona sin ejecutar migraciones adicionales
```

### Test: BD Antigua con Migraciones Completas
```
✓ Migraciones se ejecutan sin errores
✓ Resultado final == ConsolidatedBaseline
✓ Datos existentes se preservan
✓ Relaciones se mantienen intactas
```

### Test: Schema Drift Detection
```
✓ Entidades TypeORM == Estado real BD
✓ Todos los decoradores Column están sincronizados
✓ Todos los índices están presentes
✓ Todas las FKs tienen constraint names correctos
```

---

## 📝 PROCHAIN ÉTAPES

1. **Crear ConsolidatedBaselineSchema** ← SIGUIENTE PASO
2. **Crear Stub Migrations**
3. **Validar con Tests**
4. **Eliminar Migraciones Históricas**
5. **Ejecutar Validación Final**

---

## 📎 REFERENCIAS

- BaselineSchema: `/src/migrations/1775000000000-BaselineSchema.ts` (~700 líneas)
- Usuario Entity: `/src/modules/usuario/usuario.entity/usuario.entity.ts`
- Movimiento Entity: `/src/modules/movimiento/movimiento.entity/movimiento.entity.ts`
- Incidencia Entity: `/src/modules/incidencia/incidencia.entity/incidencia.entity.ts`
- Incidencia Línea Entity: `/src/modules/incidencia/incidencia-linea.entity/incidencia-linea.entity.ts`
