import { SeedContext } from './seed-context';
import { HttpMethod } from './massive.types';
import {
  consumeRequiredStateValue,
  consumeStateValue,
  getStateArray,
  pickRequiredStateValue,
  pushStateValue,
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

  if (path.startsWith('/admin/users')) {
    const adminRouteTargetIds = getStateArray(
      context,
      'seedAdminRouteTargetUserIds'
    );
    if (adminRouteTargetIds.length > 0) {
      return adminRouteTargetIds[iteration % adminRouteTargetIds.length];
    }
    return pick('usuarioIds');
  }
  if (path.startsWith('/usuarios')) {
    const mutableUserIds = getStateArray(context, 'seedMutableUserIds');
    if (mutableUserIds.length > 0) {
      if (consume) {
        const consumed = consumeStateValue(context, 'seedMutableUserIds', '');
        if (consumed) {
          pushStateValue(context, 'seedMutableUserIds', consumed);
          return consumed;
        }
      }

      return mutableUserIds[iteration % mutableUserIds.length];
    }

    return pick('usuarioIds');
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
  if (path.startsWith('/profesores/slots')) return pick('profesorSlotIds');
  if (path.startsWith('/profesores/alumnos')) return pick('alumnoIds');
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
    const createdPendings = getStateArray(
      context,
      'seedCreatedPedidoPendienteIds'
    );

    if (method === 'DELETE') {
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
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPedidoPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'pedidoPendienteIds');
    }
    if (path.endsWith('/cancelar')) {
      if (createdPendings.length > 0) {
        return consumeRequiredStateValue(
          context,
          'seedCreatedPedidoPendienteIds'
        );
      }
      return consumeRequiredStateValue(context, 'pedidoPendienteIds');
    }
    if (path.endsWith('/fecha-entrega')) {
      if (createdPendings.length > 0) {
        return createdPendings[iteration % createdPendings.length];
      }
      return pick('pedidoIds');
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
      return pick('incidenciaIds');
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
  if (path.startsWith('/merma')) return pick('mermaIds');
  if (path.startsWith('/archivos')) return pick('archivoIds');

  throw new Error(`[seed-massive] No hay selector de ID para ruta ${path}`);
}
