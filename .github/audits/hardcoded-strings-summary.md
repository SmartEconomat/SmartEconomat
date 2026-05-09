# RESUMEN EJECUTIVO - STRINGS HARDCODEADOS
## SmartEconomat Audit 2026-05-01

---

## 📊 ESTADÍSTICAS GENERALES

| Métrica | Valor |
|---------|-------|
| **Total de problemas identificados** | 19 |
| **Archivos afectados (frontend)** | 12 |
| **Archivos afectados (backend)** | 5 |
| **Severidad CRÍTICA** | 3 |
| **Severidad ALTA** | 5 |
| **Severidad MEDIA** | 11 |

---

## 🔴 PROBLEMAS CRÍTICOS (Implementación inmediata requerida)

### CRÍTICA #1: usuarioService.ts - Comparaciones "Activo"/"INACTIVE"
**Archivos:** `usuarioService.ts`  
**Líneas:** 30, 83-88  
**Problema:** Mapeo inconsistente: "Activo" ↔ "ACTIVE", "Inactivo" ↔ "INACTIVE"  
**Ejemplo:**
```typescript
mapped.status = mapped.estado === 'Activo' ? 'ACTIVE' : 'INACTIVE';  // ❌ Hardcodeado
```
**Impacto:** Si backend cambia valores de enum, frontend rompe  
**Fix requerido:** Enum centralizado + i18n

---

### CRÍTICA #2: UsuariosView.tsx - 5 Comparaciones con "Activo"
**Archivos:** `UsuariosView.tsx`  
**Líneas:** 437, 528, 542, 563, 568  
**Problema:** Múltiples comparaciones directas hardcodeadas  
**Ejemplo:**
```typescript
status={row.estado === 'Activo' ? 'success' : 'default'}  // ❌ String literal
```
**Impacto:** Lógica de UI acoplada a enum values  
**Fix requerido:** Centralizar estado en enum + usar comparador

---

### CRÍTICA #3: UserModal.tsx - Toggle "Activo"/"Inactivo"
**Archivos:** `UserModal.tsx`  
**Líneas:** 282, 307, 356, 511, 513, 523  
**Problema:** Toggle genera strings sin traducción  
**Ejemplo:**
```typescript
const nextEstado = formData.estado === 'Activo' ? 'Inactivo' : 'Activo';  // ❌ NO se traduce
```
**Impacto:** Usuario ve "Activo/Inactivo" incluso si cambia idioma  
**Fix requerido:** Usar enum centralizado + mapear a traducción

---

## 🔴 PROBLEMAS ALTOS (Corrección urgente)

### ALTA #1: Recepcion.tsx - Sincronización sin traducción
```
Líneas: 1321, 1332, 1343, 1354
Strings: "Guardando...", "Sincronizado", "Error de sync", "Conflicto"
```
**Fix:** `label={t('recepcion.sync.status')}`

### ALTA #2: NotificationCenter.tsx - Prioridades sin traducción
```
Línea: 417
Strings: "Urgente", "Pendiente"
```
**Fix:** `getEnumLabel(t, 'notificationPriority', priority)`

### ALTA #3: ProductoFormModal.tsx - Botones sin traducción
```
Línea: 220
Strings: "Guardar Cambios", "Crear Producto"
```
**Fix:** `submitLabel={t('comun.guardarCambios')}`

### ALTA #4: Administracion.tsx - Toggle de estado
```
Línea: 481
String: Toggle entre 'ACTIVE' y 'INACTIVE'
```
**Fix:** Usar enum + mapear a traducción

---

## 🟡 PROBLEMAS MEDIOS (Corrección en próximo sprint)

### MEDIA #1: DetailModal.tsx
```
Línea: 112
String: "Editar"
```

### MEDIA #2: LoginForm.tsx
```
Línea: 333
String: "Confirmar Nueva Contraseña"
```

### MEDIA #3: RegisterForm.tsx
```
Línea: 389
String: "Confirmar Contraseña"
```

### MEDIA #4: StatusChip.tsx - Múltiples cases
```
Líneas: 68-105
Patrón: cases hardcodeados sin traducción
```

### MEDIA #5: Recepcion.tsx - Unidades de peso
```
Línea: 71
String: Comparación con 'kg', 'g', 'mg'
```

### MEDIA #6-10: Backend Seeders/Transformers
```
Archivos: 
- create-product.usecase.ts:31
- SeedCatalogoProductos.ts:625,671
- string-to-date.transformer.ts:31,42
- string-to-boolean.transformer.ts:35
- PlantillasRolesController.ts:110
```

---

## 🔧 PLAN DE REMEDIACIÓN

### Fase 1: Enums Centralizados (1-2 días)
```typescript
// frontend/src/enums/user-status.enum.ts
export enum UserStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// frontend/src/enums/notification-priority.enum.ts
export enum NotificationPriorityEnum {
  URGENT = 'urgent',
  PENDING = 'pending'
}
```

### Fase 2: Traducción de Strings (2-3 días)
Añadir a `i18n/es.json`:
```json
{
  "recepcion": {
    "sync": {
      "saving": "Guardando...",
      "synced": "Sincronizado",
      "error": "Error de sync",
      "conflict": "Conflicto"
    }
  },
  "notification": {
    "priority": {
      "urgent": "Urgente",
      "pending": "Pendiente"
    }
  }
}
```

### Fase 3: Refactorización de Comparaciones (2-3 días)
- Reemplazar `row.estado === 'Activo'` con enums
- Centralizar mapeo de estado en utils
- Usar `getEnumLabel` en todos los chips/badges

### Fase 4: Testing y Validación (1 día)
- Cambiar idioma y verificar que todos los strings se traducen
- Verificar que enum changes en backend no rompen frontend

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Paso 1: Crear Enums Centralizados
- [ ] `frontend/src/enums/user-status.enum.ts`
- [ ] `frontend/src/enums/notification-priority.enum.ts`
- [ ] `frontend/src/enums/sync-status.enum.ts`

### Paso 2: Actualizar i18n
- [ ] Añadir todas las nuevas claves a `i18n/es.json`
- [ ] Añadir todas las nuevas claves a `i18n/en.json`
- [ ] Validar que ninguna clave falta

### Paso 3: Refactorizar Comparaciones (por archivo)
- [ ] `usuarioService.ts` - Usar `UserStatusEnum`
- [ ] `UsuariosView.tsx` - Reemplazar 5 comparaciones
- [ ] `UserModal.tsx` - Reemplazar 6 comparaciones
- [ ] `NotificationCenter.tsx` - Usar `getEnumLabel` + enum
- [ ] `Administracion.tsx` - Usar enum para toggle
- [ ] `Recepcion.tsx` - Traducir labels de sync

### Paso 4: Traducir Labels
- [ ] `ProductoFormModal.tsx` - submitLabel
- [ ] `DetailModal.tsx` - editLabel
- [ ] `LoginForm.tsx` - labels
- [ ] `RegisterForm.tsx` - labels

### Paso 5: Validación
- [ ] Build sin errores
- [ ] Tests pasan
- [ ] Cambio de idioma traduce todo
- [ ] Enum changes en backend no rompen frontend

---

## 📌 REFERENCIAS RÁPIDAS

### Patrón Correcto (Usar como plantilla)
```typescript
// ANTES ❌
status={row.estado === 'Activo' ? 'success' : 'default'}

// DESPUÉS ✅
import { UserStatusEnum } from '@enums/user-status.enum';
status={row.estado === UserStatusEnum.ACTIVE ? 'success' : 'default'}

// O mejor aún, con i18n:
import { getEnumLabel } from '@i18n/enumPresentation';
label={getEnumLabel(t, 'userStatus', row.estado)}
```

### Dónde Están los Helpers
- i18n helper: `frontend/src/i18n/enumPresentation.ts`
- Traducción: `frontend/public/locales/[lang]/translation.json`

### Arch Referencias
- `frontend/src/services/*.ts` - Servicios API (usar enums aquí)
- `frontend/src/pages/*.tsx` - Páginas (usar getEnumLabel)
- `frontend/src/components/ui/*.tsx` - Componentes reutilizables

---

## ⚠️ RIESGOS SI NO SE IMPLEMENTA

1. **Users frustrados** - Algunos textos nunca se traducen al cambiar idioma
2. **Breaking changes** - Si backend cambia enum values, frontend rompe sin aviso
3. **Deuda técnica** - Código duplicado y sin mantenimiento centralizado
4. **Escalabilidad** - Cada nuevo estado/prioridad requiere cambios manuales
5. **Bugs de datos** - Comparaciones hardcodeadas pueden fallar con datos edge-case

---

## 🎯 PRÓXIMOS PASOS

1. **Hoy:** Revisar este audit con el equipo
2. **Mañana:** Crear tickets en JIRA con tareas específicas
3. **Semana próxima:** Implementar Fase 1 + 2
4. **Semana siguiente:** Completar Fase 3 + 4

---

**Audit completo disponible en:** `.github/audits/hardcoded-strings-audit.md`
