# Endpoints del backend NO usados por el frontend

Prefijo global: `/api/v1`

Listado automático de endpoints del backend que no se detectaron como llamados explícitamente desde el frontend (búsqueda estática por cadenas de ruta).

| Método | Endpoint | Archivo Controlador |
|--------|----------|---------------------|
| GET | /api/v1/)
  getHello(): string {
    return this.appService.getHello( | app.controller.ts |
| GET | /api/v1/admin/roles | admin.controller.ts |
| GET | /api/v1/admin/permissions | admin.controller.ts |
| POST | /api/v1/admin/profesores | admin.controller.ts |
| PATCH | /api/v1/admin/users/:id/role | admin.controller.ts |
| PATCH | /api/v1/admin/users/:id/activate | admin.controller.ts |
| POST | /api/v1/admin/users/:id/force-reset | admin.controller.ts |
| POST | /api/v1/albaranes | albaran.controller.ts |
| POST | /api/v1/albaranes/upload-documento | albaran.controller.ts |
| GET | /api/v1/albaranes/documento/:filename | albaran.controller.ts |
| GET | /api/v1/albaranes | albaran.controller.ts |
| GET | /api/v1/albaranes/:id | albaran.controller.ts |
| PATCH | /api/v1/albaranes/:id | albaran.controller.ts |
| DELETE | /api/v1/albaranes/:id | albaran.controller.ts |
| POST | /api/v1/alumnos/register | alumno.controller.ts |
| GET | /api/v1/alumnos/slots/:codigoClase | alumno.controller.ts |
| GET | /api/v1/alumnos/aulas | alumno.controller.ts |
| GET | /api/v1/alumnos/aulas/:aula/clases | alumno.controller.ts |
| GET | /api/v1/alumnos/aulas/:aula/clases/:clase/profesores | alumno.controller.ts |
| PATCH | /api/v1/alumnos/change-profesor | alumno.controller.ts |
| POST | /api/v1/archivos/upload | archivo.controller.ts |
| GET | /api/v1/archivos | archivo.controller.ts |
| GET | /api/v1/archivos/:id | archivo.controller.ts |
| GET | /api/v1/archivos/content/:filename | archivo.controller.ts |
| DELETE | /api/v1/archivos/:id | archivo.controller.ts |
| POST | /api/v1/auth/register | auth.controller.ts |
| POST | /api/v1/auth/login | auth.controller.ts |
| POST | /api/v1/auth/logout | auth.controller.ts |
| GET | /api/v1/auth/profile | auth.controller.ts |
| PATCH | /api/v1/auth/change-password | auth.controller.ts |
| POST | /api/v1/auth/forgot-password | auth.controller.ts |
| POST | /api/v1/auth/reset-password | auth.controller.ts |
| GET | /api/v1/dashboard/stats | dashboard.controller.ts |
| GET | /api/v1/export/productos/xlsx | export.controller.ts |
| GET | /api/v1/export/pedidos/xlsx | export.controller.ts |
| GET | /api/v1/export/proveedores/xlsx | export.controller.ts |
| GET | /api/v1/export/albaranes/xlsx | export.controller.ts |
| GET | /api/v1/export/incidencias/xlsx | export.controller.ts |
| GET | /api/v1/export/inventario/xlsx | export.controller.ts |
| GET | /api/v1/export/movimientos/xlsx | export.controller.ts |
| GET | /api/v1/export/recepciones/xlsx | export.controller.ts |
| GET | /api/v1/export/recetas/xlsx | export.controller.ts |
| GET | /api/v1/export/ubicaciones/xlsx | export.controller.ts |
| GET | /api/v1/export/usuarios/xlsx | export.controller.ts |
| GET | /api/v1/export/productos/pdf | export.controller.ts |
| GET | /api/v1/export/proveedores/pdf | export.controller.ts |
| GET | /api/v1/export/inventario/pdf | export.controller.ts |
| GET | /api/v1/export/pedidos/pdf | export.controller.ts |
| GET | /api/v1/export/albaranes/pdf | export.controller.ts |
| GET | /api/v1/export/recetas/pdf | export.controller.ts |
| POST | /api/v1/incidencias-resueltas | incidencia-resuelta.controller.ts |
| GET | /api/v1/incidencias-resueltas | incidencia-resuelta.controller.ts |
| GET | /api/v1/incidencias-resueltas/:id | incidencia-resuelta.controller.ts |
| PATCH | /api/v1/incidencias-resueltas/:id | incidencia-resuelta.controller.ts |
| DELETE | /api/v1/incidencias-resueltas/:id | incidencia-resuelta.controller.ts |
| POST | /api/v1/incidencias | incidencia.controller.ts |
| GET | /api/v1/incidencias | incidencia.controller.ts |
| GET | /api/v1/incidencias/:id | incidencia.controller.ts |
| PATCH | /api/v1/incidencias/:id | incidencia.controller.ts |
| DELETE | /api/v1/incidencias/:id | incidencia.controller.ts |
| PATCH | /api/v1/incidencias/:id/resolver | incidencia.controller.ts |
| POST | /api/v1/incidencias/reportar | incidencia.controller.ts |
| POST | /api/v1/incidencias/:id/resolver | incidencia.controller.ts |
| GET | /api/v1/alertas/caducidad | alerta.controller.ts |
| GET | /api/v1/alertas/stock | alerta.controller.ts |
| POST | /api/v1/inventario | inventario.controller.ts |
| GET | /api/v1/inventario | inventario.controller.ts |
| GET | /api/v1/inventario/stock | inventario.controller.ts |
| POST | /api/v1/inventario/ajustes-manuales | inventario.controller.ts |
| GET | /api/v1/inventario/:id | inventario.controller.ts |
| PATCH | /api/v1/inventario/:id | inventario.controller.ts |
| DELETE | /api/v1/inventario/:id | inventario.controller.ts |
| POST | /api/v1/merma | merma.controller.ts |
| GET | /api/v1/merma/stats | merma.controller.ts |
| GET | /api/v1/merma | merma.controller.ts |
| GET | /api/v1/merma/:id | merma.controller.ts |
| POST | /api/v1/movimientos/)
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR | movimiento.controller.ts |
| GET | /api/v1/movimientos/)
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO | movimiento.controller.ts |
| GET | /api/v1/movimientos/historial | movimiento.controller.ts |
| GET | /api/v1/movimientos/:id | movimiento.controller.ts |
| PATCH | /api/v1/movimientos/:id | movimiento.controller.ts |
| DELETE | /api/v1/movimientos/:id | movimiento.controller.ts |
| POST | /api/v1/pedidos | pedido.controller.ts |
| GET | /api/v1/pedidos | pedido.controller.ts |
| POST | /api/v1/pedidos/from-recipes | pedido.controller.ts |
| GET | /api/v1/pedidos/:id | pedido.controller.ts |
| PATCH | /api/v1/pedidos/:id | pedido.controller.ts |
| DELETE | /api/v1/pedidos/:id | pedido.controller.ts |
| PATCH | /api/v1/pedidos/:id/fecha-entrega | pedido.controller.ts |
| PATCH | /api/v1/pedidos/:id/cancelar | pedido.controller.ts |
| PATCH | /api/v1/pedidos/:id/aceptar | pedido.controller.ts |
| POST | /api/v1/purchase-batches | purchase-batch.controller.ts |
| POST | /api/v1/purchase-batches/from-missing-stock | purchase-batch.controller.ts |
| POST | /api/v1/purchase-batches/from-recipes | purchase-batch.controller.ts |
| GET | /api/v1/purchase-batches | purchase-batch.controller.ts |
| GET | /api/v1/purchase-batches/:id | purchase-batch.controller.ts |
| GET | /api/v1/purchase-batches/:id/pdf | purchase-batch.controller.ts |
| POST | /api/v1/pedido/draft/)
  @HttpCode(HttpStatus.OK | pedido-draft.controller.ts |
| GET | /api/v1/pedido/draft | pedido-draft.controller.ts |
| DELETE | /api/v1/pedido/draft/)
  @HttpCode(HttpStatus.NO_CONTENT | pedido-draft.controller.ts |
| POST | /api/v1/pedido/draft/finalize | pedido-draft.controller.ts |
| POST | /api/v1/preparaciones/)
  async create(@Body() dto: CreatePreparacionDto, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.preparacionService.create(dto, userId);
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto, @Req() req: Request) {
    const userRole = (req.user as any).rol?.nombre;
    return this.preparacionService.findAll(query, userRole | preparacion.controller.ts |
| GET | /api/v1/preparaciones/:id | preparacion.controller.ts |
| PATCH | /api/v1/preparaciones/:id/iniciar | preparacion.controller.ts |
| PATCH | /api/v1/preparaciones/:id/finalizar | preparacion.controller.ts |
| PATCH | /api/v1/preparaciones/:id/cancelar | preparacion.controller.ts |
| DELETE | /api/v1/preparaciones/:id | preparacion.controller.ts |
| POST | /api/v1/historial-precio | historial-precio.controller.ts |
| GET | /api/v1/historial-precio | historial-precio.controller.ts |
| GET | /api/v1/historial-precio/:id | historial-precio.controller.ts |
| PATCH | /api/v1/historial-precio/:id | historial-precio.controller.ts |
| DELETE | /api/v1/historial-precio/:id | historial-precio.controller.ts |
| POST | /api/v1/producto-alergenos | producto-alergeno.controller.ts |
| GET | /api/v1/producto-alergenos | producto-alergeno.controller.ts |
| GET | /api/v1/producto-alergenos/:id | producto-alergeno.controller.ts |
| PATCH | /api/v1/producto-alergenos/:id | producto-alergeno.controller.ts |
| DELETE | /api/v1/producto-alergenos/:idProducto/:alergeno | producto-alergeno.controller.ts |
| PATCH | /api/v1/producto-proveedor/:id/precio | producto-proveedor.controller.ts |
| PATCH | /api/v1/producto-proveedor/:id/merma | producto-proveedor.controller.ts |
| GET | /api/v1/producto-proveedor/search | producto-proveedor.controller.ts |
| GET | /api/v1/producto-proveedor/comparar/:productoId | producto-proveedor.controller.ts |
| GET | /api/v1/producto-proveedor/:id/historial | producto-proveedor.controller.ts |
| GET | /api/v1/productos/generar-ean13 | producto.controller.ts |
| POST | /api/v1/productos | producto.controller.ts |
| GET | /api/v1/productos | producto.controller.ts |
| GET | /api/v1/productos/:id | producto.controller.ts |
| PATCH | /api/v1/productos/:id | producto.controller.ts |
| DELETE | /api/v1/productos/:id | producto.controller.ts |
| POST | /api/v1/profesores/register | profesor.controller.ts |
| POST | /api/v1/profesores/slots | profesor.controller.ts |
| POST | /api/v1/profesores/admin-slots | profesor.controller.ts |
| GET | /api/v1/profesores/slots | profesor.controller.ts |
| GET | /api/v1/profesores/all-slots | profesor.controller.ts |
| GET | /api/v1/profesores/all-profesores | profesor.controller.ts |
| PATCH | /api/v1/profesores/admin-slots/:id | profesor.controller.ts |
| PATCH | /api/v1/profesores/slots/:id | profesor.controller.ts |
| DELETE | /api/v1/profesores/slots/:id | profesor.controller.ts |
| DELETE | /api/v1/profesores/admin-slots/:id | profesor.controller.ts |
| PATCH | /api/v1/profesores/alumnos/:id/activate | profesor.controller.ts |
| GET | /api/v1/profesores/alumnos | profesor.controller.ts |
| POST | /api/v1/profesores/alumnos/:id/force-reset | profesor.controller.ts |
| POST | /api/v1/proveedor/)
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProveedorDto): Promise<Proveedor> {
    return this.proveedorService.create(dto);
  }

  @Get( | proveedor.controller.ts |
| GET | /api/v1/proveedor/:id | proveedor.controller.ts |
| PATCH | /api/v1/proveedor/:id | proveedor.controller.ts |
| DELETE | /api/v1/proveedor/:id | proveedor.controller.ts |
| POST | /api/v1/recepcion-productos | recepcion-producto.controller.ts |
| GET | /api/v1/recepcion-productos | recepcion-producto.controller.ts |
| GET | /api/v1/recepcion-productos/:id | recepcion-producto.controller.ts |
| PATCH | /api/v1/recepcion-productos/:id | recepcion-producto.controller.ts |
| DELETE | /api/v1/recepcion-productos/:id | recepcion-producto.controller.ts |
| POST | /api/v1/recepciones/)
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateRecepcionDto,
    @Req() req: { user: { id: string } }
  ): Promise<RecepcionResultadoDto> {
    const userId = req.user.id;
    dto.usuarioId = dto.usuarioId || userId;
    return this.recepcionStockService.procesarRecepcion(dto);
  }

  @Get( | recepcion.controller.ts |
| GET | /api/v1/recepciones/reporte-pdf | recepcion.controller.ts |
| GET | /api/v1/recepciones/:id | recepcion.controller.ts |
| PATCH | /api/v1/recepciones/:id | recepcion.controller.ts |
| DELETE | /api/v1/recepciones/:id | recepcion.controller.ts |
| POST | /api/v1/recepcion/draft/)
  @HttpCode(HttpStatus.OK | recepcion-draft.controller.ts |
| GET | /api/v1/recepcion/draft | recepcion-draft.controller.ts |
| DELETE | /api/v1/recepcion/draft/)
  @HttpCode(HttpStatus.NO_CONTENT | recepcion-draft.controller.ts |
| POST | /api/v1/produccion/ejecutar | produccion.controller.ts |
| POST | /api/v1/produccion/validar | produccion.controller.ts |
| GET | /api/v1/produccion | produccion.controller.ts |
| PATCH | /api/v1/produccion/lote/:id/consumir | produccion.controller.ts |
| GET | /api/v1/produccion/:id | produccion.controller.ts |
| POST | /api/v1/recetas | receta.controller.ts |
| POST | /api/v1/recetas/duplicate | receta.controller.ts |
| GET | /api/v1/recetas | receta.controller.ts |
| GET | /api/v1/recetas/:id | receta.controller.ts |
| GET | /api/v1/recetas/:id/detalle | receta.controller.ts |
| GET | /api/v1/recetas/:id/escandallo | receta.controller.ts |
| POST | /api/v1/recetas/:id/cocinar | receta.controller.ts |
| GET | /api/v1/recetas/export/pdf | receta.controller.ts |
| GET | /api/v1/recetas/:id/pdf | receta.controller.ts |
| POST | /api/v1/recetas/:id/recalcular-costes | receta.controller.ts |
| PATCH | /api/v1/recetas/:id | receta.controller.ts |
| DELETE | /api/v1/recetas/:id | receta.controller.ts |
| POST | /api/v1/ubicacion | ubicacion.controller.ts |
| GET | /api/v1/ubicacion | ubicacion.controller.ts |
| GET | /api/v1/ubicacion/:id | ubicacion.controller.ts |
| PATCH | /api/v1/ubicacion/:id | ubicacion.controller.ts |
| DELETE | /api/v1/ubicacion/:id | ubicacion.controller.ts |
| POST | /api/v1/ubicacion/:id/restore | ubicacion.controller.ts |
| POST | /api/v1/usuarios | usuario.controller.ts |
| POST | /api/v1/usuarios/admin | usuario.controller.ts |
| GET | /api/v1/usuarios/perfil | usuario.controller.ts |
| PATCH | /api/v1/usuarios/perfil | usuario.controller.ts |
| PATCH | /api/v1/usuarios/perfil/password | usuario.controller.ts |
| GET | /api/v1/usuarios | usuario.controller.ts |
| GET | /api/v1/usuarios/minimos | usuario.controller.ts |
| GET | /api/v1/usuarios/:id | usuario.controller.ts |
| PATCH | /api/v1/usuarios/:id | usuario.controller.ts |
| PATCH | /api/v1/usuarios/:id/admin | usuario.controller.ts |
| PATCH | /api/v1/usuarios/:id/activar | usuario.controller.ts |
| PATCH | /api/v1/usuarios/:id/rol | usuario.controller.ts |
| PATCH | /api/v1/usuarios/:id/password | usuario.controller.ts |
| DELETE | /api/v1/usuarios/:id | usuario.controller.ts |
| POST | /api/v1/usuarios/:id/permisos-adicionales/:permisoId | usuario.controller.ts |
| DELETE | /api/v1/usuarios/:id/permisos-adicionales/:permisoId | usuario.controller.ts |
| POST | /api/v1/usuarios/:id/permisos-excluidos/:permisoId | usuario.controller.ts |
| DELETE | /api/v1/usuarios/:id/permisos-excluidos/:permisoId | usuario.controller.ts |
