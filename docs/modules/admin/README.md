# Módulo de Administración

## Propósito

El módulo `admin` concentra operaciones de gobierno del sistema que no pertenecen al CRUD ordinario de usuarios. Está pensado para acciones privilegiadas sobre cuentas, roles efectivos y flujos administrativos de alto impacto.

## Responsabilidad funcional

Este módulo cubre:

- consulta de roles y permisos disponibles en contexto administrativo;
- alta administrativa de profesor;
- activación o desactivación de cuentas;
- cambio de rol con ajuste de permisos adicionales y excluidos;
- reseteo forzado de contraseña de otros usuarios.

## Qué no hace este módulo

- No sustituye el CRUD general de `usuario`.
- No sustituye la autenticación del módulo `auth`.
- No define por sí solo todo el catálogo RBAC; coopera con `roles`, `permisos` y `plantillas-roles`.

## Controller principal

- `admin.controller.ts`

## Relación con otros módulos

- `usuario`: el módulo `admin` actúa sobre cuentas existentes o crea nuevas cuentas en contextos privilegiados.
- `roles`, `permisos`, `plantillas-roles`: el gobierno administrativo usa esos catálogos y estructuras.
- `profesor`: el alta administrativa de profesor es un caso de orquestación entre dominios.

## Contrato HTTP relacionado

La referencia detallada está en `wiki/reference/api/usuarios-admin-y-seguridad.md`.

Rutas principales:

- `GET /admin/roles`
- `GET /admin/permissions`
- `POST /admin/profesores`
- `PATCH /admin/users/:id/role`
- `PATCH /admin/users/:id/activate`
- `POST /admin/users/:id/force-reset`

## Consideraciones de diseño

- Estas rutas representan acciones de gobierno y seguridad, no operaciones de uso ordinario.
- El frontend debe volver a hidratar sesión o perfil cuando un cambio administrativo afecte a permisos del usuario actual.
- La distinción entre `admin` y `usuario` ayuda a separar edición de perfil de acciones privilegiadas.

## Documentos relacionados

- `wiki/reference/api/usuarios-admin-y-seguridad.md`
- `wiki/security/roles-y-permisos.md`
- `wiki/security/permisos-dinamicos.md`
