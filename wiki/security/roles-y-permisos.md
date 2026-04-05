# Roles y permisos

Este documento resume la vista funcional de acceso del sistema. La definición técnica exacta de guards, decoradores y resolución de permisos está en [rbac.md](rbac.md).

Para el inventario completo de permisos, su función concreta y los roles que los traen por defecto, ver [catalogo-permisos.md](catalogo-permisos.md).

## Roles principales

| Rol | Uso principal | Observaciones |
| --- | --- | --- |
| `SUPER_ADMIN` | Operación total y mantenimiento del sistema | Rol elevado |
| `ADMIN` | Gestión administrativa, usuarios y configuración operativa | Rol elevado |
| `PROFESOR` | Operativa diaria, producción, pedidos y gestión de alumnos | Rol no elevado |
| `ALUMNO` | Consulta y acciones educativas limitadas | Rol no elevado |

En UI pueden mostrarse etiquetas como "Administrador", pero el valor técnico de rol actual es `ADMIN`.

El catálogo actual incluye 88 permisos definidos en backend.

## Qué significa "rol elevado"

Los roles `ADMIN` y `SUPER_ADMIN` pasan automáticamente las comprobaciones de permisos granulares del sistema Sherlock. Aun así, algunos endpoints siguen exigiendo explícitamente un rol concreto con `@Roles(...)`.

## Capacidades por perfil

| Área | SUPER_ADMIN | ADMIN | PROFESOR | ALUMNO |
| --- | --- | --- | --- | --- |
| Usuarios y activaciones | Total | Total | Solo alumnos bajo su ámbito | No |
| Roles y permisos | Total | Gestión operativa y asignación | No | No |
| Productos y proveedores | Total | Total | Operación habitual | Consulta limitada según permisos |
| Inventario y movimientos | Total | Total | Operación habitual | Consulta limitada |
| Pedidos, recepciones e incidencias | Total | Total | Operación habitual | No |
| Recetas y producción | Total | Total | Operación habitual | Consulta o acceso muy limitado |
| Dashboard y reportes | Total | Total | Según permisos | Según permisos |
| Sistema educativo | Total | Soporte administrativo | Gestión de slots y alumnos | Registro, perfil y acciones limitadas |

## Reglas prácticas

- El rol abre la puerta general del ámbito funcional.
- Los permisos refinan la capacidad real de cada usuario.
- Los permisos adicionales y excluidos permiten personalizar el comportamiento sin cambiar el rol principal.
- Los alumnos no deben recibir permisos operativos de backoffice salvo necesidad muy justificada.

## Casos típicos

- Un `ADMIN` puede gestionar usuarios, activar profesores y modificar permisos individuales.
- Un `PROFESOR` puede gestionar sus slots, activar alumnos y operar módulos de negocio según sus permisos efectivos.
- Un `ALUMNO` suele consumir vistas de consulta y flujos acotados del sistema educativo.

## Relacionado

- [Permisos dinámicos](permisos-dinamicos.md)
- [RBAC técnico](rbac.md)
- [Gestión de usuarios en frontend](../frontend/gestion-usuarios.md)