# Auditoría Técnica: Administración, Perfil y Usuarios

> **Fecha:** 2026-05-14  
> **Auditor:** Staff Engineer Senior — SmartEconomat  
> **Alcance:** Frontend React 19 — módulos Admin, Usuarios y Perfil  
> **Criticidad del módulo:** MÁXIMA (controla el sistema RBAC completo)

---

## Resumen Ejecutivo

Los módulos de Administración, Perfil y Usuarios presentan una arquitectura RBAC funcional con buenos patrones de verificación de permisos granular. Sin embargo, se identifican **2 vulnerabilidades críticas** relacionadas con la gestión de contraseñas que deben corregirse de inmediato: una contraseña temporal hardcodeada conocida públicamente y la generación de contraseñas aleatorias con `Math.random()` (no criptográfico) en el lado del cliente.

El sistema tiene bases sólidas (cookies httpOnly, CSRF, validación de IDs, separación admin/profesor), pero la lógica de generación y reseteo de contraseñas invierte la arquitectura de seguridad correcta: **el frontend genera la contraseña y se la envía al backend**, en lugar de que el backend genere y devuelva la contraseña. Esto expone la contraseña temporal en tránsito de red sin cifrado adicional a nivel de aplicación, y hace que la entropía dependa del PRNG no criptográfico del navegador.

---

## Métricas

| Dimensión | Calificación | Notas |
|-----------|-------------|-------|
| Seguridad RBAC frontend | 7/10 | Buena granularidad de permisos; `usePermission(undefined)→true` es un riesgo latente |
| Gestión de usuarios | 5/10 | Verificación de último admin es inexacta; email modal es funcionalidad dummy |
| Manejo de contraseñas | 3/10 | `Math.random()` + contraseña hardcodeada son inaceptables en producción |
| Autorización frontend | 7/10 | Buena integración con guards RBAC; ELEVATED_ROLES bypass correcto |
| Tipado TypeScript | 6/10 | `any` explícito en ChangePasswordForm; tipos de estado `string` en lugar de enum |
| UX de administración | 7/10 | Flujos bien pensados; algunos strings hardcodeados sin i18n |

---

## Hallazgos

---

### [ADM-001] Contraseña temporal hardcodeada y públicamente conocida

#### Severidad: Crítica
#### Categoría: Gestión de credenciales / Información sensible en código fuente

#### Descripción
`usuarioService.ts` define una contraseña por defecto que se usa al crear nuevos usuarios cuando no se especifica ninguna. Esta contraseña está hardcodeada directamente en el código fuente del bundle JavaScript que se distribuye al cliente.

#### Riesgo real
Cualquier atacante que descargue el JS de la aplicación puede extraer esta contraseña. Si el backend no fuerza cambio de contraseña al primer login, un atacante que conozca el username de un usuario recién creado puede autenticarse inmediatamente.

#### Evidencia

```19:20:backend/smart-economat-backend/src/modules/merma/service/merma.service.ts
```

```typescript
// usuarioService.ts, línea 19
const DEFAULT_TEMP_PASSWORD = 'Temp1234!';

// ...línea 61-63
if (isUpdate) {
  delete mapped.password;
} else if (!mapped.password) {
  mapped.password = DEFAULT_TEMP_PASSWORD; // ← se envía al backend en cada creación de usuario
}
```

#### Impacto
- Todos los usuarios creados sin contraseña explícita tendrán `Temp1234!`.
- Si el backend no configura `mustChangePassword: true`, la cuenta es inmediatamente comprometible.
- La contraseña queda expuesta en el bundle JS minificado.

#### Solución recomendada
1. Eliminar `DEFAULT_TEMP_PASSWORD` del frontend.
2. Si el backend necesita una contraseña provisional, generarla en el backend (`bcrypt` + CSPRNG).
3. El backend debe devolver la contraseña provisional solo una vez en la respuesta de creación.
4. Forzar `mustChangePassword: true` en todos los usuarios creados por un admin.

#### Prioridad: Inmediata
#### Riesgo de regresión: Bajo (solo afecta al DTO de creación)

---

### [ADM-002] Generación de contraseñas de reset con `Math.random()` en el cliente

#### Severidad: Crítica
#### Categoría: Criptografía débil / Arquitectura de seguridad invertida

#### Descripción
La función `resetPassword` de `usuarioService.ts` genera la nueva contraseña en el **frontend** usando `Math.random()`, que NO es un CSPRNG (Cryptographically Secure Pseudo-Random Number Generator). Además, el algoritmo de barajado usa `sort(() => 0.5 - Math.random())`, que produce distribuciones sesgadas. Finalmente, la contraseña generada se envía al backend en texto plano dentro del body de la petición PATCH.

#### Riesgo real
- Un atacante con capacidad de observar el estado inicial del PRNG del navegador (timing attacks, seed prediction) podría predecir la contraseña generada.
- La contraseña viaja al servidor en el body del request (aunque protegida por TLS, la arquitectura es incorrecta).
- El barajado con `sort()` es un antipatrón conocido que produce distribuciones no uniformes.

#### Evidencia

```typescript
// usuarioService.ts, líneas 363-380
const generateRandomPassword = () => {
  let pass = '';
  pass += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // ← Math.random NO criptográfico
  pass += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  pass += '0123456789'[Math.floor(Math.random() * 10)];
  pass += '!@#$%^&*'[Math.floor(Math.random() * 8)];

  for (let i = 0; i < 6; i++) {
    pass += characters[Math.floor(Math.random() * characters.length)];
  }
  // Barajado sesgado (antipatrón)
  return pass
    .split('')
    .sort(() => 0.5 - Math.random()) // ← Fisher-Yates incorrecto
    .join('');
};

const randomPassword = generateRandomPassword();

const response = await baseFetch(`/usuarios/${id}/password`, {
  method: 'PATCH',
  body: JSON.stringify({ password: randomPassword }), // ← contraseña generada en cliente
});
```

#### Impacto
- Baja entropía real de las contraseñas generadas.
- La generación en cliente expone la lógica de generación al atacante.
- Inversión del principio correcto: el servidor debe ser la fuente de credenciales.

#### Solución recomendada
1. Eliminar toda lógica de generación de contraseñas del frontend.
2. El endpoint `/usuarios/{id}/password` con `PATCH` debe generar la contraseña en el backend usando un CSPRNG seguro (`crypto.randomBytes` en Node.js).
3. El backend devuelve la contraseña provisional en la respuesta, y el frontend solo la muestra.
4. Si se necesita generación en cliente por algún motivo excepcional, usar `crypto.getRandomValues()` del Web Crypto API y un algoritmo Fisher-Yates correcto.

```typescript
// Correcto si el cliente DEBE generar (no recomendado)
function generateSecurePassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array); // ← Web Crypto API
  return Array.from(array).map(x => chars[x % chars.length]).join('');
}
```

#### Prioridad: Inmediata
#### Riesgo de regresión: Medio (requiere endpoint de backend que devuelva la contraseña)

---

### [ADM-003] Contraseña provisional expuesta en toast de notificación

#### Severidad: Alta
#### Categoría: Exposición de información sensible / Credenciales en UI

#### Descripción
Cuando un profesor resetea la contraseña de un alumno desde `Administracion.tsx`, la contraseña provisional se muestra en un toast de notificación con duración de 10 segundos. El toast es visible para cualquier persona presente en la pantalla y no tiene mecanismo de ocultar/copiar.

#### Riesgo real
- Shoulder surfing: cualquier persona que vea la pantalla del profesor ve la contraseña del alumno.
- No hay instrucción de que la contraseña debe ser comunicada de forma segura.
- La contraseña puede quedar en el log del sistema de notificaciones si se registra.

#### Evidencia

```typescript
// Administracion.tsx, líneas 543-557
const handleResetStudentPassword = async (id: string) => {
  try {
    const res = await profesorService.forcePasswordReset(id);
    if (res.success) {
      toast.success(
        t('admin.toast.contrasenaReset', {
          clave: res.data.provisionalPassword, // ← contraseña en toast público
        }),
        10000 // ← 10 segundos de visibilidad
      );
    }
  }
};
```

#### Solución recomendada
1. Mostrar la contraseña provisional en un dialog modal con botón "Copiar al portapapeles".
2. El dialog debe cerrarse con acción explícita del usuario, no automáticamente.
3. Añadir advertencia: "Esta contraseña solo se muestra una vez. Comunícala al alumno de forma segura."
4. Limpiar el portapapeles automáticamente tras 60 segundos si se copió.

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [ADM-004] Email modal de perfil es funcionalidad incompleta (dead code de UX)

#### Severidad: Alta
#### Categoría: Funcionalidad incompleta / Engaño al usuario

#### Descripción
El modal "Solicitar Cambio de Email" en `Perfil.tsx` valida los campos y muestra un toast de éxito, pero **no realiza ninguna llamada a la API**. El usuario cree que su solicitud ha sido enviada cuando en realidad no ocurre nada.

#### Riesgo real
- El usuario no puede cambiar su email de forma real.
- Si el email es incorrecto y el usuario confía en que la solicitud fue procesada, puede quedar con datos incorrectos indefinidamente.
- Es un engaño funcional que erosiona la confianza del usuario cuando descubre que no funciona.

#### Evidencia

```typescript
// Perfil.tsx, líneas 223-261
const handleSubmitEmailRequest = () => {
  const { newEmail, confirmNewEmail, justification } = emailRequest;
  // ... validaciones ...

  toast.success(t('perfil.emailModal.toast.requestSent')); // ← solo muestra toast

  setEmailRequest({ newEmail: '', confirmNewEmail: '', justification: '' });
  setIsEmailModalOpen(false);
  // ← SIN llamada a API. La solicitud no se envía a ningún lado.
};
```

#### Solución recomendada
Implementar uno de los siguientes enfoques:
1. **Opción A:** Crear endpoint `POST /usuarios/perfil/solicitar-cambio-email` y llamarlo desde `handleSubmitEmailRequest`.
2. **Opción B:** Si el cambio de email no requiere flujo de aprobación, permitir al usuario cambiar su email directamente en el formulario de perfil.
3. **Mientras no esté implementado:** Deshabilitar el botón y mostrar mensaje claro de que la funcionalidad no está disponible.

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [ADM-005] `usePermission(undefined)` devuelve `true` — bypass silencioso

#### Severidad: Alta
#### Categoría: Control de acceso / Fail-open

#### Descripción
La implementación de `usePermission` devuelve `true` si el parámetro `permiso` es `undefined` o una cadena vacía. Esto significa que si por error se llama al hook sin argumentos o con un permiso no inicializado, concede acceso en lugar de denegarlo (fail-open).

#### Riesgo real
Un componente que olvide pasar el permiso correcto, o que use una constante no inicializada, tendrá acceso concedido silenciosamente para todos los usuarios.

#### Evidencia

```typescript
// sherlock-auth/hooks.ts, líneas 23-40
export const usePermission = (
  permiso: string | string[] | undefined
): boolean => {
  return useMemo(() => {
    if (isElevatedRole(userRole)) return true;
    if (!permiso) return true; // ← si permiso es undefined/null/'', concede acceso
    if (Array.isArray(permiso)) {
      if (permiso.length === 0) return true; // ← array vacío → acceso concedido
      return permiso.every((p) => !!permissionsMap[p]);
    }
    return !!permissionsMap[permiso];
  }, [permissionsMap, permiso, userRole]);
};
```

También en `withPermission.tsx`:
```typescript
// Si por error WrappedComponent se usa sin requiredPermissions correcto,
// usePermission devuelve true y muestra el componente.
const hasAccess = usePermission(requiredPermissions);
```

#### Solución recomendada
```typescript
export const usePermission = (
  permiso: string | string[] | undefined
): boolean => {
  return useMemo(() => {
    if (isElevatedRole(userRole)) return true;
    // Fail-closed: permiso undefined/vacío = acceso denegado (salvo roles elevados)
    if (!permiso) return false;
    if (Array.isArray(permiso)) {
      if (permiso.length === 0) return false; // array vacío = sin permisos requeridos = denegado
      return permiso.every((p) => !!permissionsMap[p]);
    }
    return !!permissionsMap[permiso];
  }, [permissionsMap, permiso, userRole]);
};
```

**IMPORTANTE:** Verificar todos los usos de `usePermission` antes de aplicar este cambio, ya que algunos pueden depender del comportamiento fail-open actual.

#### Prioridad: Alta
#### Riesgo de regresión: Alto (requiere auditoría de todos los usos del hook)

---

### [ADM-006] Validación de email con case-sensitivity incorrecta en UserModal

#### Severidad: Media
#### Categoría: Validación de datos / Bug de lógica

#### Descripción
La validación del campo email en `UserModal.tsx` compara el rol con `'Alumno'` (minúscula inicial), pero cuando el rol se carga desde el backend viene como `'ALUMNO'` en mayúsculas. Esto puede causar que se salte la validación de email requerido para alumnos, o que se requiera email cuando no debería.

#### Evidencia

```typescript
// UserModal.tsx, líneas 320-327
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (formData.rol !== 'Alumno') {  // ← comparación exacta, falla con 'ALUMNO'
  if (!formData.email.trim()) {
    newErrors.email = t('usuarios.validation.correoObligatorio');
  } else if (!emailRegex.test(formData.email)) {
    newErrors.email = t('usuarios.validation.correoInvalido');
  }
}
```

Al editar un alumno existente, su rol viene como `'ALUMNO'` desde el backend, haciendo que `'ALUMNO' !== 'Alumno'` sea `true`, y por tanto se requiera email para todos los alumnos existentes al editar.

#### Solución recomendada
```typescript
if (formData.rol.toUpperCase() !== 'ALUMNO') {
  // validar email
}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [ADM-007] Verificación de último admin basada en lista paginada

#### Severidad: Media
#### Categoría: Validación de datos / Integridad de estado

#### Descripción
La función `isLastAdmin()` en `UserModal.tsx` cuenta los admins activos usando `usuariosList`, que es la unión de las listas paginadas cargadas actualmente. Si el sistema tiene más admins que los mostrados en la página actual, la verificación puede reportar falsamente que hay solo 1 admin cuando en realidad hay más.

#### Evidencia

```typescript
// UserModal.tsx, líneas 303-311
const isLastAdmin = () => {
  if (!userToEdit || !isAdminRole(userToEdit.rol)) return false;
  const adminCount = usuariosList.filter(
    (u) =>
      isAdminRole(u.rol) &&
      mapUserStatusBackendToEnum(u.estado) === UserStatusEnum.ACTIVE
  ).length;
  return adminCount <= 1; // ← basado en datos paginados, no en el total real
};
```

Si hay 50 admins y la paginación muestra 20, `adminCount` puede ser 1 cuando en realidad hay 50.

#### Solución recomendada
1. Consultar al backend antes de desactivar/cambiar rol si es el último admin activo.
2. O añadir una propiedad `totalAdmins` en la respuesta paginada y usarla.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [ADM-008] Tipo `any` explícito en ChangePasswordForm

#### Severidad: Media
#### Categoría: Tipado TypeScript / Calidad de código

#### Descripción
`ChangePasswordForm.tsx` acepta `formData` como `any`, eliminando toda verificación de tipos para los campos de contraseña. Esto es especialmente preocupante en un componente de seguridad.

#### Evidencia

```typescript
// ChangePasswordForm.tsx, líneas 21-22
// eslint-disable-next-line @typescript-eslint/no-explicit-any
formData: any; // ← tipo any explícito en formulario de contraseña
```

#### Solución recomendada
```typescript
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordFormProps {
  isEditing: boolean;
  formData: PasswordFormData; // tipo estricto
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [ADM-009] Validación de contraseña actual ausente antes de enviar

#### Severidad: Media
#### Categoría: Validación de datos / UX de seguridad

#### Descripción
En `Perfil.tsx`, cuando el usuario activa el cambio de contraseña, no hay validación frontend de que `currentPassword` esté relleno antes de llamar a `authService.changePassword`. Si se envía `newPassword` sin `currentPassword`, la petición se envía igualmente y el backend debe rechazarla.

#### Evidencia

```typescript
// Perfil.tsx, líneas 167-183
if (passwordData.newPassword) {
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    throw new Error(t('perfil.errors.passwordMismatch'));
  }
  // ← NO se verifica que currentPassword esté relleno
  await authService.changePassword({
    currentPassword: passwordData.currentPassword, // puede ser ''
    newPassword: passwordData.newPassword,
  });
}
```

#### Solución recomendada
```typescript
if (passwordData.newPassword) {
  if (!passwordData.currentPassword.trim()) {
    throw new Error(t('perfil.errors.currentPasswordRequired'));
  }
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    throw new Error(t('perfil.errors.passwordMismatch'));
  }
  // ...
}
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [ADM-010] Filtrado de plantillas de rol por nombre en cliente — plantillas ocultas

#### Severidad: Media
#### Categoría: Funcionalidad / Visibilidad de datos

#### Descripción
`PlantillasRolesView.tsx` filtra las plantillas de rol en el cliente, mostrando únicamente las que coinciden con `KNOWN_TEMPLATE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'PROFESOR', 'ALUMNO']`. Cualquier plantilla personalizada que el sistema tenga (ej. `RESPONSABLE_COCINA`, `BECARIO`) no será visible en la UI aunque el backend la devuelva.

#### Evidencia

```typescript
// PlantillasRolesView.tsx, líneas 74, 137-141
const KNOWN_TEMPLATE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'PROFESOR', 'ALUMNO'];

setPlantillas(
  plantillasRes.data.filter((p: PlantillaRol) =>
    KNOWN_TEMPLATE_NAMES.includes(p.nombre.toUpperCase()) // ← solo 4 plantillas visibles
  )
);
```

#### Impacto
Las plantillas de rol creadas dinámicamente no aparecen en la vista de administración, lo que impide gestionarlas desde la UI.

#### Solución recomendada
Eliminar el filtro o hacerlo configurable. Si el filtro es intencional para el MVP, documentarlo claramente con un comentario `// TODO: mostrar todas las plantillas`.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [ADM-011] Estado inicial de usuario como string literal en lugar de enum

#### Severidad: Media
#### Categoría: Tipado TypeScript / Coherencia de datos

#### Descripción
El estado inicial del formulario en `UserModal.tsx` usa strings hardcodeados (`'Inactivo'`, `'Activo'`) en lugar del enum `UserStatusEnum`. Esto genera inconsistencias cuando el mapeo entre frontend y backend falla.

#### Evidencia

```typescript
// UserModal.tsx, líneas 98-107
const [formData, setFormData] = useState({
  // ...
  estado: 'Inactivo', // ← string literal, no UserStatusEnum
  // ...
});

// Y más adelante, opciones del Select:
options={[
  { value: 'Activo', label: t('comun.activos') },   // ← 'Activo' ≠ UserStatusEnum.ACTIVE
  { value: 'Inactivo', label: t('usuarios.inactivos') }, // ← 'Inactivo' ≠ UserStatusEnum.INACTIVE
]}
```

El mapeo `mapFrontendToBackend` en `usuarioService.ts` tiene lógica para convertir `'Activo'`/`'Inactivo'`, pero es frágil y difícil de mantener.

#### Solución recomendada
```typescript
import { UserStatusEnum } from '../../enums/user-status.enum';

const [formData, setFormData] = useState({
  // ...
  estado: UserStatusEnum.INACTIVE, // ← enum tipado
});
```

#### Prioridad: Media
#### Riesgo de regresión: Medio

---

### [ADM-012] Strings hardcodeados sin internacionalización en varios componentes

#### Severidad: Baja
#### Categoría: Internacionalización / Mantenibilidad

#### Descripción
Múltiples componentes tienen strings de UX hardcodeados en español sin usar el sistema i18n, lo que rompe el soporte multiidioma anunciado.

#### Evidencia

```typescript
// ubicaciones-admin-manager.tsx, líneas 62-64
toast.error('Error al cargar ubicaciones'); // ← sin i18n
toast.success('Ubicación actualizada correctamente'); // ← sin i18n
toast.success('Ubicación creada correctamente'); // ← sin i18n

// ChangePasswordForm.tsx, líneas 78-86
<Typography>Seguridad</Typography>
<Typography>La contraseña está protegida. Para cambiarla, activa el modo de edición de la ficha.</Typography>

// ProfileForm.tsx, líneas 72-73, 83-84, 97-104
<Typography>Nombre de Usuario</Typography>
<Typography>ID de Usuario</Typography>
<Typography>Correo Electrónico</Typography>
```

#### Solución recomendada
Extraer todos los strings a `i18n/es.json` e `i18n/en.json` y usar `t('clave.del.string')`.

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [ADM-013] QuickSlotDialog siempre usa `adminCreateSlot` sin verificar rol

#### Severidad: Baja
#### Categoría: Arquitectura / Separación de responsabilidades

#### Descripción
`QuickSlotDialog.tsx` llama siempre a `profesorService.adminCreateSlot()` independientemente de si el usuario actual tiene rol de admin o de profesor. Aunque el backend protege el endpoint con guards, el frontend no es coherente con la separación de rutas admin/profesor.

#### Evidencia

```typescript
// QuickSlotDialog.tsx, línea 79
const res = await profesorService.adminCreateSlot({
  aula: formData.aula.trim(),
  numeroClase: Number(formData.numeroClase),
  capacidad: Number(formData.capacidad),
  profesorId: formData.profesorId, // ← requiere profesorId explícito
});
```

Un profesor que use este dialog verá un error 403 del backend si `adminCreateSlot` requiere permisos de admin. La UX debería seleccionar el endpoint correcto según el rol.

#### Solución recomendada
```typescript
const { user } = useAuth();
const isAdmin = isElevatedRole(user?.rol);

const res = isAdmin
  ? await profesorService.adminCreateSlot({ ...data, profesorId: formData.profesorId })
  : await profesorService.createSlot({ aula: data.aula, numeroClase: data.numeroClase, capacidad: data.capacidad });
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [ADM-014] `window.confirm()` para confirmaciones destructivas — sin accesibilidad

#### Severidad: Baja
#### Categoría: Accesibilidad / UX

#### Descripción
`ubicaciones-admin-manager.tsx` y `Administracion.tsx` usan `window.confirm()` para confirmar eliminaciones. Este diálogo nativo del navegador no puede ser estilizado, no es accesible, y bloquea el hilo principal.

#### Evidencia

```typescript
// ubicaciones-admin-manager.tsx, líneas 121-125
if (!window.confirm(
  '¿Eliminar esta ubicación? No podrás hacerlo si tiene inventario u operaciones vinculadas.'
)) return;

// Administracion.tsx, línea 441
if (!window.confirm(t('admin.confirm.eliminarClase'))) return;
```

Nótese que `UsuariosView.tsx` sí usa el componente `ConfirmDialog` correcto, pero los otros módulos no son consistentes.

#### Solución recomendada
Reemplazar con el componente `ConfirmDialog` ya existente en el proyecto (`components/ui/ConfirmDialog`).

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [ADM-015] Doble asignación de `isInitialized.current` — posible race condition

#### Severidad: Baja
#### Categoría: React / Ciclo de vida

#### Descripción
En `Perfil.tsx`, `isInitialized.current` se asigna a `true` dentro del async callback `loadInitialData()` y también inmediatamente después en el `useEffect`. Si el componente se desmonta durante la carga, el callback puede intentar actualizar estado en un componente desmontado.

#### Evidencia

```typescript
// Perfil.tsx, líneas 78-124
useEffect(() => {
  const loadInitialData = async () => {
    if (user) {
      // ...
      isInitialized.current = true; // ← primera asignación
    } else {
      // ...carga async...
    }
  };

  if (!isInitialized.current) {
    void loadInitialData();
    isInitialized.current = true; // ← segunda asignación (síncrona, puede ser antes de que termine la carga)
  }
}, [refreshUser, user]);
```

#### Solución recomendada
Usar el patrón de cleanup de useEffect con una bandera local:
```typescript
useEffect(() => {
  let cancelled = false;
  const load = async () => {
    // ...
    if (!cancelled) setProfileData(...);
  };
  void load();
  return () => { cancelled = true; };
}, [user]);
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

## Inconsistencias Frontend/Backend

### 1. Generación de contraseñas en el lugar incorrecto
El backend tiene el endpoint `PATCH /usuarios/{id}/password` que acepta una contraseña ya generada. La arquitectura correcta requiere que el **backend** genere y devuelva la contraseña provisional. Actualmente el frontend genera y envía, lo que invierte la responsabilidad de seguridad.

### 2. Contraseña provisional del reset de alumnos vs. reset de usuarios regulares
`profesorService.forcePasswordReset()` llama a `POST /profesores/alumnos/{id}/force-reset` y el backend devuelve `provisionalPassword`. Este es el flujo **correcto** (backend genera). Sin embargo, `usuarioService.resetPassword()` genera la contraseña en el **frontend** y la envía al backend con `PATCH /usuarios/{id}/password`. Dos flujos distintos e inconsistentes para la misma operación.

### 3. Email de alumno no requerido en backend pero verificado en frontend con lógica frágil
La validación `formData.rol !== 'Alumno'` es case-sensitive y puede fallar. El backend debería ser la fuente de verdad sobre qué campos son obligatorios por rol.

### 4. Estado del usuario: `UserStatusEnum` vs strings literales
El backend usa `ACTIVE`, `INACTIVE`, `BLOCKED`. El frontend mezcla strings localizados (`'Activo'`, `'Inactivo'`) con el enum. El mapping en `mapFrontendToBackend` es frágil ante nuevos estados.

---

## Riesgos Potenciales Futuros

### R1: IDOR al gestionar slots de alumnos
Si el backend del endpoint `PATCH /profesores/slots/{id}` no verifica que el slot pertenece al profesor autenticado, un profesor podría editar slots de otro profesor cambiando el `id` en la petición. El frontend no tiene defensa contra esto.

### R2: Escalada de privilegios via permisos adicionales en UserModal
El `UserModal` permite asignar permisos individuales adicionales o excluir permisos del rol. Si un usuario con permisos de edición de usuarios (pero sin ser SUPER_ADMIN) puede asignar cualquier permiso adicional a cualquier usuario, podría escalar privilegios. El backend debe validar que los permisos asignados son compatibles con el rol del usuario que realiza la operación.

### R3: `PlantillasRolesView` permite asignar todos los permisos a cualquier plantilla no protegida
Los botones "Seleccionar todos" permiten asignar el conjunto completo de permisos del sistema a una plantilla PROFESOR o ALUMNO. Aunque el backend debe validar esto, en la UI no hay advertencia explícita de las implicaciones de tal operación.

### R4: Notificaciones de stock exponen nombres de productos a admins sin permiso de inventario
El `NotificationCenter` carga notificaciones de inventario si `canReviewInventoryNotifications` es true. Esta verificación incluye un permiso custom `'inventario:ver_alertas'` que no aparece en `PERMISSIONS`. Si este permiso no existe en el backend, la verificación siempre falla y el check `useAnyPermission` puede comportarse inesperadamente.

```typescript
// NotificationCenter.tsx, línea 53-56
const canReviewInventoryNotifications = useAnyPermission([
  PERMISSIONS.inventario.listar,
  PERMISSIONS.inventario.ver,
  'inventario:ver_alertas', // ← permiso custom no definido en PERMISSIONS constants
]);
```

---

## Deuda Técnica

| ID | Deuda | Coste estimado |
|----|-------|---------------|
| DT-001 | Extraer toda lógica de generación de contraseñas al backend | Alto |
| DT-002 | Completar funcionalidad de cambio de email (modal vacío) | Medio |
| DT-003 | Migrar todos los strings hardcodeados a i18n | Medio |
| DT-004 | Reemplazar `any` en ChangePasswordForm con interfaz tipada | Bajo |
| DT-005 | Unificar uso de `UserStatusEnum` en lugar de strings literales | Medio |
| DT-006 | Implementar `ConfirmDialog` consistente para todas las eliminaciones | Bajo |
| DT-007 | Verificación de último admin con consulta al backend | Medio |
| DT-008 | Mostrar todas las plantillas de rol (no solo las 4 conocidas) | Bajo |
| DT-009 | Añadir tipo estricto al `formData` de ChangePasswordForm | Bajo |
| DT-010 | Sanitizar `window.confirm()` con componente accesible | Bajo |

---

## Conclusión

Los módulos auditados tienen una base arquitectónica sólida en cuanto a autorización. El sistema RBAC con permisos granulares, la integración con cookies httpOnly para el token JWT, la protección CSRF, y la validación de IDs antes de enviar al backend son buenos patrones que demuestran madurez en seguridad.

Sin embargo, los **dos hallazgos críticos** (ADM-001 y ADM-002) deben corregirse antes de cualquier despliegue en producción:

1. **Eliminar `DEFAULT_TEMP_PASSWORD = 'Temp1234!'`** del código fuente del cliente.
2. **Mover la generación de contraseñas de reset al backend**, usando `crypto.randomBytes()` y devolviendo solo la contraseña provisional en la respuesta.

Una vez resueltos estos dos críticos, los hallazgos altos (ADM-003 al ADM-005) deben abordarse en el sprint siguiente. Los hallazgos medios y bajos pueden planificarse como deuda técnica en iteraciones posteriores.

El módulo de perfil tiene una **funcionalidad incompleta** (ADM-004) que puede crear problemas de confianza con el usuario si llega a producción tal como está.

> **Veredicto:** No apto para producción en el estado actual. Requiere resolución de ADM-001 y ADM-002 como condición bloqueante.
