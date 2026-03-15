# Endpoints del backend NO usados por el frontend

Prefijo global: `/api/v1`

Listado de endpoints del backend que no se detectaron como llamados explícitamente desde el frontend. Para cada endpoint se incluye método, ruta completa y una breve descripción basada en el código del controlador y anotaciones `@ApiOperation` / nombres de DTO.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/v1/usuarios | Crear un usuario genérico en el sistema (admin/gestión de usuarios). Usa `CreateUsuarioDto`. Requiere permisos `usuarios:crear`. |
| POST | /api/v1/usuarios/admin | Crear un usuario con privilegios de administrador (`AdminCreateUsuarioDto`). Requiere rol administrador. |
| GET | /api/v1/usuarios | Listar usuarios con paginación y campos ordenables. Requiere permiso `usuarios:listar`. |
| GET | /api/v1/usuarios/:id | Obtener usuario por ID. Requiere permiso `usuarios:ver`. |
| PATCH | /api/v1/usuarios/:id | Actualizar usuario por ID (`UpdateUsuarioDto`). Requiere permiso `usuarios:editar`. |
| PATCH | /api/v1/usuarios/:id/admin | Actualizar datos administrativos de un usuario (`AdminUpdateUsuarioDto`). Requiere rol administrador. |
| PATCH | /api/v1/usuarios/:id/activar | Activar/desactivar usuario (actualiza estado). Requiere permiso `usuarios:editar`. |
| PATCH | /api/v1/usuarios/:id/rol | Cambiar rol de un usuario (`UpdateUsuarioRolDto`). Requiere permiso `usuarios:editar`. |
| PATCH | /api/v1/usuarios/:id/password | Reset de contraseña para un usuario (`ResetPasswordDto`). Requiere permiso `usuarios:editar`. |
| DELETE | /api/v1/usuarios/:id | Eliminar usuario (soft-delete). Requiere permiso `usuarios:eliminar`. |
| POST | /api/v1/usuarios/:id/permisos-adicionales/:permisoId | Añadir permiso adicional a usuario. Requiere permiso `usuarios:editar`. |
| DELETE | /api/v1/usuarios/:id/permisos-adicionales/:permisoId | Quitar permiso adicional a usuario. Requiere permiso `usuarios:editar`. |
| POST | /api/v1/usuarios/:id/permisos-excluidos/:permisoId | Añadir permiso excluido a usuario. Requiere permiso `usuarios:editar`. |
| DELETE | /api/v1/usuarios/:id/permisos-excluidos/:permisoId | Quitar permiso excluido a usuario. Requiere permiso `usuarios:editar`. |

| POST | /api/v1/preparaciones | Crear una preparación (`CreatePreparacionDto`). Requiere JWT. |
| GET | /api/v1/preparaciones | Listar preparaciones. Requiere JWT. |
| GET | /api/v1/preparaciones/:uuid | Obtener una preparación por UUID. |
| PATCH | /api/v1/preparaciones/:uuid | Actualizar una preparación (`UpdatePreparacionDto`). |
| DELETE | /api/v1/preparaciones/:uuid | Eliminar una preparación. |
| POST | /api/v1/preparaciones/:uuid/ejecutar | Ejecutar una preparación concreta (body con `cantidad`). Llama a `ejecutarPreparacion`. |

| POST | /api/v1/produccion/ejecutar | Ejecutar producción de receta (crea lote). Usa `EjecutarProduccionDto`. Requiere permiso `recetas:cocinar`. |
| GET | /api/v1/produccion | Listar lotes de producción (paginado). Requiere `recetas:listar`. |

| POST | /api/v1/recetas/duplicate | Duplicar una receta (`DuplicateRecetaDto`). Requiere `recetas:duplicar`. |
| GET | /api/v1/recetas/:id | Obtener receta por ID. Requiere `recetas:ver`. |
| GET | /api/v1/recetas/:id/detalle | Obtener detalle de la receta (ingredientes/detalles). Requiere `recetas:ver`. |
| GET | /api/v1/recetas/:id/escandallo | Calcular coste/escandallo de receta. Requiere `recetas:ver`. |
| POST | /api/v1/recetas/:id/cocinar | Acción para cocinar una receta (body `CocinarRecetaDto`). Requiere `recetas:cocinar`. |
| POST | /api/v1/recetas/:id/recalcular-costes | Recalcula y guarda costes estimados de la receta; rol administrador o profesor. |
| DELETE | /api/v1/recetas/:id | Eliminar receta por ID. Requiere `recetas:eliminar`. |

| GET | /api/v1/inventario/stock | Consultas de stock consolidadas / por ubicación (`InventoryQueryDto`). Requiere `inventario:listar`. |
| POST | /api/v1/inventario/ajustes-manuales | Registrar ajuste manual de stock con auditoría (`CreateMovimientoManualDto`). Requiere `inventario:ajustar_stock`. |
| GET | /api/v1/inventario/:id | Obtener item de inventario por ID. Requiere `inventario:ver`. |
| DELETE | /api/v1/inventario/:id | Eliminar inventario (soft). Requiere `inventario:eliminar`. |

| GET | /api/v1/alertas/caducidad | Obtener alertas de caducidad (inventario). Requiere `inventario:ver`. |
| GET | /api/v1/alertas/stock | Obtener alertas de stock bajo. Requiere `inventario:ver`. |

| POST | /api/v1/ubicacion/:id/restore | Restaurar ubicación eliminada (`restore`). Requiere `ubicaciones:restaurar`. |

| DELETE | /api/v1/proveedor/:id | Eliminar proveedor (soft). Requiere rol administrador. |

| POST | /api/v1/albaranes | Crear albarán. Requiere `albaranes:crear`. |
| GET | /api/v1/albaranes | Listar albaranes (paginado). Requiere `albaranes:listar`. |
| GET | /api/v1/albaranes/:id | Obtener albarán por ID. |
| PATCH | /api/v1/albaranes/:id | Actualizar albarán. |
| DELETE | /api/v1/albaranes/:id | Eliminar albarán. |

| POST | /api/v1/incidencias | Crear incidencia (`CreateIncidenciaDto`). Requiere `incidencias:crear`. |
| GET | /api/v1/incidencias/:id | Obtener incidencia por ID. Requiere `incidencias:ver`. |
| PATCH | /api/v1/incidencias/:id | Actualizar incidencia (`UpdateIncidenciaDto`). Requiere `incidencias:editar`. |
| POST | /api/v1/incidencias/reportar | Reportar incidencia vinculada a una recepción (`ReportIncidenciaDto`). Requiere `incidencias:crear`. |
| POST | /api/v1/incidencias/:id/resolver | Resolver incidencia de forma transaccional (`ResolveIncidenciaDto`). Requiere `incidencias:resolver`. |

| POST | /api/v1/recepcion-productos | Crear producto en recepción (`CreateRecepcionProductoDto`). Requiere `recepciones:editar`. |
| GET | /api/v1/recepcion-productos | Listar productos de recepciones. |
| GET | /api/v1/recepcion-productos/:id | Obtener producto de recepción por ID. |
| PATCH | /api/v1/recepcion-productos/:id | Actualizar producto de recepción. |
| DELETE | /api/v1/recepcion-productos/:id | Eliminar producto de recepción. |

| POST | /api/v1/incidencias-resueltas | Crear incidencia resuelta (registro). |
| GET | /api/v1/incidencias-resueltas | Listar incidencias resueltas. |
| GET | /api/v1/incidencias-resueltas/:id | Obtener incidencia resuelta por ID. |
| PATCH | /api/v1/incidencias-resueltas/:id | Actualizar incidencia resuelta. |
| DELETE | /api/v1/incidencias-resueltas/:id | Eliminar incidencia resuelta. |

| GET | /api/v1/recepcion/reporte-pdf | Generar y descargar reporte PDF de recepciones; devuelve `application/pdf`. Requiere `recepciones:listar`. |

| POST | /api/v1/merma | Registrar merma y descontar stock (`CreateMermaDto`). Requiere `merma:crear`. |
| GET | /api/v1/merma/stats | Estadísticas de merma por motivo/producto. Requiere `merma:stats`. |
| GET | /api/v1/merma | Listar mermas. |
| GET | /api/v1/merma/:id | Obtener merma por ID. |

| POST | /api/v1/pedidos/from-recipes | Generar pedido a partir de recetas (`GeneratePedidoFromRecetasDto`). Requiere `pedidos:crear`. |
| PATCH | /api/v1/pedidos/:id/fecha-entrega | Actualizar fecha de entrega de pedido. Requiere `pedidos:editar`. |

| PATCH | /api/v1/alumnos/change-profesor | Cambiar profesor de alumno (body `ChangeProfesorDto`). Requiere `alumno:cambiar_profesor`. |

| POST | /api/v1/admin/profesores | Crear profesor desde panel admin (`CreateProfesorDto`). Requiere `usuarios:crear`. |
| PATCH | /api/v1/admin/users/:id/activate | Activar usuario desde admin. Requiere `usuarios:activar_desactivar`. |
| POST | /api/v1/admin/users/:id/force-reset | Forzar restablecimiento de contraseña. Requiere `usuarios:resetear_password`. |

| GET | /api/v1/export/productos/xlsx | Exportar productos a XLSX (stream). Requiere roles Admin/Profesor. |
| GET | /api/v1/export/pedidos/xlsx | Exportar pedidos a XLSX. |
| GET | /api/v1/export/proveedores/xlsx | Exportar proveedores a XLSX. |
| GET | /api/v1/export/albaranes/xlsx | Exportar albaranes a XLSX. |
| GET | /api/v1/export/incidencias/xlsx | Exportar incidencias a XLSX. |
| GET | /api/v1/export/inventario/xlsx | Exportar inventario a XLSX. |
| GET | /api/v1/export/movimientos/xlsx | Exportar movimientos a XLSX. |
| GET | /api/v1/export/recepciones/xlsx | Exportar recepciones a XLSX. |
| GET | /api/v1/export/recetas/xlsx | Exportar recetas a XLSX. |
| GET | /api/v1/export/ubicaciones/xlsx | Exportar ubicaciones a XLSX. |
| GET | /api/v1/export/usuarios/xlsx | Exportar usuarios a XLSX (solo Admin). |
| GET | /api/v1/export/productos/pdf | Exportar productos a PDF. |
| GET | /api/v1/export/proveedores/pdf | Exportar proveedores a PDF. |
| GET | /api/v1/export/inventario/pdf | Exportar inventario a PDF. |
| GET | /api/v1/export/pedidos/pdf | Exportar pedidos a PDF. |
| GET | /api/v1/export/albaranes/pdf | Exportar albaranes a PDF. |
| GET | /api/v1/export/recetas/pdf | Exportar recetas a PDF. |

| GET | /api/v1/movimientos/historial | Obtener historial/trazabilidad de movimientos (filtros: entityId,userId,type,startDate,endDate). Requiere rol Admin/Profesor. |
| GET | /api/v1/movimientos/:id | Obtener movimiento por ID. Requiere permisos/roles. |
| DELETE | /api/v1/movimientos/:id | Eliminar movimiento (soft). Requiere rol Admin. |

| POST | /api/v1/auth/register | Registro de usuario (registro público). Usa `RegisterUserDto`. |

| POST | /api/v1/producto-alergenos | Crear asociación producto-alérgeno. Requiere `productos:editar`. |
| GET | /api/v1/producto-alergenos | Listar asociaciones producto-alérgeno; filtro por `idProducto`. |
| GET | /api/v1/producto-alergenos/:id | Obtener alérgenos de un producto por ID. |
| PATCH | /api/v1/producto-alergenos/:id | Reemplazar alérgenos de producto. |
| DELETE | /api/v1/producto-alergenos/:idProducto/:alergeno | Eliminar asociación producto-alérgeno. |

| PATCH | /api/v1/producto-proveedor/:id/precio | Actualizar precio de relación producto-proveedor y registrar histórico (`UpdatePrecioProductoDto`). Requiere rol Admin/Profesor. |
| GET | /api/v1/producto-proveedor/:id/historial | Obtener historial de precios para relación producto-proveedor (paginado). |

| POST | /api/v1/archivos/upload | Subir archivo (multipart/form-data). Requiere permiso `archivos:subir`. |
| GET | /api/v1/archivos | Listar archivos (paginado). Requiere `archivos:listar`. |
| GET | /api/v1/archivos/:id | Obtener metadata de archivo por ID. |
| GET | /api/v1/archivos/content/:filename | Servir contenido del archivo subido (sendFile). |
| DELETE | /api/v1/archivos/:id | Eliminar archivo (soft-delete). |

| POST | /api/v1/historial-precio | Crear registro de historial de precio. Requiere `productos:editar`. |
| GET | /api/v1/historial-precio | Listar historial de precios (order param). |
| GET | /api/v1/historial-precio/:id | Obtener historial por ID. |
| PATCH | /api/v1/historial-precio/:id | Actualizar registro de historial. |
| DELETE | /api/v1/historial-precio/:id | Eliminar registro de historial. |

| GET | /api/v1/productos/generar-ean13 | Generar un código EAN-13 único para producto. Requiere `productos:generar_ean13`. |
| GET | /api/v1/productos/:id | Obtener producto por ID. (si bien hay `productos` endpoints usados, la obtención por ID no apareció en frontend). |
| DELETE | /api/v1/productos/:id | Eliminar producto. Requiere `productos:eliminar`. |

---

Nota: esta lista se generó comparando las rutas definidas en los controladores del backend (`src/modules/**/controller/*.ts`) con las llamadas explícitas encontradas en el frontend (`frontend/smart-economat-frontend/src/**`). Si necesitas que genere una versión con referencias directas a las líneas de código donde cada endpoint está definido (o donde se consume), puedo añadir enlaces de archivo/linea en una segunda pasada.
