# Handoff técnico — refactor de auth, permisos y sesión dinámica

## Objetivo de esta intervención

Esta iteración se centró en corregir el flujo de autenticación y permisos para:

1. reducir peticiones repetidas al backend,
2. evitar depender de `localStorage` como fuente de verdad de sesión o permisos,
3. consolidar un modelo `cookie-first` con validación real en backend,
4. mantener permisos dinámicos frontend/backend sin romper el routing protegido.

---

## Cambios implementados

### 1. Deducción y deduplicación del bootstrap de sesión

Se detectó que el frontend podía disparar varias veces `GET /usuarios/perfil` durante el arranque por combinación de:

- `AuthProvider`,
- `ProtectedRoute`,
- y llamadas manuales adicionales a `refreshUser()`.

Se corrigió introduciendo deduplicación en `AuthContext`, de forma que múltiples revalidaciones concurrentes comparten la misma promesa activa.

**Impacto esperado:** menos llamadas redundantes al backend y menos carga innecesaria en base de datos/cache de permisos.

---

### 2. Migración a modelo `cookie-first`

Se consolidó el modelo de sesión recomendado:

- backend emite cookie `httpOnly` `access_token`,
- frontend usa `credentials: 'include'`,
- la sesión autenticada vive en memoria React,
- la app se reconstruye consultando `/usuarios/perfil` al arrancar.

Esto reemplaza el enfoque anterior donde `token` y `user` persistidos en navegador participaban directamente en la lógica de sesión.

**Importante:**
`localStorage` ya no se usa como fuente de verdad para la sesión autenticada. Solo se mantiene `rememberedUser` para UX del login.

---

### 3. Logout real de extremo a extremo

Antes, el cierre de sesión era esencialmente local. Ahora existe un flujo completo:

- endpoint `POST /auth/logout`,
- limpieza de cookie desde backend,
- limpieza de estado en frontend,
- redirección limpia a login.

Esto evita sesiones “fantasma” cuando el navegador seguía enviando la cookie activa aunque el cliente hubiera limpiado solo memoria o almacenamiento local.

---

### 4. Routing protegido simplificado

`ProtectedRoute` y `PublicRoute` ya no dependen de token local ni de validación JWT en cliente para decidir navegación.

Ahora el criterio es:

- esperar a `isAuthResolved`,
- usar `isAuthenticated` + `isSessionVerified`,
- validar permiso requerido por ruta,
- redirigir solo cuando backend ya ha sido consultado.

**Beneficio:** se eliminan parpadeos, redirecciones prematuras y diferencias entre “sesión local” y “sesión real”.

---

### 5. Permisos dinámicos mantenidos y reforzados

No se cambió el modelo funcional de permisos, pero sí se reforzó su coherencia:

- backend sigue resolviendo permisos efectivos con `AuthPermissionsService`,
- frontend consume `user.permisos` solo después de `/usuarios/perfil`,
- cambios administrativos se reflejan al resincronizar sesión,
- se minimiza el riesgo de confiar en permisos manipulados en navegador.

---

## Archivos relevantes tocados

### Backend

- `backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts`
- `backend/smart-economat-backend/src/common/interceptors/cookie.interceptor.ts`
- `backend/smart-economat-backend/src/i18n/es/translation.json`
- `backend/smart-economat-backend/src/i18n/en/translation.json`

### Frontend

- `frontend/smart-economat-frontend/src/store/AuthContext.tsx`
- `frontend/smart-economat-frontend/src/store/auth.types.ts`
- `frontend/smart-economat-frontend/src/routes/ProtectedRoute.tsx`
- `frontend/smart-economat-frontend/src/routes/PublicRoute.tsx`
- `frontend/smart-economat-frontend/src/services/api.service.ts`
- `frontend/smart-economat-frontend/src/services/authService.ts`
- `frontend/smart-economat-frontend/src/services/usuarioService.ts`
- `frontend/smart-economat-frontend/src/features/auth/Login.tsx`
- `frontend/smart-economat-frontend/src/features/auth/components/LoginForm.tsx`
- `frontend/smart-economat-frontend/src/pages/Perfil.tsx`

### Tests frontend ajustados

- `frontend/smart-economat-frontend/src/store/AuthContext.test.tsx`
- `frontend/smart-economat-frontend/src/routes/ProtectedRoute.test.tsx`
- `frontend/smart-economat-frontend/src/services/pedido.service.test.ts`

---

## Estado final tras la intervención

### Qué ya está resuelto

- El frontend compila con `npx tsc -b`.
- Ya no quedan tests frontend TypeScript usando `localStorage.token` para auth runtime.
- El flujo principal de sesión usa cookie `httpOnly` + verificación backend.
- El logout limpia también la cookie en servidor.
- El bootstrap de sesión ya no duplica llamadas concurrentes de forma innecesaria.

### Qué sigue pendiente o bloqueado externamente

- `vitest` no se pudo ejecutar en este entorno por un problema local preexistente con dependencia opcional de Rollup (`@rollup/rollup-darwin-x64`).
- El `build` del backend vía `nest build` está bloqueado por resolución local de `@swc/cli` / `@swc/core`.
- Existen errores de tests backend preexistentes no relacionados con este refactor.

---

## Recomendaciones para el equipo

1. **No reintroducir** `token` o `user` en `localStorage` como fuente de sesión.
2. **Mantener** `GET /usuarios/perfil` como endpoint canónico para bootstrap de auth frontend.
3. **Usar** `baseFetch` para cualquier nuevo servicio HTTP, evitando `fetch` directo salvo necesidad justificada.
4. **Centralizar** cualquier futura invalidación de sesión en `AuthContext` + `POST /auth/logout`.
5. **Documentar** cualquier nuevo guard o cambio en permisos también en `wiki/security/permisos-dinamicos.md`.

---

## Resumen ejecutivo para compañeros

La aplicación ya no “confía” en el navegador para decidir si un usuario sigue autenticado o qué permisos tiene. Esa decisión la toma el backend en cada arranque de sesión a través de la cookie segura y el endpoint `/usuarios/perfil`. Con esto se gana coherencia, seguridad y menos ruido de peticiones repetidas.
