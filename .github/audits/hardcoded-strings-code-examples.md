# EJEMPLOS ESPECÍFICOS DE CÓDIGO
## Strings Hardcodeados - SmartEconomat

---

## 📍 HALLAZGO #1: Recepcion.tsx - Labels de Sincronización

**Archivo:** `frontend/smart-economat-frontend/src/pages/Recepcion.tsx`  
**Líneas:** 1318-1356

### ❌ Código Actual (Problema)
```typescript
{syncStatus === 'saving' && (
  <Tooltip title="Sincronizando borrador con el servidor">
    <Chip
      icon={<SaveIcon />}
      label="Guardando..."  // ← STRING HARDCODEADO EN ESPAÑOL
      size="small"
      color="warning"
      variant="outlined"
    />
  </Tooltip>
)}
{syncStatus === 'synced' && (
  <Tooltip title="Borrador sincronizado de forma segura">
    <Chip
      icon={<CheckCircleIcon />}
      label="Sincronizado"  // ← STRING HARDCODEADO EN ESPAÑOL
      size="small"
      color="success"
      variant="outlined"
    />
  </Tooltip>
)}
{syncStatus === 'error' && (
  <Tooltip title={syncError || 'Error al sincronizar el borrador'}>
    <Chip
      icon={<ErrorOutlineIcon />}
      label="Error de sync"  // ← STRING HARDCODEADO EN ESPAÑOL
      size="small"
      color="error"
      variant="outlined"
    />
  </Tooltip>
)}
{syncStatus === 'conflict' && (
  <Tooltip title="El borrador cambió en otro dispositivo">
    <Chip
      icon={<WarningAmberIcon />}
      label="Conflicto"  // ← STRING HARDCODEADO EN ESPAÑOL
      size="small"
      color="warning"
      variant="outlined"
    />
  </Tooltip>
)}
```

### ✅ Código Corregido (Solución)
```typescript
const { t } = useTranslation();

const syncStatusLabels: Record<string, string> = {
  'saving': t('recepcion.sync.saving'),      // "Guardando..."
  'synced': t('recepcion.sync.synced'),      // "Sincronizado"
  'error': t('recepcion.sync.error'),        // "Error de sync"
  'conflict': t('recepcion.sync.conflict'),  // "Conflicto"
};

const syncStatusTooltips: Record<string, string> = {
  'saving': t('recepcion.sync.savingTooltip'),
  'synced': t('recepcion.sync.syncedTooltip'),
  'error': syncError || t('recepcion.sync.errorTooltip'),
  'conflict': t('recepcion.sync.conflictTooltip'),
};

// Luego en el render:
{syncStatus && (
  <Tooltip title={syncStatusTooltips[syncStatus]}>
    <Chip
      label={syncStatusLabels[syncStatus]}
      size="small"
      // ... colores y iconos según status
    />
  </Tooltip>
)}
```

### 📝 Keys a Añadir a i18n
```json
// i18n/es.json
{
  "recepcion": {
    "sync": {
      "saving": "Guardando...",
      "synced": "Sincronizado",
      "error": "Error de sync",
      "conflict": "Conflicto",
      "savingTooltip": "Sincronizando borrador con el servidor",
      "syncedTooltip": "Borrador sincronizado de forma segura",
      "errorTooltip": "Error al sincronizar el borrador",
      "conflictTooltip": "El borrador cambió en otro dispositivo"
    }
  }
}

// i18n/en.json
{
  "recepcion": {
    "sync": {
      "saving": "Saving...",
      "synced": "Synced",
      "error": "Sync error",
      "conflict": "Conflict",
      "savingTooltip": "Syncing draft with server",
      "syncedTooltip": "Draft safely synced",
      "errorTooltip": "Error syncing draft",
      "conflictTooltip": "Draft changed on another device"
    }
  }
}
```

---

## 📍 HALLAZGO #2: usuarioService.ts - Comparaciones de Estado

**Archivo:** `frontend/smart-economat-frontend/src/services/usuarioService.ts`  
**Líneas:** 30, 83-88

### ❌ Código Actual (Problema)
```typescript
export const mapFrontendToBackend = (user: Usuario, isUpdate = false) => {
  const mapped = { ...user };

  // Map Rol
  if (mapped.rol) {
    mapped.rol = (mapped.rol as string).toUpperCase();
  }

  // Map Status - PROBLEMA AQUÍ
  if (mapped.estado) {
    // Compara directo con string "Activo" sin traducción
    mapped.status = mapped.estado === 'Activo' ? 'ACTIVE' : 'INACTIVE';
    delete mapped.estado;
  }

  return mapped;
};

export const mapBackendToFrontend = (user: Record<string, unknown>): Usuario => {
  // ...
  const backendStatus = (user.status as string | undefined)?.toUpperCase();
  const isActiveFromStatus = backendStatus === 'ACTIVE';
  const isInactiveFromStatus = backendStatus === 'INACTIVE';
  const fallbackActivo = Boolean(user.activo);

  return {
    // ...
    // PROBLEMA AQUÍ: Genera strings "Activo"/"Inactivo" sin i18n
    estado: isActiveFromStatus
      ? 'Activo'           // ← STRING HARDCODEADO
      : isInactiveFromStatus
        ? 'Inactivo'       // ← STRING HARDCODEADO
        : fallbackActivo || user.estado === 'Activo'  // ← COMPARACIÓN HARDCODEADA
          ? 'Activo'       // ← STRING HARDCODEADO
          : 'Inactivo',    // ← STRING HARDCODEADO
    // ...
  };
};
```

### ✅ Código Corregido (Solución)

**Paso 1: Crear Enum Centralizado**
```typescript
// frontend/src/enums/user-status.enum.ts
export enum UserStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const userStatusValues = Object.values(UserStatusEnum);
```

**Paso 2: Crear Utilidades de Mapeo**
```typescript
// frontend/src/utils/usuario-status.utils.ts
import { UserStatusEnum } from '@enums/user-status.enum';
import i18n from '@i18n/i18n-config';

export const mapUserStatusBackendToFrontendEnum = (
  backendStatus: string | undefined
): UserStatusEnum | undefined => {
  if (!backendStatus) return undefined;
  
  const normalized = backendStatus.toUpperCase();
  return Object.values(UserStatusEnum).includes(normalized as UserStatusEnum)
    ? (normalized as UserStatusEnum)
    : undefined;
};

export const getUserStatusLabel = (status: UserStatusEnum | string): string => {
  const t = i18n.t.bind(i18n);
  
  if (status === UserStatusEnum.ACTIVE) {
    return t('usuario.status.activo');
  }
  if (status === UserStatusEnum.INACTIVE) {
    return t('usuario.status.inactivo');
  }
  return status; // fallback si no es enum
};
```

**Paso 3: Refactorizar Services**
```typescript
// frontend/src/services/usuarioService.ts
import { UserStatusEnum } from '@enums/user-status.enum';
import { mapUserStatusBackendToFrontendEnum } from '@utils/usuario-status.utils';

export const mapFrontendToBackend = (user: Usuario, isUpdate = false) => {
  const mapped = { ...user };

  if (mapped.rol) {
    mapped.rol = (mapped.rol as string).toUpperCase();
  }

  // Map Status usando enum
  if (mapped.estado) {
    // El estado ahora debe ser valor del enum
    const statusEnum = Object.values(UserStatusEnum).find(
      (val) => val === mapped.estado
    ) as UserStatusEnum | undefined;
    
    if (statusEnum) {
      mapped.status = statusEnum;
      delete mapped.estado;
    }
  }

  return mapped;
};

export const mapBackendToFrontend = (user: Record<string, unknown>): Usuario => {
  const backendStatus = mapUserStatusBackendToFrontendEnum(
    user.status as string | undefined
  );
  
  // El estado ahora es siempre un enum válido o undefined
  const estado = backendStatus || UserStatusEnum.INACTIVE;

  return {
    id: (user.id as string | number) || 0,
    username: user.username as string,
    nombre: user.nombre as string | undefined,
    email: user.email as string,
    rol: backendRol || 'Alumno',
    roleId: primaryRole?.id as string | undefined,
    roleName: primaryRole?.nombre as string | undefined,
    estado: estado,  // ← Ahora es enum
    fecha_registro: (user.createdAt as string) || new Date().toISOString(),
    // ...
  };
};
```

### 📝 Keys a Añadir a i18n
```json
// i18n/es.json
{
  "usuario": {
    "status": {
      "activo": "Activo",
      "inactivo": "Inactivo"
    }
  }
}

// i18n/en.json
{
  "usuario": {
    "status": {
      "activo": "Active",
      "inactivo": "Inactive"
    }
  }
}
```

---

## 📍 HALLAZGO #3: UsuariosView.tsx - Comparaciones Múltiples

**Archivo:** `frontend/smart-economat-frontend/src/pages/Usuarios/UsuariosView.tsx`  
**Líneas:** 437, 528, 542, 563, 568

### ❌ Código Actual (Problema)
```typescript
// Línea 437
const onToggleStatus = (user: Usuario) => {
  const newStatus = payload.estado === 'Activo'  // ← HARDCODEADO
    ? 'Inactivo'  // ← HARDCODEADO
    : 'Activo';   // ← HARDCODEADO
  // ...
};

// Línea 528
<TableCell>
  <Chip
    // Comparación directa con string
    status={row.estado === 'Activo' ? 'success' : 'default'}  // ← PROBLEMA
    label={row.estado}
  />
</TableCell>

// Línea 542
<IconButton
  // Comparación directa con string
  color={row.estado === 'Activo' ? 'warning' : 'success'}  // ← PROBLEMA
>
  {/* Toggle Estado */}
</IconButton>

// Línea 563, 568: Más comparaciones similares
if (row.estado === 'Activo') {  // ← HARDCODEADO
  // ...
}
```

### ✅ Código Corregido (Solución)
```typescript
import { UserStatusEnum } from '@enums/user-status.enum';
import { mapUserStatusBackendToFrontendEnum } from '@utils/usuario-status.utils';

// Línea 437 - Toggle
const onToggleStatus = (user: Usuario) => {
  const currentStatus = mapUserStatusBackendToFrontendEnum(user.estado);
  const newStatus = currentStatus === UserStatusEnum.ACTIVE
    ? UserStatusEnum.INACTIVE
    : UserStatusEnum.ACTIVE;
  
  // Ahora usa enum, no strings hardcodeados
  updateUser({ ...user, estado: newStatus });
};

// Línea 528 - Status Chip
<TableCell>
  <Chip
    status={
      mapUserStatusBackendToFrontendEnum(row.estado) === UserStatusEnum.ACTIVE
        ? 'success'
        : 'default'
    }
    label={getEnumLabel(t, 'userStatus', row.estado)}
  />
</TableCell>

// Línea 542 - Toggle Icon
<IconButton
  color={
    mapUserStatusBackendToFrontendEnum(row.estado) === UserStatusEnum.ACTIVE
      ? 'warning'
      : 'success'
  }
  onClick={() => onToggleStatus(row)}
>
  {mapUserStatusBackendToFrontendEnum(row.estado) === UserStatusEnum.ACTIVE ? (
    <BlockIcon />
  ) : (
    <CheckCircleIcon />
  )}
</IconButton>

// Línea 563, 568 - Validaciones
if (mapUserStatusBackendToFrontendEnum(row.estado) === UserStatusEnum.ACTIVE) {
  // ...
}
```

---

## 📍 HALLAZGO #4: NotificationCenter.tsx - Prioridades

**Archivo:** `frontend/smart-economat-frontend/src/components/common/Notification/NotificationCenter.tsx`  
**Línea:** 417

### ❌ Código Actual (Problema)
```typescript
<Chip
  label={
    // Comparación directa con string
    notification.priority === 'urgent'
      ? 'Urgente'    // ← STRING HARDCODEADO EN ESPAÑOL
      : 'Pendiente'  // ← STRING HARDCODEADO EN ESPAÑOL
  }
  size="small"
  color={
    notification.priority === 'urgent'
      ? 'error'
      : 'warning'
  }
/>
```

### ✅ Código Corregido (Solución)

**Crear Enum Centralizado**
```typescript
// frontend/src/enums/notification-priority.enum.ts
export enum NotificationPriorityEnum {
  URGENT = 'urgent',
  PENDING = 'pending',
}
```

**Refactorizar Component**
```typescript
import { getEnumLabel } from '@i18n/enumPresentation';
import { NotificationPriorityEnum } from '@enums/notification-priority.enum';

<Chip
  label={getEnumLabel(t, 'notificationPriority', notification.priority)}
  size="small"
  color={
    notification.priority === NotificationPriorityEnum.URGENT
      ? 'error'
      : 'warning'
  }
/>
```

### 📝 Keys a Añadir a i18n
```json
// i18n/es.json
{
  "notificationPriority": {
    "urgent": "Urgente",
    "pending": "Pendiente"
  }
}

// i18n/en.json
{
  "notificationPriority": {
    "urgent": "Urgent",
    "pending": "Pending"
  }
}
```

---

## 📍 HALLAZGO #5: ProductoFormModal.tsx - Botones de Acción

**Archivo:** `frontend/smart-economat-frontend/src/features/productos/ProductoFormModal.tsx`  
**Línea:** 220

### ❌ Código Actual (Problema)
```typescript
<DynamicFormModal
  // ...
  title={
    (isEditing
      ? `Editar: ${String(initialData.nombre || '')}`
      : 'Crear Nuevo Producto')  // ← STRING HARDCODEADO
  }
  submitLabel={
    isEditing
      ? 'Guardar Cambios'         // ← STRING HARDCODEADO
      : 'Crear Producto'          // ← STRING HARDCODEADO
  }
/>
```

### ✅ Código Corregido (Solución)
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

<DynamicFormModal
  // ...
  title={
    isEditing
      ? t('producto.modal.tituloEditar', { nombre: initialData.nombre })
      : t('producto.modal.tituloCrear')
  }
  submitLabel={
    isEditing
      ? t('comun.guardarCambios')
      : t('producto.modal.crearProducto')
  }
/>
```

### 📝 Keys a Añadir
```json
{
  "producto": {
    "modal": {
      "tituloCrear": "Crear Nuevo Producto",
      "tituloEditar": "Editar: {{nombre}}",
      "crearProducto": "Crear Producto"
    }
  }
}
```

---

## 📋 CHECKLIST PARA IMPLEMENTAR

- [ ] Crear todos los enums en `frontend/src/enums/`
- [ ] Crear utils de mapeo en `frontend/src/utils/`
- [ ] Actualizar i18n con todas las claves
- [ ] Refactorizar archivos uno a uno
- [ ] Hacer build y verificar sin errores
- [ ] Cambiar idioma y verificar traducción
- [ ] Verificar que enum changes en backend no rompen frontend
- [ ] Agregar tests para nuevas utils

---

## 🔗 REFERENCIAS

- Enums correctos: `frontend/src/enums/`
- i18n utils: `frontend/src/i18n/enumPresentation.ts`
- Traduciones: `frontend/public/locales/[lang]/translation.json`
- Servicios: `frontend/src/services/`
