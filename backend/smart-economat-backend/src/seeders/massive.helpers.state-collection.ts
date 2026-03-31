import { SeedContext } from './seed-context';
import {
  extractFilename,
  isRecord,
  toEntityArray,
} from './massive.helpers.common';
import { pushStateValue, removeStateValue } from './massive.state';

export function collectStateFromResponse(
  context: SeedContext,
  resolvedPath: string,
  response: unknown
): void {
  const entities = toEntityArray(response);
  const profesorByAulaClaseMatch = resolvedPath.match(
    /^\/alumnos\/aulas\/([^/]+)\/clases\/([^/]+)\/profesores$/
  );
  const aulaFromPath = profesorByAulaClaseMatch
    ? decodeURIComponent(profesorByAulaClaseMatch[1] || '')
    : '';
  const numeroClaseFromPath = profesorByAulaClaseMatch
    ? Number.parseInt(profesorByAulaClaseMatch[2] || '', 10)
    : Number.NaN;

  const isPurchaseBatchEntity = (entity: Record<string, unknown>): boolean => {
    if (typeof entity.id !== 'string') {
      return false;
    }

    if (typeof entity.numeroGlobal === 'string') {
      return false;
    }

    return Array.isArray(entity.pedidos);
  };

  const isPedidoEntity = (entity: Record<string, unknown>): boolean => {
    if (typeof entity.id !== 'string') {
      return false;
    }

    return (
      typeof entity.usuarioId === 'string' &&
      typeof entity.proveedorId === 'string' &&
      typeof entity.fechaPedido === 'string'
    );
  };

  const productoProveedorPrecioById =
    context.getState<Record<string, number>>('productoProveedorPrecioById') ||
    {};
  let hasProductoProveedorPriceUpdates = false;

  const parsePrice = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Number(value.toFixed(2));
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return Number(parsed.toFixed(2));
      }
    }

    return null;
  };

  const rememberProductoProveedorPrice = (
    idValue: unknown,
    priceValue: unknown
  ): void => {
    if (typeof idValue !== 'string' || idValue.trim().length === 0) {
      return;
    }

    const parsedPrice = parsePrice(priceValue);
    if (parsedPrice === null) {
      return;
    }

    if (productoProveedorPrecioById[idValue] === parsedPrice) {
      return;
    }

    productoProveedorPrecioById[idValue] = parsedPrice;
    hasProductoProveedorPriceUpdates = true;
  };

  for (const entity of entities) {
    const id = entity.id;

    if (resolvedPath.startsWith('/admin/roles'))
      pushStateValue(context, 'roleIds', id);
    if (resolvedPath.startsWith('/admin/permissions'))
      pushStateValue(context, 'permissionIds', id);

    if (resolvedPath.startsWith('/usuarios'))
      pushStateValue(context, 'usuarioIds', id);
    if (resolvedPath.startsWith('/proveedor'))
      pushStateValue(context, 'proveedorIds', id);
    if (resolvedPath.startsWith('/productos'))
      pushStateValue(context, 'productoIds', id);
    if (resolvedPath.startsWith('/producto-proveedor'))
      pushStateValue(context, 'productoProveedorIds', id);
    if (resolvedPath.startsWith('/producto-proveedor')) {
      rememberProductoProveedorPrice(
        entity.id,
        entity.precioUnitario || entity.precio || entity.nuevoPrecio
      );
    }
    if (resolvedPath.startsWith('/historial-precio')) {
      rememberProductoProveedorPrice(entity.productoProveedorId, entity.precio);
    }
    if (
      typeof entity.id === 'string' &&
      typeof entity.proveedorId === 'string'
    ) {
      pushStateValue(
        context,
        'productoProveedorToProveedorPairs',
        `${entity.id}|${entity.proveedorId}`
      );
    }
    if (typeof entity.id === 'string' && typeof entity.pedidoId === 'string') {
      pushStateValue(
        context,
        'pedidoProductoToPedidoPairs',
        `${entity.id}|${entity.pedidoId}`
      );
    }
    if (
      resolvedPath.startsWith('/recepciones') &&
      typeof entity.recepcionId === 'string' &&
      typeof entity.pedidoId === 'string'
    ) {
      pushStateValue(
        context,
        'recepcionToPedidoPairs',
        `${entity.recepcionId}|${entity.pedidoId}`
      );
    }
    if (resolvedPath.startsWith('/historial-precio'))
      pushStateValue(context, 'historialPrecioIds', id);
    if (resolvedPath.startsWith('/ubicacion'))
      pushStateValue(context, 'ubicacionIds', id);
    if (resolvedPath.startsWith('/inventario'))
      pushStateValue(context, 'inventarioIds', id);
    if (resolvedPath.startsWith('/pedido-usuarios'))
      pushStateValue(context, 'pedidoUsuarioIds', id);
    if (
      resolvedPath.startsWith('/purchase-batches') &&
      isPurchaseBatchEntity(entity)
    )
      pushStateValue(context, 'purchaseBatchIds', id);
    if (resolvedPath.startsWith('/pedidos') && isPedidoEntity(entity)) {
      pushStateValue(context, 'pedidoIds', id);
      pushStateValue(context, 'pedidoReceivableIds', id);
    }
    if (resolvedPath.startsWith('/recepciones'))
      pushStateValue(context, 'recepcionIds', id);
    if (resolvedPath.startsWith('/recepcion-productos'))
      pushStateValue(context, 'recepcionProductoIds', id);
    if (resolvedPath.startsWith('/albaranes'))
      pushStateValue(context, 'albaranIds', id);
    if (resolvedPath.startsWith('/incidencias-resueltas'))
      pushStateValue(context, 'incidenciaResueltaIds', id);
    if (resolvedPath.startsWith('/incidencias'))
      pushStateValue(context, 'incidenciaIds', id);
    if (resolvedPath.startsWith('/movimientos'))
      pushStateValue(context, 'movimientoIds', id);
    if (resolvedPath.startsWith('/recetas'))
      pushStateValue(context, 'recetaIds', id);
    if (resolvedPath.startsWith('/preparaciones'))
      pushStateValue(context, 'preparacionIds', id);
    if (resolvedPath.startsWith('/merma'))
      pushStateValue(context, 'mermaIds', id);
    if (resolvedPath.startsWith('/profesores/admin-slots'))
      pushStateValue(context, 'profesorAdminSlotIds', id);
    if (resolvedPath.startsWith('/profesores/slots'))
      pushStateValue(context, 'profesorSlotIds', id);
    if (resolvedPath.startsWith('/profesores/alumnos'))
      pushStateValue(context, 'alumnoIds', id);
    if (resolvedPath.startsWith('/profesores/all-profesores')) {
      pushStateValue(context, 'profesorIds', id);
      pushStateValue(context, 'usuarioIds', entity.userId);
    }

    pushStateValue(context, 'usuarioIds', entity.userId);
    pushStateValue(context, 'pedidoProductoIds', entity.idPedidoProducto);
    pushStateValue(context, 'seedClassCodes', entity.codigoClase);
    pushStateValue(context, 'seedClassCodes', entity.codigoSlot);
    pushStateValue(context, 'seedProfesorCials', entity.cial);

    if (
      profesorByAulaClaseMatch &&
      typeof entity.cial === 'string' &&
      entity.cial.trim().length > 0 &&
      aulaFromPath.length > 0 &&
      Number.isFinite(numeroClaseFromPath)
    ) {
      pushStateValue(
        context,
        'seedProfesorSlotTriples',
        `${entity.cial}|${aulaFromPath}|${numeroClaseFromPath}`
      );
    }

    if (
      typeof entity.aula === 'string' &&
      typeof entity.numeroClase === 'number'
    ) {
      pushStateValue(
        context,
        'seedAulaClasePairs',
        `${entity.aula}|${entity.numeroClase}`
      );

      if (typeof entity.cial === 'string' && entity.cial.trim().length > 0) {
        pushStateValue(
          context,
          'seedProfesorSlotTriples',
          `${entity.cial}|${entity.aula}|${entity.numeroClase}`
        );
      }
    }

    const alergenoProductoId =
      typeof entity.idProducto === 'string'
        ? entity.idProducto
        : typeof entity.productoId === 'string'
          ? entity.productoId
          : '';

    if (alergenoProductoId && typeof entity.alergeno === 'string') {
      pushStateValue(
        context,
        'productoAlergenoPairs',
        `${alergenoProductoId}|${entity.alergeno}`
      );
    }

    if (typeof entity.id === 'string' && Array.isArray(entity.alergenos)) {
      for (const item of entity.alergenos) {
        if (typeof item === 'string' && item.trim().length > 0) {
          pushStateValue(
            context,
            'productoAlergenoPairs',
            `${entity.id}|${item}`
          );
        }
      }
    }

    if (Array.isArray(entity.proveedores)) {
      for (const pp of entity.proveedores) {
        if (isRecord(pp)) {
          pushStateValue(context, 'productoProveedorIds', pp.id);
          pushStateValue(context, 'proveedorIds', pp.proveedorId);
          rememberProductoProveedorPrice(
            pp.id,
            pp.precioUnitario || pp.precio || pp.nuevoPrecio
          );
          if (typeof pp.id === 'string' && typeof pp.proveedorId === 'string') {
            pushStateValue(
              context,
              'productoProveedorToProveedorPairs',
              `${pp.id}|${pp.proveedorId}`
            );
          }
          pushStateValue(context, 'productoConProveedorIds', entity.id);
        }
      }
    }

    for (const lineCollection of [
      entity.lineas,
      entity.pedidoProductos,
      entity.productos,
    ]) {
      if (!Array.isArray(lineCollection)) {
        continue;
      }
      for (const line of lineCollection) {
        if (isRecord(line)) {
          pushStateValue(context, 'pedidoProductoIds', line.id);
          pushStateValue(context, 'pedidoProductoIds', line.idPedidoProducto);
          if (resolvedPath.startsWith('/pedidos')) {
            pushStateValue(context, 'pedidoProductoIdsFresh', line.id);
          }
          if (
            typeof line.id === 'string' &&
            typeof line.pedidoId === 'string'
          ) {
            pushStateValue(
              context,
              'pedidoProductoToPedidoPairs',
              `${line.id}|${line.pedidoId}`
            );
            if (resolvedPath.startsWith('/pedidos')) {
              pushStateValue(
                context,
                'pedidoProductoToPedidoPairsFresh',
                `${line.id}|${line.pedidoId}`
              );
            }
          }
        }
      }
    }

    const estado = entity.estado;
    if (typeof estado === 'string' && typeof entity.id === 'string') {
      if (resolvedPath.startsWith('/pedidos') && isPedidoEntity(entity)) {
        if (estado === 'pendiente')
          pushStateValue(context, 'pedidoPendienteIds', entity.id);
      }
      if (resolvedPath.startsWith('/pedido-usuarios')) {
        if (estado === 'pendiente')
          pushStateValue(context, 'pedidoUsuarioPendienteIds', entity.id);
      }
      if (
        resolvedPath.startsWith('/purchase-batches') &&
        isPurchaseBatchEntity(entity)
      ) {
        if (estado === 'pendiente')
          pushStateValue(context, 'purchaseBatchPendienteIds', entity.id);
      }
      if (resolvedPath.startsWith('/preparaciones')) {
        if (estado === 'PENDIENTE')
          pushStateValue(context, 'preparacionPendienteIds', entity.id);
        if (estado === 'EN_PROCESO')
          pushStateValue(context, 'preparacionEnProcesoIds', entity.id);
      }
    }

    if (
      resolvedPath.startsWith('/incidencias') &&
      typeof entity.id === 'string'
    ) {
      const hasFechaResolucion =
        (typeof entity.fechaResolucion === 'string' &&
          entity.fechaResolucion.trim().length > 0) ||
        entity.fechaResolucion instanceof Date;

      const incidenciaYaResuelta =
        entity.resuelta === true ||
        hasFechaResolucion ||
        (typeof entity.usuarioResolutorId === 'string' &&
          entity.usuarioResolutorId.trim().length > 0) ||
        (isRecord(entity.usuarioResolutor) &&
          typeof entity.usuarioResolutor.id === 'string' &&
          entity.usuarioResolutor.id.trim().length > 0);

      if (incidenciaYaResuelta) {
        removeStateValue(context, 'incidenciaPendienteIds', entity.id);
      } else {
        pushStateValue(context, 'incidenciaPendienteIds', entity.id);
      }
    }

    if (resolvedPath.startsWith('/produccion')) {
      pushStateValue(context, 'produccionLoteIds', entity.id);
    }

    if (resolvedPath.startsWith('/movimientos')) {
      const entidadId =
        (typeof entity.entidadId === 'string' && entity.entidadId) ||
        (typeof entity.entidadID === 'string' && entity.entidadID) ||
        (typeof entity.entityId === 'string' && entity.entityId) ||
        '';
      const tipoMovimiento =
        (typeof entity.tipo === 'string' && entity.tipo) ||
        (typeof entity.type === 'string' && entity.type) ||
        '';
      const movimientoUserId =
        (typeof entity.usuarioId === 'string' && entity.usuarioId) ||
        (typeof entity.userId === 'string' && entity.userId) ||
        (isRecord(entity.usuario) && typeof entity.usuario.id === 'string'
          ? entity.usuario.id
          : '') ||
        (isRecord(entity.user) && typeof entity.user.id === 'string'
          ? entity.user.id
          : '');

      if (entidadId) {
        pushStateValue(context, 'movimientoEntidadIds', entidadId);
      }
      if (movimientoUserId) {
        pushStateValue(context, 'movimientoUserIds', movimientoUserId);
      }
      if (entidadId && tipoMovimiento) {
        pushStateValue(
          context,
          'movimientoEntidadTipoPairs',
          `${entidadId}|${tipoMovimiento}`
        );
      }
    }

    if (resolvedPath === '/archivos/upload') {
      pushStateValue(context, 'archivoIds', entity.id);
      const filename =
        extractFilename(entity.url) ||
        extractFilename(entity.urlOptimized) ||
        extractFilename(entity.nombre);
      pushStateValue(context, 'archivoFilenames', filename);
    }

    if (resolvedPath === '/albaranes/upload-documento') {
      const filename =
        extractFilename(entity.documentoUrl) ||
        extractFilename(entity.urlDocumento) ||
        extractFilename(entity.url);
      pushStateValue(context, 'albaranDocumentFilenames', filename);
    }
  }

  if (hasProductoProveedorPriceUpdates) {
    context.set('productoProveedorPrecioById', productoProveedorPrecioById);
  }
}
