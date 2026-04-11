import { SeedContext } from './seed-context';
import { EstadoPedido } from '../modules/pedido/enums/estado-pedido.enum';
import { EstadoPedidoUsuario } from '../modules/pedido/enums/estado-pedido-usuario.enum';
import { EstadoLote } from '../modules/pedido/enums/estado-lote.enum';
import { UnidadMedida } from '../modules/producto/enums/producto.enums';
import { UnidadIngrediente } from '../modules/receta/enums/receta.enums';
import {
  extractFilename,
  isRecord,
  toEntityArray,
} from './massive.helpers.common';
import { pushStateValue, removeStateValue } from './massive.state';
import { SYSTEM_ROLE_TEMPLATE_PROTECTED_NAMES } from '../common/constants/system-role-template.constants';

/** Base template names that must never be picked for destructive/mutating seed operations */
const PROTECTED_PLANTILLA_NAMES = SYSTEM_ROLE_TEMPLATE_PROTECTED_NAMES;

export function collectStateFromResponse(
  context: SeedContext,
  resolvedPath: string,
  response: unknown
): void {
  const roleIdByName =
    context.getState<Record<string, string>>('seedRoleIdByName') || {};
  let hasRoleIdByNameUpdates = false;

  const entities = toEntityArray(response);
  const pedidoUsuarioCancelarMatch = resolvedPath.match(
    /^\/pedido-usuarios\/([^/]+)\/cancelar$/
  );
  const pedidoUsuarioRestaurarMatch = resolvedPath.match(
    /^\/pedido-usuarios\/([^/]+)\/restaurar$/
  );
  const purchaseBatchCancelarMatch = resolvedPath.match(
    /^\/purchase-batches\/([^/]+)\/cancelar$/
  );
  const purchaseBatchRestaurarMatch = resolvedPath.match(
    /^\/purchase-batches\/([^/]+)\/restaurar$/
  );
  const pedidoCancelarMatch = resolvedPath.match(
    /^\/pedidos\/([^/]+)\/cancelar$/
  );
  const pedidoRestaurarMatch = resolvedPath.match(
    /^\/pedidos\/([^/]+)\/restaurar$/
  );

  if (pedidoUsuarioCancelarMatch?.[1]) {
    const id = pedidoUsuarioCancelarMatch[1];
    pushStateValue(context, 'pedidoUsuarioCanceladoIds', id);
    removeStateValue(context, 'pedidoUsuarioPendienteIds', id);
    context.set('seedLastPedidoUsuarioCanceladoId', id);
  }

  if (pedidoUsuarioRestaurarMatch?.[1]) {
    const id = pedidoUsuarioRestaurarMatch[1];
    removeStateValue(context, 'pedidoUsuarioCanceladoIds', id);
    pushStateValue(context, 'pedidoUsuarioPendienteIds', id);
    if (context.getState<string>('seedLastPedidoUsuarioCanceladoId') === id) {
      context.set('seedLastPedidoUsuarioCanceladoId', '');
    }
  }

  if (purchaseBatchCancelarMatch?.[1]) {
    const id = purchaseBatchCancelarMatch[1];
    pushStateValue(context, 'purchaseBatchCanceladoIds', id);
    removeStateValue(context, 'purchaseBatchPendienteIds', id);
  }

  if (purchaseBatchRestaurarMatch?.[1]) {
    const id = purchaseBatchRestaurarMatch[1];
    removeStateValue(context, 'purchaseBatchCanceladoIds', id);
    pushStateValue(context, 'purchaseBatchPendienteIds', id);
  }

  if (pedidoCancelarMatch?.[1]) {
    const id = pedidoCancelarMatch[1];
    pushStateValue(context, 'pedidoCanceladoIds', id);
    removeStateValue(context, 'pedidoPendienteIds', id);
  }

  if (pedidoRestaurarMatch?.[1]) {
    const id = pedidoRestaurarMatch[1];
    removeStateValue(context, 'pedidoCanceladoIds', id);
    pushStateValue(context, 'pedidoPendienteIds', id);
  }

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

    return (
      Array.isArray(entity.pedidos) ||
      typeof entity.numeroGlobal === 'string' ||
      typeof entity.numeroGlobal === 'number'
    );
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

  const isPedidoUsuarioEntity = (entity: Record<string, unknown>): boolean => {
    if (typeof entity.id !== 'string') {
      return false;
    }

    return (
      typeof entity.numeroGlobal === 'string' &&
      typeof entity.fechaPedido === 'string'
    );
  };

  const isProductoEntity = (entity: Record<string, unknown>): boolean => {
    if (typeof entity.id !== 'string') {
      return false;
    }

    return (
      typeof entity.nombre === 'string' &&
      (typeof entity.contenido === 'number' ||
        typeof entity.contenido === 'string' ||
        typeof entity.pmp === 'number' ||
        typeof entity.pmp === 'string')
    );
  };

  const isRecetaEntity = (entity: Record<string, unknown>): boolean => {
    if (typeof entity.id !== 'string') {
      return false;
    }

    return (
      typeof entity.nombre === 'string' &&
      typeof entity.instrucciones === 'string' &&
      typeof entity.tiempoEstimadoMinutos === 'number'
    );
  };

  const isIncidenciaEntity = (entity: Record<string, unknown>): boolean => {
    if (typeof entity.id !== 'string') {
      return false;
    }

    if (typeof entity.recepcionId !== 'string') {
      return false;
    }

    return typeof entity.incidenciaId !== 'string';
  };

  const isDistribucionEntity = (entity: Record<string, unknown>): boolean => {
    if (typeof entity.id !== 'string') {
      return false;
    }

    if (!Array.isArray(entity.lineas)) {
      return false;
    }

    return (
      typeof entity.pedidoUsuarioId === 'string' ||
      (isRecord(entity.pedidoUsuario) &&
        typeof entity.pedidoUsuario.id === 'string')
    );
  };

  const activePedidoIds = entities
    .filter((entity) => isPedidoEntity(entity))
    .map((entity) => entity.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const activePendingPedidoIds = entities
    .filter(
      (entity) =>
        isPedidoEntity(entity) &&
        entity.estado === EstadoPedido.PENDIENTE_DE_APROBACION
    )
    .map((entity) => entity.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const activeReceivablePedidoIds = entities
    .filter(
      (entity) =>
        isPedidoEntity(entity) && entity.estado === EstadoPedido.POR_RECEPCIONAR
    )
    .map((entity) => entity.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  if (resolvedPath === '/pedidos') {
    context.set('pedidoListIds', activePedidoIds);
    context.set('pedidoPendingListIds', activePendingPedidoIds);
    context.set('pedidoReceivableListIds', activeReceivablePedidoIds);
  }

  const productoProveedorPrecioById =
    context.getState<Record<string, number>>('productoProveedorPrecioById') ||
    {};
  const productoUnidadById =
    context.getState<Record<string, UnidadIngrediente>>('productoUnidadById') ||
    {};
  let hasProductoProveedorPriceUpdates = false;
  let hasProductoUnidadUpdates = false;

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

  const toUnidadIngrediente = (
    value: unknown
  ): UnidadIngrediente | undefined => {
    switch (value) {
      case UnidadMedida.KG:
        return UnidadIngrediente.KILOGRAMO;
      case UnidadMedida.G:
        return UnidadIngrediente.GRAMO;
      case UnidadMedida.L:
        return UnidadIngrediente.LITRO;
      case UnidadMedida.ML:
        return UnidadIngrediente.MILILITRO;
      case UnidadMedida.UNIDAD:
      case UnidadMedida.PAQ:
        return UnidadIngrediente.PIEZA;
      default:
        return undefined;
    }
  };

  const rememberProductoUnidad = (
    idValue: unknown,
    unidadValue: unknown
  ): void => {
    if (typeof idValue !== 'string' || idValue.trim().length === 0) {
      return;
    }

    const unidadIngrediente = toUnidadIngrediente(unidadValue);
    if (!unidadIngrediente) {
      return;
    }

    if (productoUnidadById[idValue] === unidadIngrediente) {
      return;
    }

    productoUnidadById[idValue] = unidadIngrediente;
    hasProductoUnidadUpdates = true;
  };

  for (const entity of entities) {
    const id = entity.id;

    if (
      resolvedPath.startsWith('/admin/roles') ||
      resolvedPath.startsWith('/roles')
    ) {
      pushStateValue(context, 'roleIds', id);
      if (typeof id === 'string' && typeof entity.nombre === 'string') {
        const normalizedRoleName = entity.nombre.trim().toUpperCase();
        if (
          normalizedRoleName.length > 0 &&
          roleIdByName[normalizedRoleName] !== id
        ) {
          roleIdByName[normalizedRoleName] = id;
          hasRoleIdByNameUpdates = true;
        }
      }
    }
    if (resolvedPath.startsWith('/admin/permissions'))
      pushStateValue(context, 'permissionIds', id);

    if (resolvedPath.startsWith('/usuarios'))
      pushStateValue(context, 'usuarioIds', id);
    if (resolvedPath.startsWith('/proveedor'))
      pushStateValue(context, 'proveedorIds', id);
    if (resolvedPath.startsWith('/productos') && isProductoEntity(entity)) {
      pushStateValue(context, 'productoIds', id);
      pushStateValue(context, 'seedCapturedProductoIds', id);
      rememberProductoUnidad(entity.id, entity.unidad);
    }
    if (resolvedPath.startsWith('/producto-proveedor'))
      pushStateValue(context, 'productoProveedorIds', id);
    if (resolvedPath.startsWith('/producto-proveedor')) {
      rememberProductoProveedorPrice(
        entity.id,
        entity.precioUnitario || entity.precio || entity.nuevoPrecio
      );
      if (
        typeof entity.id === 'string' &&
        typeof entity.productoId === 'string'
      ) {
        pushStateValue(
          context,
          'productoProveedorToProductoPairs',
          `${entity.id}|${entity.productoId}`
        );
      }
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
      if (typeof entity.productoId === 'string') {
        pushStateValue(
          context,
          'productoToProveedorPairs',
          `${entity.productoId}|${entity.proveedorId}`
        );
      }
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
    if (
      resolvedPath.startsWith('/pedido-usuarios') &&
      isPedidoUsuarioEntity(entity)
    )
      pushStateValue(context, 'pedidoUsuarioIds', id);
    if (
      resolvedPath.startsWith('/purchase-batches') &&
      isPurchaseBatchEntity(entity)
    )
      pushStateValue(context, 'purchaseBatchIds', id);
    if (resolvedPath.startsWith('/pedidos') && isPedidoEntity(entity)) {
      pushStateValue(context, 'pedidoIds', id);
    }
    if (resolvedPath.startsWith('/recepciones'))
      pushStateValue(context, 'recepcionIds', id);
    if (resolvedPath.startsWith('/recepcion-productos'))
      pushStateValue(context, 'recepcionProductoIds', id);
    if (resolvedPath.startsWith('/albaranes'))
      pushStateValue(context, 'albaranIds', id);
    if (resolvedPath.startsWith('/incidencias-resueltas'))
      pushStateValue(context, 'incidenciaResueltaIds', id);
    if (
      resolvedPath.startsWith('/incidencias') &&
      !resolvedPath.startsWith('/incidencias-resueltas') &&
      isIncidenciaEntity(entity)
    )
      pushStateValue(context, 'incidenciaIds', id);
    if (resolvedPath.startsWith('/movimientos'))
      pushStateValue(context, 'movimientoIds', id);
    if (resolvedPath.startsWith('/recetas') && isRecetaEntity(entity))
      pushStateValue(context, 'recetaIds', id);
    if (resolvedPath.startsWith('/preparaciones'))
      pushStateValue(context, 'preparacionIds', id);
    if (
      resolvedPath.startsWith('/distribuciones') &&
      isDistribucionEntity(entity)
    )
      pushStateValue(context, 'distribucionIds', id);
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

    if (
      resolvedPath.startsWith('/plantillas-roles') &&
      typeof id === 'string'
    ) {
      pushStateValue(context, 'plantillaRolIds', id);

      const nombreValue =
        typeof entity.nombre === 'string'
          ? entity.nombre
          : typeof entity.name === 'string'
            ? entity.name
            : '';
      const nombre = nombreValue.toUpperCase();
      const isBaseTemplate = PROTECTED_PLANTILLA_NAMES.has(nombre);

      const esEditable =
        entity.esEditable === true ||
        entity.es_editable === true ||
        entity.esEditable === 'true' ||
        entity.es_editable === 'true';

      if (esEditable && !isBaseTemplate) {
        pushStateValue(context, 'plantillaRolMutableIds', id);
      } else {
        removeStateValue(context, 'plantillaRolMutableIds', id);
      }
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
        const alergenoValue =
          typeof item === 'string'
            ? item.trim()
            : isRecord(item) && typeof item.alergeno === 'string'
              ? item.alergeno.trim()
              : '';

        if (alergenoValue.length > 0) {
          pushStateValue(
            context,
            'productoAlergenoPairs',
            `${entity.id}|${alergenoValue}`
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
            if (typeof entity.id === 'string') {
              pushStateValue(
                context,
                'productoProveedorToProductoPairs',
                `${pp.id}|${entity.id}`
              );
              pushStateValue(
                context,
                'productoToProveedorPairs',
                `${entity.id}|${pp.proveedorId}`
              );
            }
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
      const pedidoEstado = (Object.values(EstadoPedido) as string[]).find(
        (value) => value === estado
      ) as EstadoPedido | undefined;

      if (resolvedPath.startsWith('/pedidos') && isPedidoEntity(entity)) {
        if (pedidoEstado === EstadoPedido.PENDIENTE_DE_APROBACION) {
          pushStateValue(context, 'pedidoPendienteIds', entity.id);
        } else {
          removeStateValue(context, 'pedidoPendienteIds', entity.id);
        }

        if (pedidoEstado === EstadoPedido.CANCELADO) {
          pushStateValue(context, 'pedidoCanceladoIds', entity.id);
        } else {
          removeStateValue(context, 'pedidoCanceladoIds', entity.id);
        }

        if (pedidoEstado === EstadoPedido.POR_RECEPCIONAR) {
          pushStateValue(context, 'pedidoReceivableIds', entity.id);
        } else {
          removeStateValue(context, 'pedidoReceivableIds', entity.id);
        }
      }
      if (
        resolvedPath.startsWith('/pedido-usuarios') &&
        isPedidoUsuarioEntity(entity)
      ) {
        const pedidoUsuarioEstado = (
          Object.values(EstadoPedidoUsuario) as string[]
        ).find((value) => value === estado) as EstadoPedidoUsuario | undefined;

        if (pedidoUsuarioEstado === EstadoPedidoUsuario.PENDIENTE) {
          pushStateValue(context, 'pedidoUsuarioPendienteIds', entity.id);
        } else {
          removeStateValue(context, 'pedidoUsuarioPendienteIds', entity.id);
        }

        if (pedidoUsuarioEstado === EstadoPedidoUsuario.CANCELADO) {
          pushStateValue(context, 'pedidoUsuarioCanceladoIds', entity.id);
        } else {
          removeStateValue(context, 'pedidoUsuarioCanceladoIds', entity.id);
        }
      }
      if (
        resolvedPath.startsWith('/purchase-batches') &&
        isPurchaseBatchEntity(entity)
      ) {
        const batchEstado = (Object.values(EstadoLote) as string[]).find(
          (value) => value === estado
        ) as EstadoLote | undefined;

        if (batchEstado === EstadoLote.PENDIENTE) {
          pushStateValue(context, 'purchaseBatchPendienteIds', entity.id);
        } else {
          removeStateValue(context, 'purchaseBatchPendienteIds', entity.id);
        }

        if (batchEstado === EstadoLote.CANCELADO) {
          pushStateValue(context, 'purchaseBatchCanceladoIds', entity.id);
        } else {
          removeStateValue(context, 'purchaseBatchCanceladoIds', entity.id);
        }
      }
      if (resolvedPath.startsWith('/preparaciones')) {
        if (estado === 'PENDIENTE')
          pushStateValue(context, 'preparacionPendienteIds', entity.id);
        if (estado === 'EN_PROCESO')
          pushStateValue(context, 'preparacionEnProcesoIds', entity.id);
      }

      if (
        resolvedPath.startsWith('/distribuciones') &&
        isDistribucionEntity(entity)
      ) {
        if (estado === 'PREPARADA' || estado === 'BORRADOR') {
          pushStateValue(context, 'distribucionPreparadaIds', entity.id);
        } else {
          removeStateValue(context, 'distribucionPreparadaIds', entity.id);
        }

        if (estado === 'CANCELADA') {
          pushStateValue(context, 'distribucionCanceladaIds', entity.id);
        } else {
          removeStateValue(context, 'distribucionCanceladaIds', entity.id);
        }

        if (estado === 'ENTREGADA' || estado === 'PARCIAL') {
          pushStateValue(context, 'distribucionEntregadaIds', entity.id);
        } else {
          removeStateValue(context, 'distribucionEntregadaIds', entity.id);
        }
      }
    }

    if (
      resolvedPath.startsWith('/incidencias') &&
      !resolvedPath.startsWith('/incidencias-resueltas') &&
      isIncidenciaEntity(entity)
    ) {
      const incidenciaId = entity.id as string;
      const incidenciaEstado =
        typeof entity.estado === 'string'
          ? entity.estado.trim().toLowerCase()
          : '';
      if (incidenciaEstado.length > 0) {
        pushStateValue(context, 'incidenciaObservedEstados', incidenciaEstado);
      }

      if (Array.isArray(entity.lineas)) {
        for (const linea of entity.lineas) {
          if (!isRecord(linea)) {
            continue;
          }

          const pedidoProductoLineaId =
            (typeof linea.pedidoProductoId === 'string' &&
              linea.pedidoProductoId) ||
            (typeof linea.idPedidoProducto === 'string' &&
              linea.idPedidoProducto) ||
            (isRecord(linea.pedidoProducto) &&
            typeof linea.pedidoProducto.id === 'string'
              ? linea.pedidoProducto.id
              : '');

          if (pedidoProductoLineaId.length > 0) {
            pushStateValue(
              context,
              'incidenciaToPedidoProductoPairs',
              `${incidenciaId}|${pedidoProductoLineaId}`
            );
          }
        }
      }

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
        removeStateValue(context, 'incidenciaPendienteIds', incidenciaId);
      } else {
        pushStateValue(context, 'incidenciaPendienteIds', incidenciaId);
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

  if (hasProductoUnidadUpdates) {
    context.set('productoUnidadById', productoUnidadById);
  }

  if (hasRoleIdByNameUpdates) {
    context.set('seedRoleIdByName', roleIdByName);
  }
}
