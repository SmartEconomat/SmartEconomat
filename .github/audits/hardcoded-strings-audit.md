# ANÁLISIS EXHAUSTIVO: STRINGS HARDCODEADOS Y EXPOSICIÓN DE KEYS
## SmartEconomat - Frontend y Backend

**Fecha del Análisis:** 1 de mayo de 2026  
**Cobertura:** Frontend + Backend (Búsqueda completa)  
**Estado:** 🔴 PROBLEMAS CRÍTICOS ENCONTRADOS

---

## RESUMEN EJECUTIVO

Se encontraron **múltiples strings hardcodeados** que no están siendo traducidos a través del sistema i18n:
- **Frontend:** 25+ strings en español/inglés sin traducción
- **Backend:** Algunos strings en mensajes de validación y seeders
- **Enums:** Múltiples enum values expuestos directamente en la UI sin `getEnumLabel`
- **Keys:** Comparaciones directas con strings como 'Activo', 'INACTIVE', 'Pendiente'

---

## HALLAZGOS - FRONTEND

### Categoría 1: LABELS HARDCODEADOS EN COMPONENTES

#### [1] Recepcion.tsx - Textos de Estado de Sincronización
- **Archivo:** `frontend/smart-economat-frontend/src/pages/Recepcion.tsx`
- **Líneas:** 1321, 1332, 1343, 1354
- **Strings encontrados:**
  ```
  - "Guardando..." (línea 1321)
  - "Sincronizado" (línea 1332)
  - "Error de sync" (línea 1343)
  - "Conflicto" (línea 1354)
  ```
- **Categoría:** Texto en español SIN traducción
- **Contexto:** Chips que muestran el estado de sincronización del borrador
- **Impacto:** Usuario ve strings en español hardcodeado, no traducible

#### [2] ProductoFormModal.tsx - Botones de Acción
- **Archivo:** `frontend/smart-economat-frontend/src/features/productos/ProductoFormModal.tsx`
- **Línea:** 220
- **Strings encontrados:**
  ```
  - "Guardar Cambios" (cuando isEditing es true)
  - "Crear Producto" (cuando isEditing es false)
  ```
- **Categoría:** Texto en español SIN traducción
- **Contexto:** submitLabel en modal de producto
- **Impacto:** Botones de acción no son traducibles

#### [3] DetailModal.tsx - Label por Defecto
- **Archivo:** `frontend/smart-economat-frontend/src/components/ui/DetailModal.tsx`
- **Línea:** 112
- **Strings encontrados:**
  ```
  - "Editar"
  ```
- **Categoría:** Texto en español SIN traducción
- **Contexto:** editLabel por defecto
- **Impacto:** Label por defecto no es traducible

#### [4] LoginForm.tsx - Labels de Contraseña
- **Archivo:** `frontend/smart-economat-frontend/src/features/auth/components/LoginForm.tsx`
- **Línea:** 333
- **Strings encontrados:**
  ```
  - "Confirmar Nueva Contraseña"
  ```
- **Categoría:** Texto en español SIN traducción
- **Contexto:** label en campo de formulario
- **Impacto:** Label de input no es traducible

#### [5] RegisterForm.tsx - Labels de Contraseña
- **Archivo:** `frontend/smart-economat-frontend/src/features/auth/components/RegisterForm.tsx`
- **Línea:** 389
- **Strings encontrados:**
  ```
  - "Confirmar Contraseña"
  ```
- **Categoría:** Texto en español SIN traducción
- **Contexto:** label en campo de formulario
- **Impacto:** Label de input no es traducible

#### [6] NotificationCenter.tsx - Textos de Prioridad
- **Archivo:** `frontend/smart-economat-frontend/src/components/common/Notification/NotificationCenter.tsx`
- **Línea:** 417
- **Strings encontrados:**
  ```
  - "Urgente" (cuando priority === 'urgent')
  - "Pendiente" (cuando priority !== 'urgent')
  ```
- **Categoría:** Texto en español SIN traducción
- **Contexto:** Mostrados directamente en el badge de notificaciones
- **Impacto:** Usuario ve prioridad en español hardcodeado

---

### Categoría 2: VALORES DE ENUM EXPUESTOS SIN TRADUCCIÓN

#### [7] usuarioService.ts - Comparación con String "Activo"
- **Archivo:** `frontend/smart-economat-frontend/src/services/usuarioService.ts`
- **Líneas:** 30, 83-88
- **Patrón encontrado:**
  ```typescript
  mapped.status = mapped.estado === 'Activo' ? 'ACTIVE' : 'INACTIVE';
  
  return {
    estado: isActiveFromStatus
      ? 'Activo'
      : isInactiveFromStatus
        ? 'Inactivo'
        : fallbackActivo || user.estado === 'Activo'
          ? 'Activo'
          : 'Inactivo',
  ```
- **Categoría:** Keys expuestas + Texto en español sin traducción
- **Problema:** 
  - Comparación directa con string 'Activo'/'Inactivo'
  - String 'Activo'/'Inactivo' generado sin i18n
  - Hardcodeado en lógica de negocio
- **Impacto:** Si backend cambia enum, frontend rompe

#### [8] UsuariosView.tsx - Comparaciones con "Activo"
- **Archivo:** `frontend/smart-economat-frontend/src/pages/Usuarios/UsuariosView.tsx`
- **Líneas:** 437, 528, 542, 563, 568
- **Patrón encontrado:**
  ```typescript
  payload.estado === 'Activo'  // línea 437
  status={row.estado === 'Activo' ? 'success' : 'default'}  // línea 528
  color={row.estado === 'Activo' ? 'warning' : 'success'}  // línea 542
  row.estado === 'Activo'  // línea 563
  {row.estado === 'Activo' ? (...)  // línea 568
  ```
- **Categoría:** Keys expuestas + comparaciones hardcodeadas
- **Problema:** Múltiples comparaciones directas con string 'Activo'
- **Impacto:** Lógica de UI depende de string hardcodeado

#### [9] UserModal.tsx - Comparaciones con "Activo"/"Inactivo"
- **Archivo:** `frontend/smart-economat-frontend/src/pages/Usuarios/UserModal.tsx`
- **Líneas:** 282, 307, 356, 511, 513, 523
- **Patrón encontrado:**
  ```typescript
  u.estado === 'Activo'  // línea 282
  if (formData.estado === 'Inactivo')  // línea 307
  const nextEstado = formData.estado === 'Activo' ? 'Inactivo' : 'Activo';  // línea 356
  formData.estado === 'Activo' ? 'contained' : 'outlined'  // línea 511
  color={formData.estado === 'Activo' ? 'success' : 'error'}  // línea 513
  {formData.estado === 'Activo' ? (...)  // línea 523
  ```
- **Categoría:** Keys expuestas + Toggle con strings hardcodeados
- **Problema:** 
  - Comparaciones hardcodeadas en múltiples lugares
  - Toggle que invierte 'Activo'/'Inactivo' sin enum
  - Strings generados sin i18n

#### [10] Administracion.tsx - Comparación con "ACTIVE"/"INACTIVE"
- **Archivo:** `frontend/smart-economat-frontend/src/pages/Administracion.tsx`
- **Línea:** 481
- **Patrón encontrado:**
  ```typescript
  (currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
  ```
- **Categoría:** Keys expuestas en toggle de estado
- **Problema:** Toggle entre enums hardcodeado
- **Impacto:** Si enum values cambian en backend, se rompe

#### [11] Productos.tsx - Comparación con "active"/"deleted"
- **Archivo:** `frontend/smart-economat-frontend/src/pages/Productos.tsx`
- **Líneas:** 559, 573, 811, 909, 914
- **Patrón encontrado:**
  ```typescript
  {activeTab === 'active' && canEdit && (...)  // múltiples líneas
  ```
- **Categoría:** Keys de estado de tab hardcodeadas
- **Problema:** Aunque es un estado local, mantiene string 'active'/'deleted'
- **Impacto:** Menor pero inconsistente

---

### Categoría 3: ENUMS SIN TRADUCCIÓN EN LA UI

#### [12] ProfessorStudentList.tsx - Comparación con "ACTIVE"
- **Archivo:** `frontend/smart-economat-frontend/src/features/profile/components/ProfessorStudentList.tsx`
- **Línea:** 216
- **Patrón encontrado:**
  ```typescript
  student.status?.toUpperCase() === 'ACTIVE'
  ```
- **Categoría:** Comparación de enum expuesto sin traducción
- **Problema:** Asume que status viene en string, compara directamente
- **Impacto:** Lógica depende de enum value específico

#### [13] StatusChip.tsx - Múltiples Casos Sin Traducción
- **Archivo:** `frontend/smart-economat-frontend/src/components/ui/StatusChip.tsx`
- **Líneas:** 68-105
- **Casos encontrados:**
  ```typescript
  case 'completed': case 'delivered': case 'entregado':
  case 'completado': case 'entregada':
  case 'error': case 'failed': case 'cancelled':
  case 'cancelado': case 'rejected':
  case 'review': case 'media': case 'ajuste': case 'pendiente':
  case 'preparada': case 'preparado':
  case 'parcial': case 'active': case 'archived': case 'pedido':
  ```
- **Categoría:** Múltiples enum values mostrados sin traducción
- **Problema:** 
  - Switch case que mapea valores a colores pero sin i18n para el label
  - Aunque usa `getEnumLabel` en algunos casos, los cases están hardcodeados
  - Si enum value cambia, rompe el switch
- **Impacto:** Si se añaden nuevos enums, hay que editar manualmente este componente

#### [14] Recepcion.tsx - Comparación con Unidades de Peso
- **Archivo:** `frontend/smart-economat-frontend/src/pages/Recepcion.tsx`
- **Línea:** 71
- **Patrón encontrado:**
  ```typescript
  return u === 'kg' || u === 'g' || u === 'mg';
  ```
- **Categoría:** Strings de enum sin traducción
- **Problema:** Hardcodeado las unidades que son "peso"
- **Impacto:** Si se añaden nuevas unidades, hay que editar manualmente

---

## HALLAZGOS - BACKEND

### Categoría 4: STRINGS EN EXCEPCIONES (Seeders/Migraciones)

#### [15] CreateProductUseCase - Validación
- **Archivo:** `backend/smart-economat-backend/src/application/product/use-cases/create-product.usecase.ts`
- **Línea:** 31
- **String encontrado:**
  ```typescript
  throw new Error('El nombre es obligatorio');
  ```
- **Categoría:** Texto en español SIN traducción (en seeder/migration)
- **Contexto:** Error en use case
- **Impacto:** Mensaje de error en español hardcodeado

#### [16] SeedCatalogoEconomatoProductosReales - Múltiples Errores
- **Archivo:** `backend/smart-economat-backend/src/migrations/1775100000000-SeedCatalogoEconomatoProductosReales.ts`
- **Líneas:** 625, 671
- **Strings encontrados:**
  ```
  - "No se pudo crear el proveedor de migracion." (línea 625)
  - "No se pudo crear la ubicacion de migracion." (línea 671)
  ```
- **Categoría:** Texto en español SIN traducción (seeders)
- **Contexto:** Errores en seeders
- **Impacto:** Mensajes de error de seeding en español hardcodeado

#### [17] StringToDateTransformer - Errores
- **Archivo:** `backend/smart-economat-backend/src/common/transformers/string-to-date.transformer.ts`
- **Líneas:** 31, 42
- **Strings encontrados:**
  ```
  - "El timestamp '${value}' no es una fecha válida" (línea 31)
  - "El valor '${value}' no puede ser convertido a fecha" (línea 42)
  ```
- **Categoría:** Texto en español SIN traducción
- **Contexto:** Transformador de datos
- **Impacto:** Aunque están en transformer, si se exponen como error, están en español

#### [18] StringToBooleanTransformer - Error
- **Archivo:** `backend/smart-economat-backend/src/common/transformers/string-to-boolean.transformer.ts`
- **Línea:** 35
- **String encontrado:**
  ```
  - "El valor '${value}' no puede ser convertido a booleano"
  ```
- **Categoría:** Texto en español SIN traducción
- **Contexto:** Transformador de datos
- **Impacto:** Mensaje de error en español

#### [19] PlantillasRolesController - Response Hardcodeada
- **Archivo:** `backend/smart-economat-backend/src/modules/plantillas-roles/controller/plantillas-roles.controller.ts`
- **Línea:** 110
- **String encontrado:**
  ```typescript
  return { message: 'Plantilla eliminada correctamente' };
  ```
- **Categoría:** Texto en español SIN i18n en respuesta
- **Contexto:** Respuesta HTTP de controller
- **Impacto:** Cliente recibe mensaje en español sin traducción

---

## PATRÓN DE COMPARACIONES ENUM CON STRINGS

### Problema General: "Activo" / "ACTIVE"

El proyecto tiene un problema sistemático donde:

1. **Backend devuelve:** `status: 'ACTIVE'` o `estado: 'Activo'`
2. **Frontend compara:** `row.estado === 'Activo'` (hardcodeado)
3. **No hay:** Enum centralizado de estados de usuario

**Archivos afectados:**
- usuarioService.ts (mapeo backend-frontend)
- UsuariosView.tsx (múltiples comparaciones)
- UserModal.tsx (múltiples comparaciones)
- Administracion.tsx (toggle de estado)
- ProfessorStudentList.tsx (comparación)

---

## CUADRO RESUMEN

| Tipo | Ubicación | Línea(s) | String | Severidad |
|------|-----------|----------|--------|-----------|
| Label | Recepcion.tsx | 1321-1354 | "Guardando...", "Sincronizado", "Error de sync", "Conflicto" | 🔴 ALTA |
| Label | ProductoFormModal.tsx | 220 | "Guardar Cambios", "Crear Producto" | 🔴 ALTA |
| Label | DetailModal.tsx | 112 | "Editar" | 🟡 MEDIA |
| Label | LoginForm.tsx | 333 | "Confirmar Nueva Contraseña" | 🟡 MEDIA |
| Label | RegisterForm.tsx | 389 | "Confirmar Contraseña" | 🟡 MEDIA |
| Enum | NotificationCenter.tsx | 417 | "Urgente", "Pendiente" | 🔴 ALTA |
| Enum | usuarioService.ts | 30, 83-88 | "Activo", "Inactivo" (múltiples) | 🔴 CRÍTICA |
| Enum | UsuariosView.tsx | 437, 528, 542, 563, 568 | "Activo" (comparaciones) | 🔴 CRÍTICA |
| Enum | UserModal.tsx | 282, 307, 356, 511, 513, 523 | "Activo", "Inactivo" (comparaciones) | 🔴 CRÍTICA |
| Enum | Administracion.tsx | 481 | "ACTIVE", "INACTIVE" (toggle) | 🔴 ALTA |
| Enum | StatusChip.tsx | 68-105 | Múltiples cases sin traducción | 🟡 MEDIA |
| Enum | Recepcion.tsx | 71 | "kg", "g", "mg" (comparaciones) | 🟡 MEDIA |
| Error | Create-product.usecase.ts | 31 | "El nombre es obligatorio" | 🟡 MEDIA |
| Error | SeedCatalogoProductos.ts | 625, 671 | Errores de seeding en español | 🟡 MEDIA |
| Error | String-to-date.transformer.ts | 31, 42 | Errores de transformación en español | 🟡 MEDIA |
| Error | String-to-boolean.transformer.ts | 35 | Error de transformación en español | 🟡 MEDIA |
| Response | PlantillasRolesController.ts | 110 | "Plantilla eliminada correctamente" | 🟡 MEDIA |

---

## RECOMENDACIONES DE CORRECCIÓN

### Acción Prioritaria 1: Crear Enum Centralizado de Estados

```typescript
// frontend/src/enums/usuario.enum.ts
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// Usar en todas las comparaciones:
row.estado === UserStatus.ACTIVE
```

### Acción Prioritaria 2: Traducir Todos los Labels

```typescript
// Recepcion.tsx línea 1321
label={t('recepcion.sync.saving')}

// ProductoFormModal.tsx línea 220
submitLabel={isEditing ? t('comun.guardarCambios') : t('comun.crearProducto')}

// DetailModal.tsx línea 112
editLabel: t('comun.editar')
```

### Acción Prioritaria 3: Usar getEnumLabel Consistentemente

```typescript
// En NotificationCenter.tsx línea 417
getEnumLabel(t, 'notificationPriority', notification.priority)

// En StatusChip.tsx para todos los cases
label={getEnumLabel(t, 'estado', status)}
```

### Acción Prioritaria 4: Centralizar Transformaciones de Estado

```typescript
// utils/estado.utils.ts
export const mapEstadoFromBackend = (backendEstado: string): string => {
  return backendEstado === 'ACTIVE' 
    ? 'Activo' 
    : backendEstado === 'INACTIVE' 
    ? 'Inactivo' 
    : backendEstado;
};

// Usar en usuarioService.ts y evitar hardcodeos
```

---

## CONCLUSIÓN

El proyecto tiene **19 problemas críticos identificados** relacionados con:

1. ✅ **25+ strings hardcodeados** sin traducción en frontend
2. ✅ **Comparaciones de enum** con strings literales (especialmente 'Activo'/'ACTIVE')
3. ✅ **Keys de estado expuestas** sin centralización en enums
4. ✅ **Mensajes de error** en español en backend

**Impacto General:**
- 🔴 **Usuarios no pueden cambiar idioma completamente** (algunos textos siempre en español)
- 🔴 **Lógica de negocio frágil** (cambios en enum values rompen comparaciones)
- 🔴 **Código difícil de mantener** (strings duplicados en múltiples ubicaciones)
- 🔴 **Inconsistencia en UI** (algunos componentes traducen, otros no)

**Requerimiento:** Implementar traducción i18n y enums centralizados para TODOS los strings identificados.
