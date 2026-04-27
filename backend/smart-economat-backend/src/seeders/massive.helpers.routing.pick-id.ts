import { SeedContext } from './seed-context';
import { HttpMethod } from './massive.types';
import {
  consumeRequiredStateValue,
  consumeStateValue,
  getStateArray,
  pickRequiredStateValue,
  removeStateValue,
} from './massive.state';

export function pickIdForRoute(
  context: SeedContext,
  path: string,
  method: HttpMethod,
  iteration: number
): string {
  const consume = method === 'DELETE';

  const pick = (key: string): string => {
    if (consume) {
      return consumeRequiredStateValue(context, key);
    }
    return pickRequiredStateValue(context, key, iteration);
  };

  if (path.startsWith('/admin/users') || path.startsWith('/usuarios')) {
    const protectedIds = getStateArray(context, 'seedProtectedUserIds');
    const pickFiltered = (key: string): string => {
      const allIds = getStateArray(context, key);
      const safeIds = allIds.filter((id) => !protectedIds.includes(id));

      if (safeIds.length === 0) {
        return pick(key);
      }

      if (consume) {
        const idToConsume = safeIds[0] || '';
        if (idToConsume) {
          removeStateValue(context, key, idToConsume);
        }
        return idToConsume;
      }

      return safeIds[iteration % safeIds.length] || '';
    };

    if (path.startsWith('/admin/users')) {
      const adminRouteTargetIds = getStateArray(
        context,
        'seedAdminRouteTargetUserIds'
      );
      if (adminRouteTargetIds.length > 0) {
        return adminRouteTargetIds[iteration % adminRouteTargetIds.length];
      }
      return pickFiltered('usuarioIds');
    }

    const mutableUserIds = getStateArray(context, 'seedMutableUserIds');
    const safeMutableIds = mutableUserIds.filter(
      (id) => !protectedIds.includes(id)
    );

    if (safeMutableIds.length > 0) {
      if (consume) {
        const consumed = safeMutableIds[0] || '';
        if (consumed) {
          removeStateValue(context, 'seedMutableUserIds', consumed);
          return consumed;
        }
      }
      return safeMutableIds[iteration % safeMutableIds.length] || '';
    }

    return pickFiltered('usuarioIds');
  }
  if (path.startsWith('/profesores/admin-slots')) {
    if (consume) {
      const deletableAdminSlotIds = getStateArray(
        context,
        'seedCreatedDeletableProfesorAdminSlotIds'
      );
      if (deletableAdminSlotIds.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedDeletableProfesorAdminSlotIds'
        );
      }
    }
    return pick('profesorAdminSlotIds');
  }
  if (path.startsWith('/profesores/slots')) {
    if (method === 'PATCH') {
      const fixedProfesorSlotId =
        context.getState<string>('seedFixedProfesorSlotId') || '';
      if (fixedProfesorSlotId) {
        return fixedProfesorSlotId;
      }
    }

    const profesorCount =
      context.getState<number>('seedProfesorActorCount') || 1;
    const cursor = context.getState<number>('seedProfesorSlotCursor') || 0;
    context.set('seedProfesorSlotCursor', cursor + 1);
    const pIdx = cursor % profesorCount;

    const ownedIdsJson =
      context.getState<string>(`seedProfesorOwnedSlotIds:${pIdx}`) || '[]';
    const ownedIds: string[] = JSON.parse(ownedIdsJson);

    if (consume) {
      const deletableProfesorSlotIds = getStateArray(
        context,
        'seedCreatedDeletableProfesorSlotIds'
      );
      const ownedDeletableIds = ownedIds.filter((id) =>
        deletableProfesorSlotIds.includes(id)
      );

      if (ownedDeletableIds.length > 0) {
        return ownedDeletableIds[iteration % ownedDeletableIds.length] || '';
      }

      if (deletableProfesorSlotIds.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedDeletableProfesorSlotIds'
        );
      }
    }

    if (ownedIds.length > 0) {
      return ownedIds[iteration % ownedIds.length] || '';
    }

    return pick('profesorSlotIds');
  }
  if (path.startsWith('/profesores/alumnos')) {
    const profesorCount =
      context.getState<number>('seedProfesorActorCount') || 1;
    const cursor = context.getState<number>('seedProfesorAlumnoCursor') || 0;
    context.set('seedProfesorAlumnoCursor', cursor + 1);
    const pIdx = cursor % profesorCount;

    const ownedIdsJson =
      context.getState<string>(`seedProfesorOwnedAlumnoIds:${pIdx}`) || '[]';
    const ownedIds: string[] = JSON.parse(ownedIdsJson);
    const fixedAlumnoId = context.getState<string>('seedFixedAlumnoId') || '';
    const mutableOwnedIds = ownedIds.filter((id) => id !== fixedAlumnoId);

    if (mutableOwnedIds.length > 0) {
      return mutableOwnedIds[iteration % mutableOwnedIds.length] || '';
    }
    if (ownedIds.length > 0) {
      return ownedIds[iteration % ownedIds.length] || '';
    }

    return pick('alumnoIds');
  }
  if (path.startsWith('/proveedor')) {
    if (consume) {
      const deletableProveedorIds = getStateArray(
        context,
        'seedCreatedDeletableProveedorIds'
      );
      if (deletableProveedorIds.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedDeletableProveedorIds'
        );
      }
    }

    const createdProveedorIds = getStateArray(
      context,
      'seedCreatedProveedorIds'
    );
    if (createdProveedorIds.length > 0) {
      return createdProveedorIds[iteration % createdProveedorIds.length];
    }
    return pick('proveedorIds');
  }
  if (path.startsWith('/productos')) {
    if (consume) {
      const deletableProductoIds = getStateArray(
        context,
        'seedCreatedDeletableProductoIds'
      );
      if (deletableProductoIds.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedDeletableProductoIds'
        );
      }
    }

    const createdProductoIds = getStateArray(context, 'seedCreatedProductoIds');
    if (createdProductoIds.length > 0) {
      return createdProductoIds[iteration % createdProductoIds.length];
    }
    return pick('productoIds');
  }
  if (path.startsWith('/producto-proveedor')) {
    const createdProductoProveedorIds = getStateArray(
      context,
      'seedCreatedProductoProveedorIds'
    );
    if (createdProductoProveedorIds.length > 0) {
      return createdProductoProveedorIds[
        iteration % createdProductoProveedorIds.length
      ];
    }
    return pick('productoProveedorIds');
  }
  if (path.startsWith('/producto-alergenos')) {
    const createdProductoIds = getStateArray(context, 'seedCreatedProductoIds');
    if (createdProductoIds.length > 0) {
      return createdProductoIds[iteration % createdProductoIds.length];
    }
    return pick('productoIds');
  }
  if (path.startsWith('/historial-precio')) return pick('historialPrecioIds');
  if (path.startsWith('/ubicacion')) return pick('ubicacionIds');
  if (path.startsWith('/inventario')) {
    if (consume) {
      const deletableInventarioIds = getStateArray(
        context,
        'seedCreatedDeletableInventarioIds'
      );
      if (deletableInventarioIds.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedDeletableInventarioIds'
        );
      }
    }

    if (!consume) {
      const createdInventarioIds = getStateArray(
        context,
        'seedCreatedInventarioIds'
      );
      if (createdInventarioIds.length > 0) {
        return createdInventarioIds[iteration % createdInventarioIds.length];
      }
    }

    return pick('inventarioIds');
  }
  if (path.startsWith('/pedido-usuarios')) {
    if (path.endsWith('/restaurar')) {
      const pendientesCreados = getStateArray(
        context,
        'seedCreatedPedidoUsuarioPendienteIds'
      );
      if (pendientesCreados.length > 0) {
        return (
          pendientesCreados[iteration % pendientesCreados.length] ||
          pendientesCreados[0] ||
          ''
        );
      }

      const pendientes = getStateArray(context, 'pedidoUsuarioPendienteIds');
      if (pendientes.length > 0) {
        return pendientes[iteration % pendientes.length] || pendientes[0] || '';
      }

      const lastCanceladoId =
        context.getState<string>('seedLastPedidoUsuarioCanceladoId') || '';
      if (lastCanceladoId) {
        return lastCanceladoId;
      }

      const cancelados = getStateArray(context, 'pedidoUsuarioCanceladoIds');
      if (cancelados.length > 0) {
        return cancelados[iteration % cancelados.length] || cancelados[0] || '';
      }

      const createdPedidoUsuarioIds = getStateArray(
        context,
        'seedCreatedPedidoUsuarioIds'
      );
      if (createdPedidoUsuarioIds.length > 0) {
        return (
          createdPedidoUsuarioIds[iteration % createdPedidoUsuarioIds.length] ||
          createdPedidoUsuarioIds[0] ||
          ''
        );
      }

      return pick('pedidoUsuarioIds');
    }

    if (path.endsWith('/aceptar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPedidoUsuarioPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPedidoUsuarioPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'pedidoUsuarioPendienteIds');
    }
    if (path.endsWith('/cancelar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPedidoUsuarioPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPedidoUsuarioPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'pedidoUsuarioPendienteIds');
    }

    if (method === 'PATCH') {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPedidoUsuarioPendienteIds'
      );
      if (createdPendings.length > 0) {
        return createdPendings[iteration % createdPendings.length];
      }

      return consumeRequiredStateValue(
        context,
        'seedCreatedPedidoUsuarioPendienteIds'
      );
    }

    if (method === 'DELETE') {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPedidoUsuarioPendienteIds'
      );

      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPedidoUsuarioPendienteIds'
        );
      }

      const pendientes = getStateArray(context, 'pedidoUsuarioPendienteIds');
      if (pendientes.length > 0) {
        return consumeRequiredStateValue(context, 'pedidoUsuarioPendienteIds');
      }
    }

    const createdPedidoUsuarioIds = getStateArray(
      context,
      'seedCreatedPedidoUsuarioIds'
    );
    if (createdPedidoUsuarioIds.length > 0) {
      return createdPedidoUsuarioIds[
        iteration % createdPedidoUsuarioIds.length
      ];
    }

    return pick('pedidoUsuarioIds');
  }
  if (path.startsWith('/purchase-batches')) {
    if (path.endsWith('/restaurar')) {
      const cancelados = getStateArray(context, 'purchaseBatchCanceladoIds');
      if (cancelados.length > 0) {
        return cancelados[iteration % cancelados.length] || cancelados[0] || '';
      }

      const createdBatchIds = getStateArray(
        context,
        'seedCreatedPurchaseBatchIds'
      );
      if (createdBatchIds.length > 0) {
        return (
          createdBatchIds[iteration % createdBatchIds.length] ||
          createdBatchIds[0] ||
          ''
        );
      }

      return pick('purchaseBatchIds');
    }

    if (method === 'PATCH' && /^\/purchase-batches\/[^/]+$/.test(path)) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPurchaseBatchPendienteIds'
      );

      if (createdPendings.length > 0) {
        return pickRequiredStateValue(
          context,
          'seedCreatedPurchaseBatchPendienteIds',
          iteration
        );
      }

      return pickRequiredStateValue(
        context,
        'purchaseBatchPendienteIds',
        iteration
      );
    }

    if (path.endsWith('/aceptar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPurchaseBatchPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPurchaseBatchPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'purchaseBatchPendienteIds');
    }
    if (path.endsWith('/tramitar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPurchaseBatchPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPurchaseBatchPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'purchaseBatchPendienteIds');
    }
    if (path.endsWith('/cancelar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPurchaseBatchPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPurchaseBatchPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'purchaseBatchPendienteIds');
    }
    return pick('purchaseBatchIds');
  }
  if (path.startsWith('/pedidos')) {
    if (path.endsWith('/restaurar')) {
      const cancelados = getStateArray(context, 'pedidoCanceladoIds');
      if (cancelados.length > 0) {
        return cancelados[iteration % cancelados.length] || cancelados[0] || '';
      }

      const listedPedidoIds = getStateArray(context, 'pedidoListIds');
      if (listedPedidoIds.length > 0) {
        return listedPedidoIds[iteration % listedPedidoIds.length] || '';
      }

      return pick('pedidoIds');
    }

    const preparedPendings = getStateArray(
      context,
      'seedPreparedPedidoPendienteIds'
    );
    const createdPendings = getStateArray(
      context,
      'seedCreatedPedidoPendienteIds'
    );

    if (method === 'GET' && /^\/pedidos\/[^/]+$/.test(path)) {
      const listedPedidoIds = getStateArray(context, 'pedidoListIds');
      if (listedPedidoIds.length > 0) {
        return (
          listedPedidoIds[iteration % listedPedidoIds.length] ||
          pick('pedidoIds')
        );
      }
      return pick('pedidoIds');
    }

    if (method === 'DELETE') {
      const deletablePedidoIds = getStateArray(
        context,
        'seedCreatedDeletablePedidoIds'
      );
      if (deletablePedidoIds.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedDeletablePedidoIds'
        );
      }

      const pendingPedidos = getStateArray(context, 'pedidoPendienteIds');
      if (pendingPedidos.length > 0) {
        return consumeRequiredStateValue(context, 'pedidoPendienteIds');
      }

      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPedidoPendienteIds'
        );
      }

      throw new Error(
        '[seed-massive] No hay pedidos pendientes disponibles para DELETE /pedidos/:id'
      );
    }

    if (path.endsWith('/aceptar')) {
      if (preparedPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedPreparedPedidoPendienteIds'
        );
      }
      const listedPendingPedidoIds = getStateArray(
        context,
        'pedidoPendingListIds'
      );
      if (listedPendingPedidoIds.length > 0) {
        return consumeRequiredStateValue(context, 'pedidoPendingListIds');
      }
      const pendingPedidoIds = getStateArray(context, 'pedidoPendienteIds');
      if (pendingPedidoIds.length > 0) {
        return consumeRequiredStateValue(context, 'pedidoPendienteIds');
      }
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPedidoPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'pedidoPendienteIds');
    }
    if (path.endsWith('/cancelar')) {
      if (preparedPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedPreparedPedidoPendienteIds'
        );
      }
      const listedPendingPedidoIds = getStateArray(
        context,
        'pedidoPendingListIds'
      );
      if (listedPendingPedidoIds.length > 0) {
        return consumeRequiredStateValue(context, 'pedidoPendingListIds');
      }
      const pendingPedidoIds = getStateArray(context, 'pedidoPendienteIds');
      if (pendingPedidoIds.length > 0) {
        return consumeRequiredStateValue(context, 'pedidoPendienteIds');
      }
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPedidoPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'pedidoPendienteIds');
    }
    if (path.endsWith('/fecha-entrega')) {
      if (preparedPendings.length > 0) {
        return preparedPendings[iteration % preparedPendings.length];
      }
      const listedPendingPedidoIds = getStateArray(
        context,
        'pedidoPendingListIds'
      );
      if (listedPendingPedidoIds.length > 0) {
        return listedPendingPedidoIds[
          iteration % listedPendingPedidoIds.length
        ];
      }
      if (createdPendings.length > 0) {
        return createdPendings[iteration % createdPendings.length];
      }
      return pick('pedidoIds');
    }

    if (method === 'PATCH' && /^\/pedidos\/[^/]+$/.test(path)) {
      if (preparedPendings.length > 0) {
        return preparedPendings[iteration % preparedPendings.length];
      }
      const listedPedidoIds = getStateArray(context, 'pedidoListIds');
      if (listedPedidoIds.length > 0) {
        return (
          listedPedidoIds[iteration % listedPedidoIds.length] ||
          pick('pedidoIds')
        );
      }
    }

    if (createdPendings.length > 0) {
      return createdPendings[iteration % createdPendings.length];
    }

    return pick('pedidoIds');
  }
  if (path.startsWith('/recepciones')) {
    if (consume) {
      const deletableRecepcionIds = getStateArray(
        context,
        'seedCreatedDeletableRecepcionIds'
      );
      if (deletableRecepcionIds.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedDeletableRecepcionIds'
        );
      }
    }

    return pick('recepcionIds');
  }
  if (path.startsWith('/recepcion-productos'))
    return pick('recepcionProductoIds');
  if (path.startsWith('/albaranes')) return pick('albaranIds');
  if (path.startsWith('/incidencias-resueltas')) {
    const createdIncidenciaResueltaIds = getStateArray(
      context,
      'seedCreatedIncidenciaResueltaIds'
    );

    if (createdIncidenciaResueltaIds.length > 0) {
      if (consume) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedIncidenciaResueltaIds'
        );
      }
      return createdIncidenciaResueltaIds[
        iteration % createdIncidenciaResueltaIds.length
      ];
    }

    return pick('incidenciaResueltaIds');
  }
  if (path.startsWith('/incidencias')) {
    if (path.endsWith('/resolver')) {
      const pendingIncidenciaId = consumeStateValue(
        context,
        'incidenciaPendienteIds',
        ''
      );
      if (pendingIncidenciaId) {
        return pendingIncidenciaId;
      }
      return consumeRequiredStateValue(context, 'incidenciaPendienteIds');
    }

    if (method === 'PATCH' || method === 'DELETE') {
      const pendingIncidencias = getStateArray(
        context,
        'incidenciaPendienteIds'
      );
      if (pendingIncidencias.length > 0) {
        if (method === 'DELETE') {
          return consumeRequiredStateValue(context, 'incidenciaPendienteIds');
        }
        return pendingIncidencias[iteration % pendingIncidencias.length];
      }
    }

    return pick('incidenciaIds');
  }
  if (path.startsWith('/movimientos')) return pick('movimientoIds');
  if (path.startsWith('/recetas')) {
    const createdRecetaIds = getStateArray(context, 'seedCreatedRecetaIds');
    if (createdRecetaIds.length > 0) {
      return createdRecetaIds[iteration % createdRecetaIds.length];
    }
    return pick('recetaIds');
  }
  if (path.startsWith('/produccion/lote')) {
    if (path.endsWith('/consumir')) {
      const consumirTargetId = context.getState<string>(
        'seedConsumirTargetLoteId'
      );
      if (consumirTargetId) {
        return consumirTargetId;
      }
    }
    const createdLoteIds = getStateArray(
      context,
      'seedCreatedProduccionLoteIds'
    );
    if (createdLoteIds.length > 0) {
      return createdLoteIds[iteration % createdLoteIds.length];
    }
    return pick('produccionLoteIds');
  }
  if (path.startsWith('/produccion')) {
    const createdLoteIds = getStateArray(
      context,
      'seedCreatedProduccionLoteIds'
    );
    if (createdLoteIds.length > 0) {
      return createdLoteIds[iteration % createdLoteIds.length];
    }
    return pick('produccionLoteIds');
  }
  if (path.startsWith('/preparaciones')) {
    if (path.endsWith('/iniciar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPreparacionPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPreparacionPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'preparacionPendienteIds');
    }

    if (path.endsWith('/finalizar')) {
      const createdInProgress = getStateArray(
        context,
        'seedCreatedPreparacionEnProcesoIds'
      );
      if (createdInProgress.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPreparacionEnProcesoIds'
        );
      }
      return consumeRequiredStateValue(context, 'preparacionEnProcesoIds');
    }

    if (path.endsWith('/cancelar')) {
      const createdPendings = getStateArray(
        context,
        'seedCreatedPreparacionPendienteIds'
      );
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPreparacionPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'preparacionPendienteIds');
    }

    const createdPreparaciones = getStateArray(
      context,
      'seedCreatedPreparacionIds'
    );
    if (createdPreparaciones.length > 0) {
      return createdPreparaciones[iteration % createdPreparaciones.length];
    }

    return pick('preparacionIds');
  }
  if (path.startsWith('/distribuciones')) {
    const distribucionesPreparadas = getStateArray(
      context,
      'distribucionPreparadaIds'
    );

    if (path.endsWith('/confirmar')) {
      if (distribucionesPreparadas.length > 0) {
        return (
          distribucionesPreparadas[
            iteration % distribucionesPreparadas.length
          ] ||
          distribucionesPreparadas[0] ||
          ''
        );
      }

      throw new Error(
        '[seed-massive] No hay distribuciones preparadas disponibles para confirmar'
      );
    }

    if (path.endsWith('/cancelar')) {
      if (distribucionesPreparadas.length > 0) {
        return (
          distribucionesPreparadas[
            iteration % distribucionesPreparadas.length
          ] ||
          distribucionesPreparadas[0] ||
          ''
        );
      }

      throw new Error(
        '[seed-massive] No hay distribuciones preparadas disponibles para cancelar'
      );
    }

    if (method === 'PATCH' && distribucionesPreparadas.length > 0) {
      return (
        distribucionesPreparadas[iteration % distribucionesPreparadas.length] ||
        distribucionesPreparadas[0] ||
        ''
      );
    }

    const distribucionesCreadas = getStateArray(
      context,
      'seedCreatedDistribucionIds'
    );
    if (distribucionesCreadas.length > 0) {
      return (
        distribucionesCreadas[iteration % distribucionesCreadas.length] ||
        distribucionesCreadas[0] ||
        ''
      );
    }

    return pick('distribucionIds');
  }
  if (path.startsWith('/plantillas-roles')) {
    const plantillaMutableIds = getStateArray(
      context,
      'plantillaRolMutableIds'
    );
    const plantillaRolIds = getStateArray(context, 'plantillaRolIds');

    if (consume) {
      if (plantillaMutableIds.length > 0) {
        return consumeRequiredStateValue(context, 'plantillaRolMutableIds');
      }

      throw new Error(
        '[seed-massive] No hay plantillas editables disponibles para rutas destructivas de /plantillas-roles'
      );
    }

    if (plantillaMutableIds.length > 0) {
      return (
        plantillaMutableIds[iteration % plantillaMutableIds.length] ||
        plantillaMutableIds[0] ||
        ''
      );
    }

    if (method === 'GET' && plantillaRolIds.length > 0) {
      return (
        plantillaRolIds[iteration % plantillaRolIds.length] ||
        plantillaRolIds[0] ||
        ''
      );
    }

    throw new Error(
      '[seed-massive] No hay plantillas disponibles en estado para resolver rutas /plantillas-roles/:id'
    );
  }
  if (path.startsWith('/roles/users/')) {
    return pick('usuarioIds');
  }
  if (path.startsWith('/roles')) {
    const roleIds = getStateArray(context, 'roleIds');
    const createdRoleIds = getStateArray(context, 'seedCreatedRoleIds');
    const roleIdByName =
      context.getState<Record<string, string>>('seedRoleIdByName') || {};
    const systemRoleIds = new Set(
      ['SUPER_ADMIN', 'ADMIN', 'PROFESOR', 'ALUMNO']
        .map((roleName) => roleIdByName[roleName])
        .filter(
          (roleId): roleId is string =>
            typeof roleId === 'string' && roleId.trim().length > 0
        )
    );
    const mutableRoleIds = roleIds.filter((id) => !systemRoleIds.has(id));

    if (method === 'GET') {
      return pick('roleIds');
    }

    if (createdRoleIds.length > 0) {
      return (
        createdRoleIds[iteration % createdRoleIds.length] ||
        createdRoleIds[0] ||
        ''
      );
    }

    if (mutableRoleIds.length > 0) {
      if (consume) {
        return (
          consumeStateValue(context, 'roleMutableIds', '') ||
          mutableRoleIds[iteration % mutableRoleIds.length] ||
          mutableRoleIds[0] ||
          ''
        );
      }

      return (
        mutableRoleIds[iteration % mutableRoleIds.length] ||
        mutableRoleIds[0] ||
        ''
      );
    }

    throw new Error(
      '[seed-massive] No hay roleIds mutables disponibles para rutas /roles de escritura'
    );
  }
  if (path.startsWith('/permisos')) {
    return pick('permissionIds');
  }
  if (path.startsWith('/merma')) return pick('mermaIds');
  if (path.startsWith('/archivos')) return pick('archivoIds');

  throw new Error(`[seed-massive] No hay selector de ID para ruta ${path}`);
}
