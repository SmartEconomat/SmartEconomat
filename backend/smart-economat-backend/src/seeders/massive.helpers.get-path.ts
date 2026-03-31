import { SeedContext } from './seed-context';
import { getStateArray, pickRequiredStateValue } from './massive.state';
import { supportsPagination } from './massive.helpers.routing.tokens';

export function buildGetPath(
  context: SeedContext,
  resolvedPath: string,
  iteration: number
): string {
  if (resolvedPath === '/movimientos/historial') {
    const movimientoUserIds = getStateArray(context, 'movimientoUserIds');
    if (movimientoUserIds.length > 0) {
      const userId =
        movimientoUserIds[iteration % movimientoUserIds.length] || '';
      if (userId) {
        return `${resolvedPath}?userId=${userId}&page=1&limit=20`;
      }
    }

    const actorUserPools = [
      getStateArray(context, 'seedAdminUserIds'),
      getStateArray(context, 'seedProfesorUserIds'),
      getStateArray(context, 'seedAlumnoUserIds'),
    ].filter((pool) => pool.length > 0);

    if (actorUserPools.length > 0) {
      const mergedUsers = actorUserPools.flat();
      const userId = mergedUsers[iteration % mergedUsers.length] || '';
      if (userId) {
        return `${resolvedPath}?userId=${userId}&page=1&limit=20`;
      }
    }

    const entityTypePairs = getStateArray(
      context,
      'movimientoEntidadTipoPairs'
    );
    if (entityTypePairs.length > 0) {
      const pair = entityTypePairs[iteration % entityTypePairs.length] || '';
      const [entityId] = pair.split('|');

      if (entityId) {
        return `${resolvedPath}?entityId=${entityId}&page=1&limit=20`;
      }
    }

    const movementEntityIds = getStateArray(context, 'movimientoEntidadIds');
    if (movementEntityIds.length > 0) {
      const entityId =
        movementEntityIds[iteration % movementEntityIds.length] || '';
      if (entityId) {
        return `${resolvedPath}?entityId=${entityId}&page=1&limit=20`;
      }
    }

    const fallbackEntityId = pickRequiredStateValue(
      context,
      'productoProveedorIds',
      iteration
    );
    return `${resolvedPath}?entityId=${fallbackEntityId}&page=1&limit=20`;
  }

  if (resolvedPath === '/recepciones/reporte-pdf') {
    const recepcionId = pickRequiredStateValue(
      context,
      'recepcionIds',
      iteration
    );
    return `${resolvedPath}?tipo=recepcion&recepcionId=${recepcionId}`;
  }

  if (
    resolvedPath.startsWith('/pedido-usuarios/') &&
    resolvedPath.endsWith('/pdf')
  ) {
    return `${resolvedPath}?incluirCancelados=true&paginaPorProveedor=false`;
  }

  if (
    resolvedPath.startsWith('/purchase-batches/') &&
    resolvedPath.endsWith('/pdf')
  ) {
    return `${resolvedPath}?incluirCancelados=true&paginaPorProveedor=false`;
  }

  if (resolvedPath === '/recetas/export/pdf') {
    const preferredRecetaIds = getStateArray(context, 'seedCreatedRecetaIds');
    const fallbackRecetaIds = getStateArray(context, 'recetaIds');
    const sourceRecetaIds =
      preferredRecetaIds.length > 0 ? preferredRecetaIds : fallbackRecetaIds;
    const recetaIds = sourceRecetaIds.slice(0, 3);
    if (recetaIds.length > 0) {
      return `${resolvedPath}?ids=${recetaIds.join(',')}`;
    }
  }

  if (resolvedPath === '/producto-proveedor/search') {
    return `${resolvedPath}?q=seed&limit=20&offset=0`;
  }

  if (resolvedPath === '/export/movimientos/xlsx') {
    return `${resolvedPath}?maxRows=10000&fechaDesde=2100-01-01T00:00:00.000Z`;
  }

  if (
    resolvedPath === '/export/pedidos/pdf' ||
    resolvedPath === '/export/pedidos/xlsx'
  ) {
    return `${resolvedPath}?maxRows=10000&fechaDesde=2100-01-01T00:00:00.000Z`;
  }

  if (resolvedPath === '/export/usuarios/xlsx') {
    return `${resolvedPath}?maxRows=10000&searchTerm=__seed_no_match__`;
  }

  if (supportsPagination(resolvedPath)) {
    return `${resolvedPath}${resolvedPath.includes('?') ? '&' : '?'}limit=25&page=1`;
  }

  return resolvedPath;
}
