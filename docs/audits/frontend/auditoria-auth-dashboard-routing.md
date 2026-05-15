# Auditoría Técnica: Auth, Dashboard y Routing

**Proyecto:** SmartEconomat Frontend  
**Stack:** React 19 · TypeScript · Vite 6 · MUI 7 · React Router 7 · Redux Toolkit · Context API  
**Autenticación:** Cookie httpOnly JWT · RBAC dinámico (80+ permisos, Redis TTL 300s)  
**Fecha:** 2026-05-14  
**Auditor:** Staff Engineer Senior (Auditoría automatizada)  
**Archivos analizados:** 30 archivos fuente

---

## Resumen Ejecutivo

El sistema de autenticación de SmartEconomat tiene una arquitectura sólida como base: cookies httpOnly que eliminan el riesgo de robo de tokens vía XSS, un sistema RBAC con dos capas complementarias, deduplicación de peticiones `refreshUser` mediante ref, y un event bus limpio para eventos de sesión. Estas son fortalezas reales y bien implementadas.

Sin embargo, la auditoría revela **4 problemas de alta severidad** que pueden comprometer la seguridad y la integridad del sistema en producción, más **8 de severidad media** que degradan la resiliencia y la UX. Los más críticos son: (1) race condition con `setTimeout` sin limpieza en desmontaje durante el login, (2) estado `user` no limpiado al hacer logout, (3) fracaso silencioso del logout que no invalida la sesión en el backend, y (4) race condition en la carga concurrente de estadísticas del dashboard.

El nivel de riesgo global es **MEDIO-ALTO**, principalmente por los problemas de gestión de estado en el flujo de autenticación. El routing está bien implementado, con algunos déficits de UX. El tipado TypeScript tiene inconsistencias puntuales pero no es catastrófico.

---

## Métricas

| Dimensión | Calificación |
|-----------|-------------|
| Seguridad auth (cookie/CSRF/XSS) | **Buena** |
| Gestión de estado auth | **Aceptable** (race conditions puntuales) |
| Routing y guards | **Buena** |
| UX y loading states | **Aceptable** |
| Tipado TypeScript | **Aceptable** (inconsistencias controladas) |
| Resiliencia y error handling | **Deficiente** (fallos silenciosos) |
| Rendimiento (memoización, abortos) | **Deficiente** |

---

## Hallazgos

---

### [AUTHD-001] Race condition: setTimeout sin cleanup en handleLoginSuccess

#### Severidad: Alta
#### Categoría: Estado / Seguridad
#### Descripción

En `Login.tsx`, `handleLoginSuccess` almacena el usuario en `pendingAuth.current` y programa un `setTimeout` de 2200ms antes de llamar a `login()`. No existe ningún mecanismo de limpieza si el componente se desmonta durante esa ventana (el usuario cierra la pestaña, navega manualmente, etc.).

#### Riesgo real

Si el componente se desmonta antes de que expire el timer, el callback del `setTimeout` seguirá ejecutando `await login(pendingAuth.current.user)`, que llama a `setUser`, `setIsSessionVerified` y `setIsAuthResolved` sobre un contexto que ya puede haber sido destruido. En React 19, esto puede producir actualizaciones de estado sobre componentes desmontados, lo que en casos extremos puede causar comportamientos indefinidos o advertencias silenciosas que enmascaran bugs.

#### Evidencia

```tsx
// Login.tsx líneas 187-196
const handleLoginSuccess = (user: User) => {
  pendingAuth.current = { user };
  setPhase('login-exit');
  // No hay AbortController ni ref de isMounted. Si el componente
  // se desmonta, este callback ejecuta igualmente.
  setTimeout(async () => {
    if (pendingAuth.current) {
      await login(pendingAuth.current.user);
    }
  }, EXIT_DURATION + 200);  // 2200ms sin guard de desmontaje
};
```

#### Impacto

- Actualización de estado sobre componente desmontado
- Posible doble invocación de `login()` si el componente remonta
- Ventana de 2200ms en la que cualquier interrupción puede dejar el flujo en estado inconsistente

#### Solución recomendada

```tsx
const isMountedRef = useRef(true);

useEffect(() => {
  return () => { isMountedRef.current = false; };
}, []);

const handleLoginSuccess = (user: User) => {
  pendingAuth.current = { user };
  setPhase('login-exit');
  setTimeout(async () => {
    if (pendingAuth.current && isMountedRef.current) {
      await login(pendingAuth.current.user);
    }
  }, EXIT_DURATION + 200);
};
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [AUTHD-002] Usuario construido desde datos del formulario, no desde respuesta del servidor

#### Severidad: Alta
#### Categoría: Seguridad / Estado
#### Descripción

En `LoginForm.tsx`, el objeto `User` que se pasa a `onLoginSuccess` se construye desde los datos del formulario (`formData.email`), con `id: ''` y `rol: ''`. Este objeto ficticio se almacena en el estado `user` del `AuthContext` durante ~2200ms (la duración de la animación de salida) antes de que `refreshUser()` lo sobrescriba con datos reales del backend.

#### Riesgo real

Durante la ventana de 2200ms, cualquier componente que lea `user.id` (para analytics, para un header de petición HTTP, para construir un payload) obtiene una cadena vacía. `user.rol` también es vacío, por lo que `isElevatedRole('')` devuelve `false`, y los checks de permisos basados en rol fallarían si se ejecutaran en esa ventana. El `permisos` field no se incluye en el objeto construido (aunque sea opcional en el tipo), dejando permisos vacíos.

#### Evidencia

```tsx
// LoginForm.tsx líneas 107-115
const user = {
  id: '',               // SIEMPRE vacío - no viene del backend
  name: formData.email.trim(),
  email: formData.email.includes('@') ? formData.email.trim() : '',
  rol: '',              // SIEMPRE vacío - no viene del backend
  username: formData.email.includes('@') ? undefined : formData.email.trim(),
  // permisos: ausente  ← no se incluye, queda undefined
};
```

El backend devuelve el token JWT en la cookie httpOnly pero no expone `id`, `rol` ni `permisos` en el cuerpo de `POST /auth/login` (que solo devuelve `{ access_token, requirePasswordChange }`). La solución correcta es llamar a `GET /usuarios/perfil` inmediatamente tras el login para obtener los datos reales, lo cual ya hace `refreshUser()`. El problema es la ventana antes de esa llamada.

#### Impacto

- Estado de usuario ficticio durante 2200ms
- Si `refreshUser()` falla después del login, el usuario queda con `id=''` y `rol=''`
- Inconsistencia entre la interfaz `User` en `sherlock-auth/types.ts` (con `permisos?: string[]`) y el objeto construido aquí

#### Solución recomendada

No pasar un objeto `User` ficticio. La animación de salida puede ocurrir sin necesitar datos de usuario. `login()` debería recibir una señal de que la autenticación fue exitosa, no un objeto `User` incompleto:

```tsx
// En el AuthProvider, separar el flujo:
const onAuthSuccess = React.useCallback(async () => {
  setPhase('login-exit');
  setTimeout(async () => {
    await refreshUser(); // Carga los datos reales antes de redirigir
  }, EXIT_DURATION + 200);
}, [refreshUser]);
```

O simplificar: eliminar la animación de 2200ms y llamar a `refreshUser()` directamente, redirigiendo tras su resolución.

#### Prioridad: Alta
#### Riesgo de regresión: Medio

---

### [AUTHD-003] Logout no limpia el estado `user`

#### Severidad: Alta
#### Categoría: Seguridad / Estado
#### Descripción

La función `logout()` en `provider.tsx` limpia `isSessionVerified`, `isAuthResolved` y `localStorage`, pero **nunca llama a `setUser(null)`**. El objeto `user` persiste en el estado del contexto con los datos de la sesión cerrada.

#### Riesgo real

`isAuthenticated = !!user && isSessionVerified` → con `isSessionVerified = false`, `isAuthenticated` es `false` (correcto), y `ProtectedRoute` redirige correctamente a `/login`. El riesgo real ocurre en:

1. **Re-login inmediato:** Si el usuario se loguea de nuevo sin recargar la página, `setUser(userData)` se llama con el usuario ficticio (ver AUTHD-002), pero `user` ya tenía datos del usuario anterior. Hay una condición de carrera entre el usuario anterior y el nuevo.

2. **Acceso directo a `user` sin verificar `isAuthenticated`:** Cualquier componente que lea `useAuth().user` directamente (no solo `isAuthenticated`) puede ver datos del usuario anterior después de un logout. Por ejemplo, `MainLayout` usa `user?.name` y `user?.rol` para el avatar y el menú, que podrían mostrar datos del usuario anterior brevemente.

3. **Múltiples tabs:** Si se abre un segundo tab y se hace logout en el primero, el segundo tab mantiene el `user` en memoria (aunque el backend invalide la cookie, el estado React persiste hasta la siguiente `visibilitychange` que dispara `refreshUser`).

#### Evidencia

```tsx
// provider.tsx líneas 131-142
const logout = React.useCallback(async () => {
  refreshPromiseRef.current = null;
  clearPersistedSessionArtifacts();
  setIsSessionVerified(false);
  setIsAuthResolved(true);
  localStorage.removeItem('sm_has_session');
  // ← FALTA: setUser(null);
  try {
    await authService.logout();
  } catch {
    return;
  }
}, []);
```

#### Impacto

- Datos de usuario previo visibles brevemente durante re-login
- Posible filtración de información en componentes que leen `user` directamente

#### Solución recomendada

```tsx
const logout = React.useCallback(async () => {
  refreshPromiseRef.current = null;
  clearPersistedSessionArtifacts();
  setUser(null);                    // ← AÑADIR
  dispatch(resetPermissions());     // ← AÑADIR: limpiar Redux también
  setIsSessionVerified(false);
  setIsAuthResolved(true);
  localStorage.removeItem('sm_has_session');
  try {
    await authService.logout();
  } catch {
    // Backend failure logged but session already cleared on frontend
    console.error('Backend logout failed - session cleared locally');
  }
}, [dispatch]);
```

#### Prioridad: Inmediata
#### Riesgo de regresión: Bajo

---

### [AUTHD-004] Logout silencia errores del backend - sesión no invalidada en servidor

#### Severidad: Alta
#### Categoría: Seguridad
#### Descripción

El bloque `catch` de `logout()` en `provider.tsx` captura cualquier error y hace `return` silenciosamente. Si `POST /auth/logout` falla (red caída, servidor caído, timeout), el frontend borra el estado local pero la cookie httpOnly sigue siendo válida en el servidor. El usuario queda deslogueado en UI pero autenticado en backend.

#### Riesgo real

Un atacante que captura la cookie (via MITM en ausencia de HSTS, o por acceso físico al dispositivo) puede seguir usándola indefinidamente si el logout nunca invalida la sesión en el servidor. Esto es especialmente grave si el sistema usa JWT de larga duración sin lista de revocación.

#### Evidencia

```tsx
// provider.tsx líneas 137-141
try {
  await authService.logout();
} catch {
  return;  // El error se descarta completamente. Sin log, sin notificación.
}
```

#### Impacto

- Sesión en backend no invalidada si la petición falla
- Sin retroalimentación al usuario sobre el fallo
- Posible re-uso de cookie válida por terceros

#### Solución recomendada

```tsx
try {
  await authService.logout();
} catch (error) {
  // Log the error but proceed - cookie will expire naturally
  console.error('[Auth] Backend logout failed:', error);
  // Optionally show a transient warning (non-blocking)
  // toast.warning(t('auth.logoutBackendWarning'));
}
// No return - always navigate to login regardless
```

Adicionalmente, el backend debería implementar una lista de revocación (Redis blacklist) para tokens JWT activos, de modo que aunque el frontend falle, los tokens listados como revocados sean rechazados en el próximo uso.

#### Prioridad: Inmediata
#### Riesgo de regresión: Bajo

---

### [AUTHD-005] Race condition en fetchDashboardStats - última respuesta gana

#### Severidad: Media
#### Categoría: Estado / Performance
#### Descripción

`loadStats` en `Home.tsx` es una función async que no implementa cancelación. Puede ser invocada concurrentemente desde: (1) el `useEffect` inicial, (2) el botón "Reintentar" en el estado de error, (3) `handleSaveQuickAction` tras crear un producto o receta. Si dos llamadas se solapan, la última en **completar** (no la última en **iniciar**) sobreescribe `stats`.

#### Riesgo real

En una red lenta, el usuario podría crear un producto, ver la actualización de stats de la primera petición, y luego ver los stats anteriores cuando llega la segunda petición más lenta. Esto es inconsistencia de datos visible en UI.

#### Evidencia

```tsx
// Home.tsx líneas 246-287
const loadStats = useCallback(async () => {
  if (!canViewDashboard) { ... return; }
  setIsLoading(true);
  setError(null);
  try {
    const data = await fetchDashboardStats(); // No AbortController
    setStats(data);                           // Sobreescribe sin verificar si es la última
    // ...
    const notifs = await fetchAppNotifications({ ... }); // Segunda petición sin abortar
    setNotifications(notifs);
  }
}, [canListUsers, canReviewInventoryNotifications, canViewDashboard, t]);

// Llamadas concurrentes potenciales:
loadStats();          // En useEffect
// + handleSaveQuickAction llama loadStats() sin await
```

#### Impacto

- Datos stale mostrados en dashboard
- Inconsistencia entre estadísticas mostradas y estado real del sistema

#### Solución recomendada

```tsx
const abortControllerRef = useRef<AbortController | null>(null);

const loadStats = useCallback(async () => {
  // Cancelar petición anterior
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();
  const signal = abortControllerRef.current.signal;

  setIsLoading(true);
  try {
    const data = await fetchDashboardStats(signal);
    if (!signal.aborted) setStats(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    setError(/* ... */);
  } finally {
    if (!signal.aborted) setIsLoading(false);
  }
}, [/* deps */]);

useEffect(() => {
  return () => { abortControllerRef.current?.abort(); };
}, []);
```

#### Prioridad: Alta
#### Riesgo de regresión: Medio

---

### [AUTHD-006] Doble sistema de permisos: array `user.permisos` vs Redux map - inconsistencia

#### Severidad: Media
#### Categoría: Estado / Seguridad
#### Descripción

Existen dos sistemas para verificar permisos que se usan en distintos puntos del código:

1. **`hasPermission(user, perm)`** → `user.permisos.includes(perm)` — búsqueda O(n) en array. Usado en `ProtectedRoute` y `MainLayout`.
2. **`usePermission(perm)`** → `permissionsMap[perm]` — lookup O(1) en Redux. Usado en `Home.tsx` y componentes de página.

Ambos son populados desde la misma fuente (`refreshUser()`), pero el acceso al dato es distinto. El Redux map lo llena `dispatch(setPermissions(refreshedUser.permisos))`, mientras que el array vive en `user.permisos`.

#### Riesgo real

Si el Redux store y `user.permisos` se desincronizaran (por un bug, por un `addPermission`/`removePermission` manual desde el slice, o por `updateUser({permisos: [...]})`), la visibilidad de un elemento en el menú lateral diferiría de si `usePermission()` devuelve `true` en el componente de destino. Un usuario podría ver un elemento del menú pero obtener una pantalla en blanco al navegar, o viceversa.

#### Evidencia

```tsx
// ProtectedRoute.tsx línea 49 - usa array
if (requiredPermission && !hasPermission(user, requiredPermission)) {

// MainLayout.tsx línea 496 - usa array
if (item.permiso) {
  return hasPermission(user, item.permiso); // O(n) scan

// Home.tsx líneas 172-173 - usa Redux map
const canViewDashboard = usePermission(PERMISSIONS.dashboard.ver_estadisticas); // O(1)
```

#### Impacto

- Inconsistencia potencial entre guards de ruta y visibilidad de componentes
- Performance: rutas con muchos ítems de menú hacen múltiples búsquedas O(n)

#### Solución recomendada

Unificar el sistema: usar **siempre** `usePermission()` (que lee el Redux map) tanto en `ProtectedRoute` como en `MainLayout`. Esto requiere convertir `ProtectedRoute` y el filtro de menú en hooks o hacerlos consumir el store de Redux.

```tsx
// En ProtectedRoute, reemplazar hasPermission(user, perm) por:
const hasRequiredPermission = usePermission(requiredPermission);
// y usar el resultado para el guard
```

#### Prioridad: Media
#### Riesgo de regresión: Medio

---

### [AUTHD-007] PublicRoute no restaura la ruta de destino original tras el login

#### Severidad: Media
#### Categoría: Routing / UX
#### Descripción

`ProtectedRoute` guarda la ruta de destino en el state de navegación al redirigir a `/login`:

```tsx
<Navigate to="/login" replace state={{ from: location }} />
```

Sin embargo, `PublicRoute` siempre redirige a `/` tras autenticarse, ignorando completamente el `state.from`:

```tsx
// PublicRoute.tsx línea 17
if (isAuthenticated) {
  return <Navigate to="/" replace />;  // Siempre a root, nunca a state.from
}
```

#### Riesgo real

Si un usuario no autenticado intenta acceder directamente a `/pedidos/123` y es redirigido a `/login`, tras autenticarse aterrizará en `/` (Home) en lugar de en `/pedidos/123`. Esto rompe deep linking y el flujo de trabajo de usuarios que llegan por bookmark o compartición de URL.

#### Evidencia

```tsx
// ProtectedRoute.tsx línea 46 - guarda la ruta
<Navigate to="/login" replace state={{ from: location }} />

// PublicRoute.tsx línea 17 - ignora la ruta guardada
if (isAuthenticated) {
  return <Navigate to="/" replace />;
}
```

#### Solución recomendada

```tsx
// PublicRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const PublicRoute: React.FC = () => {
  const { isAuthenticated, isAuthResolved } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  if (!isAuthResolved) return <Spinner overlay="screen" size="lg" />;
  if (isAuthenticated) return <Navigate to={from} replace />;
  return <Outlet />;
};
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [AUTHD-008] Login: si refreshUser() falla, el usuario queda "autenticado" con permisos vacíos

#### Severidad: Media
#### Categoría: Seguridad / Estado
#### Descripción

En `login()` del `provider.tsx`, si `refreshUser()` lanza un error no relacionado con 401 (timeout de red, 503, error de parsing), el bloque `catch` llama a `setIsAuthResolved(true)` pero el usuario sigue teniendo los datos ficticios del formulario (id='', rol='', permisos ausentes). `isSessionVerified` quedó en `true` por la línea anterior a `refreshUser()`.

#### Riesgo real

`isAuthenticated = !!user && isSessionVerified` = `true` (usuario ficticio + sessionVerified=true). El usuario está "autenticado" desde la perspectiva de `isAuthenticated`, pero `user.id=''`, `user.rol=''`, `user.permisos=undefined`. Todos los checks de permisos retornarán `false`, el menú lateral estará vacío, y el dashboard mostrará "sin permisos". El usuario está atrapado en un estado liminal.

#### Evidencia

```tsx
// provider.tsx líneas 144-161
const login = React.useCallback(async (userData: User) => {
  refreshPromiseRef.current = null;
  clearPersistedSessionArtifacts();
  setUser(userData);           // Usuario ficticio
  setIsSessionVerified(true);  // ← Se marca como verificado ANTES de refreshUser
  localStorage.setItem('sm_has_session', 'true');
  setIsAuthResolved(false);

  try {
    await refreshUser();       // Si esto falla con error no-401...
  } catch (error) {
    console.error('Error refreshing user after login:', error);
    setIsAuthResolved(true);   // ← El usuario queda con datos ficticios + isAuthenticated=true
  }
}, [refreshUser]);
```

#### Solución recomendada

En el `catch`, si `refreshUser()` falla con un error que no es 401, se debe hacer logout limpio o al menos limpiar `isSessionVerified`:

```tsx
} catch (error) {
  console.error('Error refreshing user after login:', error);
  // Si el refresh falla, no podemos confirmar la sesión
  setUser(null);
  setIsSessionVerified(false);
  setIsAuthResolved(true);
  // Opcionalmente mostrar error al usuario
}
```

#### Prioridad: Alta
#### Riesgo de regresión: Bajo

---

### [AUTHD-009] JSON.parse sin try-catch en inicialización de visibleMetrics - crash en montaje

#### Severidad: Media
#### Categoría: Resiliencia
#### Descripción

En `Home.tsx`, el estado inicial de `visibleMetrics` se obtiene de `localStorage` con `JSON.parse()` sin ningún guard. Si el valor almacenado está corrupto (truncado, alterado manualmente, o serializado con un formato diferente), `JSON.parse()` lanzará un `SyntaxError` que propagará hasta el límite de error más cercano, potencialmente dejando el dashboard en blanco.

#### Evidencia

```tsx
// Home.tsx líneas 224-236
const [visibleMetrics, setVisibleMetrics] = useState<string[]>(() => {
  const saved = localStorage.getItem('dashboard_visible_metrics');
  return saved
    ? JSON.parse(saved)  // Sin try-catch: puede lanzar SyntaxError
    : ['productos', 'pedidos', 'incidencias', 'stock', 'proveedores', 'notificaciones'];
});
```

#### Solución recomendada

```tsx
const [visibleMetrics, setVisibleMetrics] = useState<string[]>(() => {
  try {
    const saved = localStorage.getItem('dashboard_visible_metrics');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    localStorage.removeItem('dashboard_visible_metrics'); // Limpiar dato corrupto
  }
  return ['productos', 'pedidos', 'incidencias', 'stock', 'proveedores', 'notificaciones'];
});
```

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [AUTHD-010] Home.tsx: fetchDashboardStats sin AbortController en desmontaje

#### Severidad: Media
#### Categoría: Performance / Resiliencia
#### Descripción

La función `loadStats` no cancela peticiones en vuelo cuando el componente `Home` se desmonta (al navegar a otra sección). En React 19 con Strict Mode en desarrollo, el componente se monta dos veces, disparando dos peticiones en paralelo. En producción, si el usuario navega rápidamente, los setters de estado llamarán sobre un componente desmontado.

#### Evidencia

```tsx
// Home.tsx líneas 246-290
const loadStats = useCallback(async () => {
  setIsLoading(true);
  try {
    const data = await fetchDashboardStats(); // Sin signal de cancelación
    setStats(data);     // Puede ejecutarse tras desmontaje
    // ...
    const notifs = await fetchAppNotifications({ ... }); // Ídem
    setNotifications(notifs); // Ídem
  }
}, [...]);

useEffect(() => {
  loadStats(); // Sin return de cleanup
}, [loadStats]);
```

Nótese también que `authService.getCurrentUser()` SÍ tiene AbortController (líneas 124-145 de `auth.service.ts`), demostrando que el patrón se conoce pero no se aplica consistentemente en el dashboard.

#### Prioridad: Media
#### Riesgo de regresión: Medio

---

### [AUTHD-011] ResetPassword: setTimeout de navigate sin cleanup en desmontaje

#### Severidad: Baja
#### Categoría: Resiliencia
#### Descripción

En `ResetPassword.tsx`, tras un reset exitoso, se programa `navigate('/login')` con `setTimeout` de 4000ms sin limpieza si el componente se desmonta antes.

#### Evidencia

```tsx
// ResetPassword.tsx líneas 87-89
if (res.success) {
  setSuccessMsg(t('auth.resetPassword.exito'));
  setTimeout(() => navigate('/login'), 4000); // Sin cleanup
}
```

#### Impacto menor

React Router's `navigate` es seguro de llamar tras desmontaje en React Router 7, pero el patrón es incorrecto y puede causar navegaciones inesperadas si el usuario ya se fue manualmente.

#### Solución recomendada

```tsx
const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
useEffect(() => () => clearTimeout(timeoutRef.current), []);

// En handleSubmit:
timeoutRef.current = setTimeout(() => navigate('/login'), 4000);
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [AUTHD-012] refreshUser expuesto en AuthContextType sin el parámetro `options`

#### Severidad: Baja
#### Categoría: TypeScript
#### Descripción

La implementación real de `refreshUser` acepta `options?: { background?: boolean }`, pero el tipo `AuthContextType` en `sherlock-auth/types.ts` lo declara como `() => Promise<User | null>` sin parámetros.

#### Evidencia

```tsx
// sherlock-auth/types.ts línea 46
refreshUser: () => Promise<User | null>;  // Sin parámetro options

// provider.tsx línea 55
const refreshUser = React.useCallback(
  async (options?: { background?: boolean }) => { ... }
);
```

#### Impacto

Cualquier consumidor que intente llamar `refreshUser({ background: true })` recibirá un error de TypeScript, aunque funcione en runtime. El parámetro `background` controla si se muestra el spinner de loading global; sin él, todos los refreshes del exterior muestran un loading innecesario.

#### Solución recomendada

```tsx
// sherlock-auth/types.ts
refreshUser: (options?: { background?: boolean }) => Promise<User | null>;
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [AUTHD-013] jwtUtils.ts: utilidad de decodificación JWT es código muerto

#### Severidad: Baja
#### Categoría: Deuda Técnica
#### Descripción

El archivo `src/utils/auth/jwtUtils.ts` contiene `getJwtPayload` e `isJwtUsable` para decodificar tokens JWT desde JavaScript. Sin embargo, la arquitectura actual usa cookies httpOnly, por lo que el JWT nunca está accesible desde JS. Estas funciones no tienen uso en el codebase actual.

Si se usan en algún lugar no auditado, implicaría que el token JWT está siendo leído desde una fuente accesible a JS (localStorage, cookie no-httpOnly), lo que sería una regresión de seguridad.

#### Evidencia

```tsx
// jwtUtils.ts - decodifica tokens JWT desde strings accesibles a JS
export const getJwtPayload = (token: string | null): JwtPayload | null => { ... };
export const isJwtUsable = (token: string | null): boolean => { ... };
```

```tsx
// api.service.ts línea 617 - confirma que NO se usa el token desde JS
// Nota: Ya no se adjunta el token desde localStorage por seguridad (XSS).
// El backend utiliza la cookie 'access_token' (httpOnly)
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo (eliminación segura)

---

### [AUTHD-014] Import vacío de '@mui/material' en AppRouter.tsx

#### Severidad: Baja
#### Categoría: Código Muerto / TypeScript
#### Descripción

`AppRouter.tsx` contiene `import {} from '@mui/material'`, un import vacío sin propósito.

#### Evidencia

```tsx
// AppRouter.tsx línea 4
import {} from '@mui/material'; // Import completamente vacío
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [AUTHD-015] handleSaveQuickAction en Home.tsx no está memoizado con useCallback

#### Severidad: Baja
#### Categoría: Performance
#### Descripción

`handleSaveQuickAction` es una función asíncrona pasada como `onSubmit` a varios componentes modal. Al no estar envuelta en `useCallback`, se recrea en cada render, potencialmente causando re-renders de los modales lazy-loaded en cada actualización del estado padre.

#### Evidencia

```tsx
// Home.tsx línea 311
const handleSaveQuickAction = async (formData: QuickActionFormData) => {
  // No está envuelto en useCallback
  // Se recrea en cada render de Home
};
```

El mismo archivo ya usa `useCallback` correctamente en otros lugares (`loadStats`, `handleSavePedidoQuickAction`, `noOpDiscardDraft`), mostrando conocimiento del patrón.

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [AUTHD-016] Email almacenado en localStorage como `rememberedUser` - privacidad

#### Severidad: Media
#### Categoría: Seguridad / Privacidad
#### Descripción

La funcionalidad "Recuérdame" almacena el email del usuario en `localStorage`. Aunque esto es común en muchas aplicaciones, en un entorno educativo con alumnos menores de edad puede ser un problema de privacidad (RGPD, LOPDGDD). Además, `localStorage` es accesible desde cualquier script JS del mismo origen, lo que lo hace vulnerable a XSS dirigidos.

#### Evidencia

```tsx
// LoginForm.tsx líneas 95-98
if (rememberMe) {
  localStorage.setItem('rememberedUser', formData.email.trim());
} else {
  localStorage.removeItem('rememberedUser');
}
```

#### Impacto

- En caso de XSS (aunque actualmente no hay vulnerabilidades visibles), el email sería exfiltrable
- No se limpia al hacer logout
- En dispositivos compartidos (aulas), el email persiste entre sesiones

#### Solución recomendada

Usar `sessionStorage` en lugar de `localStorage`, o cifrar el valor almacenado. También limpiar `rememberedUser` durante el logout si no está activo.

#### Prioridad: Media
#### Riesgo de regresión: Bajo

---

### [AUTHD-017] Sin página 403 - redirección silenciosa a `/perfil`

#### Severidad: Baja
#### Categoría: UX / Routing
#### Descripción

Cuando un usuario autenticado intenta acceder a una ruta para la que no tiene permisos, `ProtectedRoute` lo redirige silenciosamente a `/perfil`. El usuario no recibe ninguna explicación de por qué fue redirigido.

#### Evidencia

```tsx
// ProtectedRoute.tsx líneas 27-38
const renderUnauthorizedRedirect = () => {
  if (location.pathname === AUTHORIZED_FALLBACK_PATH) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return (
    <Navigate
      to={AUTHORIZED_FALLBACK_PATH}  // Silently to /perfil
      replace
      state={{ from: location }}
    />
  );
};
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [AUTHD-018] DashboardMetricCard: aria-label usa `String(ReactNode)` = "[object Object]"

#### Severidad: Baja
#### Categoría: Accesibilidad / UX
#### Descripción

`DashboardMetricCard` recibe `value: React.ReactNode` y usa `String(value)` en el `aria-label`. Cuando `value` es un elemento JSX (por ejemplo, el componente de skeleton durante loading), `String(<Component />)` produce `"[object Object]"`, creando un aria-label completamente inútil para lectores de pantalla.

#### Evidencia

```tsx
// DashboardMetricCard.tsx líneas 53-60
aria-label={
  isLoading
    ? t('dashboard.metricCard.loading', { titulo: title })
    : onClick
      ? t('dashboard.metricCard.clickable', {
          titulo: title,
          valor: String(value),  // React.ReactNode → "[object Object]" cuando es JSX
        })
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [AUTHD-019] Protección CSRF parcial - dependiente de cookie XSRF-TOKEN del backend

#### Severidad: Media
#### Categoría: Seguridad
#### Descripción

`api.service.ts` implementa protección CSRF leyendo `XSRF-TOKEN` de las cookies y enviándolo como `X-XSRF-TOKEN`. Sin embargo, esta cookie debe ser establecida por el backend para que la protección funcione. Si el backend no la establece, la cabecera nunca se envía y las peticiones de mutación (POST, PATCH, DELETE) son vulnerables a CSRF.

#### Evidencia

```tsx
// api.service.ts líneas 611-614
const csrfToken = getCookie('XSRF-TOKEN');
if (csrfToken) {
  headers.set('X-XSRF-TOKEN', csrfToken);
}
```

El patrón es correcto pero su efectividad depende enteramente del backend. En una arquitectura cookie-first con `credentials: 'include'`, CSRF es un riesgo real en peticiones de mutación.

#### Recomendación

Verificar en el backend NestJS que `CsrfModule` o equivalente está configurado para emitir la cookie `XSRF-TOKEN` en cada respuesta. Documentar el contrato explícitamente.

#### Prioridad: Media
#### Riesgo de regresión: N/A (afecta backend)

---

### [AUTHD-020] `sm_has_session` no se limpia en logout cuando el API call falla

#### Severidad: Baja
#### Categoría: Estado
#### Descripción

En `provider.tsx`, `localStorage.removeItem('sm_has_session')` se ejecuta ANTES de `await authService.logout()`. Esto es correcto. Sin embargo, si `clearPersistedSessionArtifacts` se llama sin limpiar `sm_has_session` (como ocurría en versiones anteriores), y luego la llamada al backend falla, el hint de sesión podría quedar en un estado inconsistente.

Con el código actual, `sm_has_session` SÍ se limpia en `logout()`. El riesgo existe en el handler `handleUnauthorized` del event bus, que llama `logout()` directamente y sí limpia `sm_has_session`. Parece correcto.

Hay, no obstante, una inconsistencia: `clearPersistedSessionArtifacts` limpia `user` y `token` (keys legadas que ya no se usan), pero no `sm_has_session`. Si alguien llama a esta función directamente creyendo que limpia todo el estado de sesión, `sm_has_session` quedaría.

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

### [AUTHD-021] Dashboard muestra botón "Reintentar" incluso en errores de permisos

#### Severidad: Baja
#### Categoría: UX
#### Descripción

Cuando el usuario no tiene permiso para ver el dashboard (`canViewDashboard = false`), `loadStats` establece `error = t('dashboard.errors.sinPermisos')`. El componente de error muestra un botón "Reintentar" que vuelve a llamar `loadStats()`. El usuario puede pulsar "Reintentar" indefinidamente obteniendo siempre el mismo mensaje de error, ya que los permisos no cambiarán sin un nuevo login.

#### Evidencia

```tsx
// Home.tsx líneas 390-403
{error && (
  <Alert
    severity="error"
    action={
      <Button color="inherit" size="small" onClick={loadStats}>
        {t('dashboard.retry')}  {/* Visible incluso en error de permisos */}
      </Button>
    }
  >
    {error}
  </Alert>
)}
```

```tsx
// Home.tsx líneas 247-252
if (!canViewDashboard) {
  setStats(null);
  setIsLoading(false);
  setError(t('dashboard.errors.sinPermisos')); // Usa el sistema de error genérico
  return;
}
```

#### Prioridad: Baja
#### Riesgo de regresión: Bajo

---

## Inconsistencias Frontend/Backend

### 1. Tipo `User` duplicado con diferencias en campos

El backend devuelve el usuario a través de `GET /usuarios/perfil` con campos como `roles` (array de objetos `{nombre: string}`), `role` (string legado) y `rol` (string). El frontend normaliza esto correctamente en `auth.service.ts` mediante `getRolPrincipal()`. Sin embargo, hay dos interfaces `User` en el frontend:

| Campo | `sherlock-auth/types.ts` | `auth.service.ts` |
|-------|--------------------------|-------------------|
| `permisos` | `string[]` (opcional) | `string[]` (requerido) |
| `idioma` | `'es' \| 'en'` (opcional) | `'es' \| 'en'` (requerido) |
| `slotId` | ✅ presente | ❌ ausente |
| `alumno` | ✅ presente (con slot) | ❌ ausente |
| `profesor` | ✅ presente (con slots) | ❌ ausente |
| `ubicaciones` | ❌ ausente | ✅ presente |
| `preferences` | ✅ presente | ✅ presente |

Los campos `alumno`, `profesor` y `slotId` están en el tipo de `sherlock-auth/types.ts` pero no los devuelve el endpoint `/usuarios/perfil` según la interfaz `CurrentUserResponse`. Si el backend no los envía, esos campos siempre serán `undefined`, haciendo que la interfaz sea engañosa.

### 2. El permiso `inventario:ver_alertas` no existe en PERMISSIONS

En `Home.tsx` línea 190:
```tsx
const canReviewInventoryNotifications = useAnyPermission([
  PERMISSIONS.inventario.listar,
  PERMISSIONS.inventario.ver,
  'inventario:ver_alertas',  // ← No existe en permissions.constants.ts
]);
```

El permiso `'inventario:ver_alertas'` se usa como string literal pero no está definido en `PERMISSIONS`. Si el backend lo emite, funcionará, pero si no, el check siempre será `false` para usuarios que solo tienen ese permiso. Debería añadirse al mapa de constantes o eliminarse.

### 3. `LoginRequest.email` vs. nombre de usuario

La interfaz `LoginRequest` tiene campo `email: string`, pero el formulario lo llama "Usuario o Email" y permite enviar un nombre de usuario. El backend recibe lo que sea en el campo `email` del DTO, que puede ser un username. Esto es confuso a nivel de tipos: el campo se llama `email` pero puede contener un username.

### 4. `changePassword` usa `PATCH /auth/change-password` 

La operación de cambio de contraseña usa HTTP `PATCH` en `auth.service.ts`. Si el backend espera `POST` para esta operación (que es más habitual en NestJS), habría un 404/405. Verificar que el backend define `@Patch('change-password')`.

---

## Riesgos Potenciales Futuros

### 1. Permisos sin caducidad en cliente
El sistema RBAC usa Redis con TTL de 300s en el backend, pero el frontend solo refresca permisos cada 5 minutos (el `setInterval` en `provider.tsx`) o en `visibilitychange`. Si un administrador revoca un permiso a un usuario activo, el usuario seguirá viéndolo hasta el próximo sync (máximo 5 min). Para operaciones críticas (como borrar inventario), esto puede ser insuficiente.

**Recomendación:** Evaluar WebSockets o Server-Sent Events para push de invalidación de permisos en tiempo real para roles administrativos.

### 2. Gestión de múltiples tabs
Si el usuario abre dos pestañas y hace logout en una, la otra sigue mostrando la aplicación (con `user` y `isAuthenticated=true`) hasta la próxima `visibilitychange`. El event bus es por-instancia (cada tab tiene su propio `AuthProvider`), por lo que el evento `UNAUTHORIZED` de una pestaña no llega a las demás.

**Recomendación:** Usar `BroadcastChannel` o el listener de `storage` para propagar eventos de auth entre pestañas.

### 3. `clearPersistedSessionArtifacts` limpia claves legadas
La función limpia `localStorage.user` y `localStorage.token`, que son artefactos de una implementación anterior con tokens en localStorage. Si en el futuro se hace rollback a esa arquitectura, estos keys no serán limpiados porque la función ya los elimina. Documentar que son legacy y evaluar su eliminación.

### 4. Ausencia de circuit breaker para `refreshUser`
Si el endpoint `/usuarios/perfil` devuelve errores 5xx de forma persistente, el `setInterval` de 5 minutos seguirá haciendo peticiones indefinidamente. No hay backoff exponencial ni circuit breaker para peticiones de sincronización de sesión.

---

## Deuda Técnica

| Ítem | Archivo | Descripción |
|------|---------|-------------|
| Import vacío | `AppRouter.tsx` | `import {} from '@mui/material'` sin uso |
| Código muerto | `jwtUtils.ts` | Funciones de decodificación JWT inaccesibles en arquitectura cookie-first |
| Keys legadas | `clearPersistedSessionArtifacts` | Limpia `localStorage.user` y `localStorage.token` que ya no se escriben |
| Documentación | `types.ts` dual | Dos interfaces `User` sin comentario explicando cuál usar en cada contexto |
| Memoización | `Home.tsx` | `handleSaveQuickAction` sin `useCallback` |
| Comentarios inútiles | Varios | Comentarios genéricos como "Ejecuta la lógica de operación" sin valor semántico (generados automáticamente) |
| `STRONG_PASSWORD_MESSAGE` | `ResetPassword.tsx` | Mensaje de validación hardcoded en inglés importado desde `passwordValidation`, no pasa por i18n |

---

## Conclusión

El frontend de SmartEconomat muestra un nivel de madurez técnica notable en su arquitectura de autenticación: la elección de cookies httpOnly elimina la clase de ataques XSS-to-token-theft que afectan a muchas SPAs, el sistema RBAC dual (array + Redux map) tiene una implementación cuidadosa, y la deduplicación de `refreshUser` con `refreshPromiseRef` es una solución elegante.

Los problemas identificados son principalmente de resiliencia y gestión de estado en casos límite (unmount durante animaciones, logout fallido, refreshes concurrentes). Ninguno representa una vulnerabilidad de seguridad explotable de forma trivial, pero los cuatro hallazgos de alta severidad deberían resolverse antes de cualquier aumento de carga de producción.

El orden de corrección recomendado:
1. **Inmediato:** AUTHD-003 (logout sin setUser(null)) y AUTHD-004 (logout silencioso)
2. **Sprint actual:** AUTHD-001 (setTimeout sin cleanup), AUTHD-008 (login con refreshUser fallido), AUTHD-005 (race condition dashboard)
3. **Próximo sprint:** AUTHD-007 (restore destination), AUTHD-006 (unificar sistemas de permisos), AUTHD-009 (JSON.parse), AUTHD-016 (email en localStorage)
4. **Backlog:** El resto de hallazgos de severidad baja y la deuda técnica
