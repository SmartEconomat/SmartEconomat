# Hooks de permisos en frontend

Los hooks de permisos encapsulan la lógica de visibilidad y acceso del cliente. No sustituyen la autorización del backend, pero mantienen la UI alineada con la sesión real.

## Ubicación real

- Reexport público: `src/store/auth.hooks.ts`
- Implementación: `src/sherlock-auth/hooks.ts`
- Utilidades auxiliares: `src/sherlock-auth/permissions.ts`

## Hooks disponibles

## `usePermission`

```ts
const allowed = usePermission('productos:editar');
const allowedAll = usePermission(['usuarios:editar', 'usuarios:listar']);
```

Comportamiento:

- si recibe un string, comprueba ese permiso
- si recibe un array, aplica lógica AND
- si el permiso es `undefined` o el array está vacío, devuelve `true`
- si el usuario tiene rol elevado (`ADMIN` o `SUPER_ADMIN`), devuelve `true`

## `useAnyPermission`

```ts
const canAccess = useAnyPermission([
  'usuarios:listar',
  'profesor:gestionar_slots',
]);
```

Comportamiento:

- aplica lógica OR sobre el array recibido
- para roles elevados también devuelve `true`

## Origen de los permisos

El cliente no recalcula permisos por su cuenta. El flujo real es:

1. `AuthContext` verifica la sesión con `GET /api/v1/usuarios/perfil`
2. el backend devuelve el usuario con `permisos`
3. la store genera un mapa `{ permiso: true }`
4. los hooks consumen ese mapa sin lanzar fetches adicionales

## Roles elevados

El frontend replica la misma noción de roles elevados que el backend Sherlock:

- `ADMIN`
- `SUPER_ADMIN`

Esto evita inconsistencias entre la visibilidad de UI y el acceso real a rutas protegidas por permisos.

## Buenas prácticas

- Usar permisos, no nombres de rol, para mostrar u ocultar acciones puntuales.
- Usar `useAnyPermission` cuando una pantalla admita varios permisos equivalentes.
- Llamar a `refreshUser()` si el usuario actual cambia de rol o permisos durante la sesión.
- No asumir que ocultar un botón protege el endpoint.

## Relacionado

- [RBAC técnico](../security/rbac.md)
- [Gestión de usuarios](gestion-usuarios.md)