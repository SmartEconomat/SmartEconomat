# Catálogo de permisos

Documento de referencia exhaustivo del catálogo de permisos de SmartEconomat.

La fuente de verdad de este documento es el backend:

- `backend/smart-economat-backend/src/common/constants/permissions.constants.ts`
- `backend/smart-economat-backend/src/common/constants/role-permission-sets.constants.ts`
- `backend/smart-economat-backend/src/migrations/1775050000000-SherlockAuthMigration.ts`

Si este documento y el código discrepan, prevalece el código.

## Roles de sistema por defecto

Los valores canónicos de rol son:

- `SUPER_ADMIN`
- `ADMIN`
- `PROFESOR`
- `ALUMNO`

No usar `ADMINISTRADOR` como nombre técnico actual del rol. Ese nombre puede aparecer en documentación o aliases legacy, pero no es el valor canónico vigente.

| Rol | Permisos por defecto | Notas |
| --- | ---: | --- |
| `SUPER_ADMIN` | 88/88 | Tiene todo el catálogo activo por defecto. |
| `ADMIN` | 84/88 | Tiene todos los permisos salvo 4 operaciones sensibles de administración de roles y permisos. |
| `PROFESOR` | 39/88 | Plantilla operativa para docencia, pedidos, recepciones, incidencias, recetas e inventario. |
| `ALUMNO` | 11/88 | Plantilla limitada a consulta y a cambio de profesor. |

Permisos no incluidos por defecto en `ADMIN`:

- `roles:crear`
- `roles:eliminar`
- `permisos:crear`
- `permisos:eliminar`

## Cómo leer este catálogo

- La tabla documenta la asignación por defecto de las plantillas de sistema, no los permisos efectivos finales de un usuario concreto.
- Los permisos efectivos pueden cambiar por permisos adicionales, permisos excluidos y roles persistentes asignados al usuario.
- `ADMIN` y `SUPER_ADMIN` son roles elevados en la capa Sherlock. Aun así, esta referencia documenta la plantilla base configurada en seed y migración.
- Todas las filas corresponden a permisos definidos en el catálogo centralizado del backend. El total actual es de 88 permisos.

## Resumen por módulo

| Módulo | Total |
| --- | ---: |
| `usuarios` | 7 |
| `productos` | 6 |
| `proveedores` | 4 |
| `pedidos` | 7 |
| `recepciones` | 5 |
| `incidencias` | 6 |
| `albaranes` | 5 |
| `distribuciones` | 5 |
| `ubicaciones` | 6 |
| `inventario` | 6 |
| `recetas` | 7 |
| `merma` | 4 |
| `movimientos` | 1 |
| `archivos` | 4 |
| `profesor` | 3 |
| `alumno` | 1 |
| `dashboard` | 1 |
| `roles` | 5 |
| `permisos` | 5 |

## Permisos por módulo

### Usuarios

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `usuarios:listar` | Listar usuarios en vistas administrativas. | Sí | Sí | No | No | Uso de backoffice. |
| `usuarios:ver` | Ver el detalle de un usuario. | Sí | Sí | No | No | Uso de backoffice. |
| `usuarios:crear` | Crear usuarios desde flujos administrativos. | Sí | Sí | No | No | Uso de backoffice. |
| `usuarios:editar` | Editar datos de usuarios existentes. | Sí | Sí | No | No | Uso de backoffice. |
| `usuarios:eliminar` | Eliminar o dar de baja usuarios. | Sí | Sí | No | No | Uso de backoffice. |
| `usuarios:activar_desactivar` | Activar o desactivar cuentas de usuario. | Sí | Sí | No | No | Control operativo de acceso. |
| `usuarios:resetear_password` | Forzar reseteo o regeneración de contraseña. | Sí | Sí | No | No | Soporte administrativo. |

### Productos

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `productos:listar` | Listar productos del catálogo. | Sí | Sí | Sí | Sí | Acceso base de consulta. |
| `productos:ver` | Ver detalle de producto. | Sí | Sí | Sí | Sí | Acceso base de consulta. |
| `productos:crear` | Crear nuevos productos. | Sí | Sí | No | No | Gestión de catálogo. |
| `productos:editar` | Editar productos existentes. | Sí | Sí | No | No | Gestión de catálogo. |
| `productos:eliminar` | Eliminar productos. | Sí | Sí | No | No | Gestión de catálogo. |
| `productos:generar_ean13` | Generar códigos EAN-13 para productos. | Sí | Sí | No | No | Operación especializada de catálogo. |

### Proveedores

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `proveedores:listar` | Listar proveedores. | Sí | Sí | Sí | Sí | Consulta operativa. |
| `proveedores:crear` | Crear proveedores. | Sí | Sí | No | No | Gestión administrativa. |
| `proveedores:editar` | Editar proveedores. | Sí | Sí | No | No | Gestión administrativa. |
| `proveedores:eliminar` | Eliminar proveedores. | Sí | Sí | No | No | Gestión administrativa. |

### Pedidos

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `pedidos:listar` | Listar pedidos. | Sí | Sí | Sí | No | Operativa de compras. |
| `pedidos:ver` | Ver detalle de pedido. | Sí | Sí | Sí | No | Operativa de compras. |
| `pedidos:crear` | Crear pedidos. | Sí | Sí | Sí | No | Operativa de compras. |
| `pedidos:editar` | Editar pedidos. | Sí | Sí | Sí | No | Operativa de compras. |
| `pedidos:cancelar` | Cancelar pedidos. | Sí | Sí | Sí | No | Operativa de compras. |
| `pedidos:restaurar` | Restaurar pedidos previamente revertidos o anulados. | Sí | Sí | No | No | Capacidad administrativa. |
| `pedidos:eliminar` | Eliminar pedidos. | Sí | Sí | No | No | Capacidad administrativa. |

### Recepciones

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `recepciones:listar` | Listar recepciones. | Sí | Sí | Sí | No | Operativa de entrada de mercancía. |
| `recepciones:ver` | Ver detalle de recepción. | Sí | Sí | Sí | No | Operativa de entrada de mercancía. |
| `recepciones:crear` | Crear recepciones. | Sí | Sí | No | No | Capacidad administrativa. |
| `recepciones:editar` | Editar recepciones. | Sí | Sí | Sí | No | Operativa de recepción. |
| `recepciones:eliminar` | Eliminar recepciones. | Sí | Sí | No | No | Capacidad administrativa. |

### Incidencias

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `incidencias:listar` | Listar incidencias. | Sí | Sí | Sí | No | Operativa de recepción y seguimiento. |
| `incidencias:ver` | Ver detalle de incidencia. | Sí | Sí | Sí | No | Operativa de recepción y seguimiento. |
| `incidencias:crear` | Crear incidencias. | Sí | Sí | Sí | No | Operativa de recepción y seguimiento. |
| `incidencias:editar` | Editar incidencias. | Sí | Sí | Sí | No | Operativa de recepción y seguimiento. |
| `incidencias:eliminar` | Eliminar incidencias. | Sí | Sí | No | No | Capacidad administrativa. |
| `incidencias:resolver` | Resolver incidencias. | Sí | Sí | Sí | No | Cierre operativo. |

### Albaranes

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `albaranes:listar` | Listar albaranes. | Sí | Sí | Sí | No | Operativa documental. |
| `albaranes:ver` | Ver detalle de albarán. | Sí | Sí | Sí | No | Operativa documental. |
| `albaranes:crear` | Crear albaranes. | Sí | Sí | Sí | No | Operativa documental. |
| `albaranes:editar` | Editar albaranes. | Sí | Sí | Sí | No | Operativa documental. |
| `albaranes:eliminar` | Eliminar albaranes. | Sí | Sí | No | No | Capacidad administrativa. |

### Distribuciones

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `distribuciones:listar` | Listar distribuciones. | Sí | Sí | No | No | Módulo reservado a perfiles administrativos. |
| `distribuciones:ver` | Ver detalle de distribución. | Sí | Sí | No | No | Módulo reservado a perfiles administrativos. |
| `distribuciones:crear` | Crear distribuciones. | Sí | Sí | No | No | Módulo reservado a perfiles administrativos. |
| `distribuciones:confirmar` | Confirmar distribuciones. | Sí | Sí | No | No | Módulo reservado a perfiles administrativos. |
| `distribuciones:cancelar` | Cancelar distribuciones. | Sí | Sí | No | No | Módulo reservado a perfiles administrativos. |

### Ubicaciones

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `ubicaciones:listar` | Listar ubicaciones. | Sí | Sí | Sí | No | Consulta operativa de almacén. |
| `ubicaciones:ver` | Ver detalle de ubicación. | Sí | Sí | Sí | No | Consulta operativa de almacén. |
| `ubicaciones:crear` | Crear ubicaciones. | Sí | Sí | No | No | Gestión administrativa. |
| `ubicaciones:editar` | Editar ubicaciones. | Sí | Sí | No | No | Gestión administrativa. |
| `ubicaciones:eliminar` | Eliminar ubicaciones. | Sí | Sí | No | No | Gestión administrativa. |
| `ubicaciones:restaurar` | Restaurar ubicaciones eliminadas lógicamente. | Sí | Sí | No | No | Operación administrativa avanzada. |

### Inventario

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `inventario:listar` | Listar inventario. | Sí | Sí | Sí | Sí | Consulta base de stock. |
| `inventario:ver` | Ver detalle de inventario. | Sí | Sí | Sí | Sí | Consulta base de stock. |
| `inventario:crear` | Crear registros de inventario. | Sí | Sí | No | No | Gestión administrativa. |
| `inventario:editar` | Editar registros de inventario. | Sí | Sí | No | No | Gestión administrativa. |
| `inventario:eliminar` | Eliminar registros de inventario. | Sí | Sí | No | No | Gestión administrativa. |
| `inventario:ajustar_stock` | Ajustar stock manualmente. | Sí | Sí | Sí | No | Operación sensible de almacén. |

### Recetas

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `recetas:listar` | Listar recetas. | Sí | Sí | Sí | Sí | Consulta de producción. |
| `recetas:ver` | Ver detalle de receta. | Sí | Sí | Sí | Sí | Consulta de producción. |
| `recetas:crear` | Crear recetas. | Sí | Sí | No | No | Gestión administrativa o de cocina avanzada. |
| `recetas:editar` | Editar recetas. | Sí | Sí | No | No | Gestión administrativa o de cocina avanzada. |
| `recetas:eliminar` | Eliminar recetas. | Sí | Sí | No | No | Gestión administrativa o de cocina avanzada. |
| `recetas:duplicar` | Duplicar recetas existentes. | Sí | Sí | No | No | Operación avanzada de catálogo culinario. |
| `recetas:cocinar` | Ejecutar flujos de cocina o producción asociados a recetas. | Sí | Sí | Sí | No | Operativa de producción. |

### Merma

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `merma:listar` | Listar registros de merma. | Sí | Sí | Sí | Sí | Consulta de pérdidas. |
| `merma:ver` | Ver detalle de merma. | Sí | Sí | Sí | Sí | Consulta de pérdidas. |
| `merma:crear` | Registrar mermas. | Sí | Sí | Sí | No | Operativa de inventario y producción. |
| `merma:stats` | Consultar estadísticas de merma. | Sí | Sí | Sí | No | Métricas operativas. |

### Movimientos

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `movimientos:listar` | Listar movimientos de stock. | Sí | Sí | No | No | Consulta administrativa y de auditoría. |

### Archivos

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `archivos:listar` | Listar archivos adjuntos o documentos. | Sí | Sí | Sí | No | Soporte documental. |
| `archivos:ver` | Ver o descargar archivos. | Sí | Sí | Sí | No | Soporte documental. |
| `archivos:subir` | Subir archivos. | Sí | Sí | Sí | No | Soporte documental. |
| `archivos:eliminar` | Eliminar archivos. | Sí | Sí | No | No | Operación administrativa. |

### Profesor

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `profesor:gestionar_slots` | Crear, editar y gestionar slots de profesor. | Sí | Sí | Sí | No | Núcleo del módulo educativo docente. |
| `profesor:gestionar_alumnos` | Gestionar alumnos dentro del ámbito docente. | Sí | Sí | Sí | No | Núcleo del módulo educativo docente. |
| `profesor:ver_alumnos` | Ver alumnos asociados al ámbito docente. | Sí | Sí | Sí | No | Núcleo del módulo educativo docente. |

### Alumno

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `alumno:cambiar_profesor` | Solicitar o ejecutar el cambio de profesor. | Sí | Sí | No | Sí | Permiso operativo del flujo educativo de alumno. |

### Dashboard

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `dashboard:ver_estadisticas` | Ver estadísticas del dashboard. | Sí | Sí | Sí | Sí | Permiso de visualización transversal. |

### Roles

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `roles:listar` | Listar roles. | Sí | Sí | No | No | Administración de seguridad. |
| `roles:ver` | Ver detalle de rol. | Sí | Sí | No | No | Administración de seguridad. |
| `roles:crear` | Crear nuevos roles. | Sí | No | No | No | Restringido por defecto fuera de `SUPER_ADMIN`. |
| `roles:editar` | Editar roles existentes. | Sí | Sí | No | No | Administración de seguridad. |
| `roles:eliminar` | Eliminar roles. | Sí | No | No | No | Restringido por defecto fuera de `SUPER_ADMIN`. |

### Permisos

| Código | Función | `SUPER_ADMIN` | `ADMIN` | `PROFESOR` | `ALUMNO` | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| `permisos:listar` | Listar permisos del sistema. | Sí | Sí | No | No | Administración de seguridad. |
| `permisos:ver` | Ver detalle de permiso. | Sí | Sí | No | No | Administración de seguridad. |
| `permisos:crear` | Crear permisos nuevos. | Sí | No | No | No | Restringido por defecto fuera de `SUPER_ADMIN`. |
| `permisos:editar` | Editar permisos existentes. | Sí | Sí | No | No | Administración de seguridad. |
| `permisos:eliminar` | Eliminar permisos. | Sí | No | No | No | Restringido por defecto fuera de `SUPER_ADMIN`. |

## Notas de mantenimiento

- Este catálogo debe actualizarse cada vez que cambie `PERMISSIONS`, `ADMIN_RESTRICTED_PERMISSION_CODES`, `PROFESOR_PERMISSION_CODES` o `ALUMNO_PERMISSION_CODES` en backend.
- Si se añaden permisos nuevos y no se actualiza este fichero, la wiki quedará desalineada respecto al contrato real del sistema.
- Para la semántica técnica de guards, decorators y bypass de roles elevados, ver [rbac.md](rbac.md) y [permisos-dinamicos.md](permisos-dinamicos.md).