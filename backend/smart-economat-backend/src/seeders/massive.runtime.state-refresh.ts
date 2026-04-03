import * as crypto from 'crypto';
import AppDataSource from '../config/typeorm.config';
import { EstadoLote } from '../modules/pedido/enums/estado-lote.enum';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { SeedContext } from './seed-context';
import { RequestResult } from './massive.types';
import {
  getRequiredStateString,
  getStateArray,
  pushStateValue,
  removeStateValue,
  toEntityArray,
} from './massive.helpers';
import { deterministicToken, seedDateIso } from './deterministic.seed-data';

function removePairsForUser(
  context: SeedContext,
  key: string,
  userId: string
): void {
  const pairs = getStateArray(context, key);
  for (const pair of pairs) {
    if (pair.startsWith(`${userId}|`)) {
      removeStateValue(context, key, pair);
    }
  }
}

function removePairsContainingId(
  context: SeedContext,
  key: string,
  targetId: string
): void {
  const pairs = getStateArray(context, key);
  for (const pair of pairs) {
    const parts = pair.split('|');
    if (parts.includes(targetId)) {
      removeStateValue(context, key, pair);
    }
  }
}

function buildResetPasswordSeedUpdate(
  resetPasswordOtp: string
): Partial<Usuario> {
  return {
    resetPasswordOtp,
    resetPasswordOtpExpires: new Date(seedDateIso(3650)),
  };
}

export async function refreshStateAfterOperation(
  context: SeedContext,
  result: RequestResult
): Promise<void> {
  const path = result.resolvedPath;
  if (!result.ok) {
    return;
  }

  if (
    path === '/proveedor' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedProveedorIds', result.resourceId);
  }

  if (
    path === '/inventario' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedInventarioIds', result.resourceId);
  }

  if (
    path === '/productos' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedProductoIds', result.resourceId);

    const requestPayload =
      result.payload && typeof result.payload === 'object'
        ? (result.payload as Record<string, unknown>)
        : null;
    const payloadAlergenos = requestPayload
      ? requestPayload.alergenos
      : undefined;
    if (Array.isArray(payloadAlergenos)) {
      for (const alergeno of payloadAlergenos) {
        if (typeof alergeno === 'string' && alergeno.trim().length > 0) {
          pushStateValue(
            context,
            'productoAlergenoPairs',
            `${result.resourceId}|${alergeno}`
          );
        }
      }
    }

    for (const entity of toEntityArray(result.response)) {
      const proveedores = Array.isArray((entity as any).proveedores)
        ? ((entity as any).proveedores as Array<Record<string, unknown>>)
        : [];

      for (const proveedor of proveedores) {
        const productoProveedorId =
          typeof proveedor.id === 'string' ? proveedor.id : '';
        const proveedorId =
          typeof proveedor.proveedorId === 'string'
            ? proveedor.proveedorId
            : '';
        const productoId =
          typeof entity.id === 'string'
            ? entity.id
            : typeof entity.productoId === 'string'
              ? entity.productoId
              : '';

        if (!productoProveedorId || !proveedorId) {
          continue;
        }

        pushStateValue(
          context,
          'seedCreatedProductoProveedorIds',
          productoProveedorId
        );
        pushStateValue(
          context,
          'seedCreatedProductoProveedorToProveedorPairs',
          `${productoProveedorId}|${proveedorId}`
        );
        if (productoId) {
          pushStateValue(
            context,
            'seedCreatedProductoProveedorToProductoPairs',
            `${productoProveedorId}|${productoId}`
          );
          pushStateValue(
            context,
            'seedCreatedProductoToProveedorPairs',
            `${productoId}|${proveedorId}`
          );
        }
      }
    }
  }

  if (
    path === '/recetas' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedRecetaIds', result.resourceId);
  }

  if (
    path === '/pedidos' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedPedidoPendienteIds', result.resourceId);
  }

  if (
    path === '/pedido-usuarios' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedPedidoUsuarioIds', result.resourceId);
    pushStateValue(
      context,
      'seedCreatedPedidoUsuarioPendienteIds',
      result.resourceId
    );
  }

  if (
    path === '/purchase-batches/from-missing-stock' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    const createdBatchIsPending = toEntityArray(result.response).some(
      (entity) =>
        entity.id === result.resourceId &&
        entity.estado === EstadoLote.PENDIENTE
    );

    if (createdBatchIsPending) {
      pushStateValue(
        context,
        'seedCreatedPurchaseBatchPendienteIds',
        result.resourceId
      );
    }
  }

  if (
    path === '/produccion/ejecutar' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedProduccionLoteIds', result.resourceId);
  }

  if (
    path.startsWith('/produccion/lote/') &&
    path.endsWith('/consumir') &&
    result.endpoint.method === 'PATCH' &&
    result.ok
  ) {
    const body = result.response as Record<string, unknown> | undefined;
    const remaining = Number(body?.porcionesRestantes ?? 0);
    context.set('consumirMaxPorciones', remaining);
  }

  if (
    path === '/preparaciones' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedPreparacionIds', result.resourceId);
    pushStateValue(
      context,
      'seedCreatedPreparacionPendienteIds',
      result.resourceId
    );
  }

  if (
    path === '/incidencias-resueltas' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(
      context,
      'seedCreatedIncidenciaResueltaIds',
      result.resourceId
    );
  }

  if (path.includes('/permisos-adicionales/')) {
    const match = path.match(
      /^\/usuarios\/([^/]+)\/permisos-adicionales\/([^/]+)$/
    );
    if (match) {
      const pair = `${match[1]}|${match[2]}`;
      if (result.endpoint.method === 'POST') {
        pushStateValue(context, 'usuarioPermisoAdicionalPairs', pair);
      }
      if (result.endpoint.method === 'DELETE') {
        removeStateValue(context, 'usuarioPermisoAdicionalPairs', pair);
      }
    }
  }

  if (path.includes('/permisos-excluidos/')) {
    const match = path.match(
      /^\/usuarios\/([^/]+)\/permisos-excluidos\/([^/]+)$/
    );
    if (match) {
      const pair = `${match[1]}|${match[2]}`;
      if (result.endpoint.method === 'POST') {
        pushStateValue(context, 'usuarioPermisoExcluidoPairs', pair);
      }
      if (result.endpoint.method === 'DELETE') {
        removeStateValue(context, 'usuarioPermisoExcluidoPairs', pair);
      }
    }
  }

  if (
    result.endpoint.method === 'PATCH' &&
    /^\/admin\/users\/[^/]+\/role$/.test(path)
  ) {
    const userId = path.split('/')[3] || '';
    const payload =
      result.payload && typeof result.payload === 'object'
        ? (result.payload as Record<string, unknown>)
        : null;
    const roleId = typeof payload?.roleId === 'string' ? payload.roleId : '';
    const additionalPermissionIds = Array.isArray(
      payload?.permisosAdicionalesIds
    )
      ? payload.permisosAdicionalesIds.filter(
          (permissionId): permissionId is string =>
            typeof permissionId === 'string' && permissionId.trim().length > 0
        )
      : [];
    const excludedPermissionIds = Array.isArray(payload?.permisosExcluidosIds)
      ? payload.permisosExcluidosIds.filter(
          (permissionId): permissionId is string =>
            typeof permissionId === 'string' && permissionId.trim().length > 0
        )
      : [];

    if (userId) {
      const roleIdByUserId =
        context.getState<Record<string, string>>(
          'seedAdminUserRoleIdByUserId'
        ) || {};
      const additionalPermissionIdsByUserId =
        context.getState<Record<string, string[]>>(
          'seedAdminUserAdditionalPermissionIdsByUserId'
        ) || {};
      const excludedPermissionIdsByUserId =
        context.getState<Record<string, string[]>>(
          'seedAdminUserExcludedPermissionIdsByUserId'
        ) || {};

      if (roleId) {
        roleIdByUserId[userId] = roleId;
        context.set('seedAdminUserRoleIdByUserId', roleIdByUserId);
      }

      additionalPermissionIdsByUserId[userId] = additionalPermissionIds;
      excludedPermissionIdsByUserId[userId] = excludedPermissionIds;
      context.set(
        'seedAdminUserAdditionalPermissionIdsByUserId',
        additionalPermissionIdsByUserId
      );
      context.set(
        'seedAdminUserExcludedPermissionIdsByUserId',
        excludedPermissionIdsByUserId
      );

      removePairsForUser(context, 'usuarioPermisoAdicionalPairs', userId);
      removePairsForUser(context, 'usuarioPermisoExcluidoPairs', userId);

      for (const permissionId of additionalPermissionIds) {
        pushStateValue(
          context,
          'usuarioPermisoAdicionalPairs',
          `${userId}|${permissionId}`
        );
      }

      for (const permissionId of excludedPermissionIds) {
        pushStateValue(
          context,
          'usuarioPermisoExcluidoPairs',
          `${userId}|${permissionId}`
        );
      }
    }
  }

  if (path.startsWith('/producto-alergenos/')) {
    const match = path.match(/^\/producto-alergenos\/([^/]+)\/([^/]+)$/);
    if (match) {
      const pair = `${match[1]}|${match[2]}`;
      if (result.endpoint.method === 'POST') {
        pushStateValue(context, 'productoAlergenoPairs', pair);
      }
      if (result.endpoint.method === 'DELETE') {
        removeStateValue(context, 'productoAlergenoPairs', pair);
        removeStateValue(
          context,
          'seedCreatedDeletableProductoAlergenoPairs',
          pair
        );
      }
    }
  }

  if (result.endpoint.method === 'DELETE' && /^\/usuarios\/[^/]+$/.test(path)) {
    const deletedUserId = path.split('/')[2] || '';
    if (deletedUserId) {
      removeStateValue(context, 'usuarioIds', deletedUserId);
      removeStateValue(context, 'seedMutableUserIds', deletedUserId);
      const roleIdByUserId =
        context.getState<Record<string, string>>(
          'seedAdminUserRoleIdByUserId'
        ) || {};
      const additionalPermissionIdsByUserId =
        context.getState<Record<string, string[]>>(
          'seedAdminUserAdditionalPermissionIdsByUserId'
        ) || {};
      const excludedPermissionIdsByUserId =
        context.getState<Record<string, string[]>>(
          'seedAdminUserExcludedPermissionIdsByUserId'
        ) || {};

      delete roleIdByUserId[deletedUserId];
      delete additionalPermissionIdsByUserId[deletedUserId];
      delete excludedPermissionIdsByUserId[deletedUserId];
      context.set('seedAdminUserRoleIdByUserId', roleIdByUserId);
      context.set(
        'seedAdminUserAdditionalPermissionIdsByUserId',
        additionalPermissionIdsByUserId
      );
      context.set(
        'seedAdminUserExcludedPermissionIdsByUserId',
        excludedPermissionIdsByUserId
      );

      const additionalPairs = getStateArray(
        context,
        'usuarioPermisoAdicionalPairs'
      );
      for (const pair of additionalPairs) {
        if (pair.startsWith(`${deletedUserId}|`)) {
          removeStateValue(context, 'usuarioPermisoAdicionalPairs', pair);
        }
      }

      const excludedPairs = getStateArray(
        context,
        'usuarioPermisoExcluidoPairs'
      );
      for (const pair of excludedPairs) {
        if (pair.startsWith(`${deletedUserId}|`)) {
          removeStateValue(context, 'usuarioPermisoExcluidoPairs', pair);
        }
      }
    }
  }

  if (
    result.endpoint.method === 'DELETE' &&
    /^\/proveedor\/[^/]+$/.test(path)
  ) {
    const deletedProveedorId = path.split('/')[2] || '';
    if (deletedProveedorId) {
      removeStateValue(context, 'proveedorIds', deletedProveedorId);
      removeStateValue(context, 'seedCreatedProveedorIds', deletedProveedorId);
      removeStateValue(
        context,
        'seedCreatedDeletableProveedorIds',
        deletedProveedorId
      );
    }
  }

  if (
    result.endpoint.method === 'DELETE' &&
    /^\/inventario\/[^/]+$/.test(path)
  ) {
    const deletedInventarioId = path.split('/')[2] || '';
    if (deletedInventarioId) {
      removeStateValue(context, 'inventarioIds', deletedInventarioId);
      removeStateValue(
        context,
        'seedCreatedInventarioIds',
        deletedInventarioId
      );
      removeStateValue(
        context,
        'seedCreatedDeletableInventarioIds',
        deletedInventarioId
      );
    }
  }

  if (
    result.endpoint.method === 'DELETE' &&
    /^\/productos\/[^/]+$/.test(path)
  ) {
    const deletedProductoId = path.split('/')[2] || '';
    if (deletedProductoId) {
      removeStateValue(context, 'productoIds', deletedProductoId);
      removeStateValue(context, 'seedCreatedProductoIds', deletedProductoId);
      removeStateValue(
        context,
        'seedCreatedDeletableProductoIds',
        deletedProductoId
      );
      removeStateValue(context, 'productoConProveedorIds', deletedProductoId);

      removePairsContainingId(
        context,
        'productoAlergenoPairs',
        deletedProductoId
      );
    }
  }

  if (
    result.endpoint.method === 'DELETE' &&
    /^\/profesores\/slots\/[^/]+$/.test(path)
  ) {
    const deletedProfesorSlotId = path.split('/')[3] || '';
    if (deletedProfesorSlotId) {
      removeStateValue(context, 'profesorSlotIds', deletedProfesorSlotId);
      removeStateValue(
        context,
        'seedCreatedDeletableProfesorSlotIds',
        deletedProfesorSlotId
      );
    }
  }

  if (result.endpoint.method === 'DELETE' && /^\/pedidos\/[^/]+$/.test(path)) {
    const deletedPedidoId = path.split('/')[2] || '';
    if (deletedPedidoId) {
      removeStateValue(
        context,
        'seedCreatedDeletablePedidoIds',
        deletedPedidoId
      );
      removeStateValue(context, 'pedidoIds', deletedPedidoId);
      removeStateValue(context, 'pedidoListIds', deletedPedidoId);
      removeStateValue(context, 'pedidoPendingListIds', deletedPedidoId);
      removeStateValue(context, 'pedidoReceivableListIds', deletedPedidoId);
      removeStateValue(
        context,
        'seedPreparedPedidoPendienteIds',
        deletedPedidoId
      );
      removeStateValue(context, 'pedidoPendienteIds', deletedPedidoId);
      removeStateValue(
        context,
        'seedCreatedPedidoPendienteIds',
        deletedPedidoId
      );
      removeStateValue(context, 'pedidoReceivableIds', deletedPedidoId);
      removeStateValue(
        context,
        'seedCreatedPedidoReceivableIds',
        deletedPedidoId
      );

      removePairsContainingId(
        context,
        'pedidoUsuarioToPedidoPairs',
        deletedPedidoId
      );
      removePairsContainingId(
        context,
        'pedidoProductoToPedidoPairs',
        deletedPedidoId
      );
      removePairsContainingId(
        context,
        'pedidoProductoToPedidoPairsFresh',
        deletedPedidoId
      );
    }
  }

  if (result.endpoint.method === 'DELETE' && /^\/recetas\/[^/]+$/.test(path)) {
    const deletedRecetaId = path.split('/')[2] || '';
    if (deletedRecetaId) {
      removeStateValue(context, 'recetaIds', deletedRecetaId);
      removeStateValue(context, 'seedCreatedRecetaIds', deletedRecetaId);
    }
  }

  if (
    result.endpoint.method === 'DELETE' &&
    /^\/movimientos\/[^/]+$/.test(path)
  ) {
    const deletedMovimientoId = path.split('/')[2] || '';
    if (deletedMovimientoId) {
      removeStateValue(context, 'movimientoIds', deletedMovimientoId);
    }
  }

  if (
    result.endpoint.method === 'DELETE' &&
    /^\/albaranes\/[^/]+$/.test(path)
  ) {
    const deletedAlbaranId = path.split('/')[2] || '';
    if (deletedAlbaranId) {
      removeStateValue(context, 'albaranIds', deletedAlbaranId);
    }
  }

  if (
    result.endpoint.method === 'DELETE' &&
    /^\/incidencias\/[^/]+$/.test(path)
  ) {
    const deletedIncidenciaId = path.split('/')[2] || '';
    if (deletedIncidenciaId) {
      removeStateValue(context, 'incidenciaIds', deletedIncidenciaId);
      removeStateValue(context, 'incidenciaPendienteIds', deletedIncidenciaId);
    }
  }

  if (
    result.endpoint.method === 'DELETE' &&
    /^\/preparaciones\/[^/]+$/.test(path)
  ) {
    const deletedPreparacionId = path.split('/')[2] || '';
    if (deletedPreparacionId) {
      removeStateValue(context, 'preparacionIds', deletedPreparacionId);
      removeStateValue(
        context,
        'preparacionPendienteIds',
        deletedPreparacionId
      );
      removeStateValue(
        context,
        'seedCreatedPreparacionPendienteIds',
        deletedPreparacionId
      );
      removeStateValue(
        context,
        'preparacionEnProcesoIds',
        deletedPreparacionId
      );
      removeStateValue(
        context,
        'seedCreatedPreparacionEnProcesoIds',
        deletedPreparacionId
      );
      removeStateValue(
        context,
        'seedCreatedPreparacionIds',
        deletedPreparacionId
      );
    }
  }

  if (
    result.endpoint.method === 'DELETE' &&
    /^\/recepciones\/[^/]+$/.test(path)
  ) {
    const deletedRecepcionId = path.split('/')[2] || '';
    if (deletedRecepcionId) {
      removeStateValue(context, 'recepcionIds', deletedRecepcionId);
      removeStateValue(
        context,
        'seedCreatedDeletableRecepcionIds',
        deletedRecepcionId
      );
    }
  }

  if (
    result.endpoint.method === 'DELETE' &&
    /^\/incidencias-resueltas\/[^/]+$/.test(path)
  ) {
    const deletedIncidenciaResueltaId = path.split('/')[2] || '';
    if (deletedIncidenciaResueltaId) {
      removeStateValue(
        context,
        'incidenciaResueltaIds',
        deletedIncidenciaResueltaId
      );
      removeStateValue(
        context,
        'seedCreatedIncidenciaResueltaIds',
        deletedIncidenciaResueltaId
      );
    }
  }

  if (path.startsWith('/pedido-usuarios/') && path.endsWith('/aceptar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'pedidoUsuarioPendienteIds', id);
      removeStateValue(context, 'seedCreatedPedidoUsuarioPendienteIds', id);
    }
  }
  if (path.startsWith('/pedido-usuarios/') && path.endsWith('/cancelar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'pedidoUsuarioPendienteIds', id);
      removeStateValue(context, 'seedCreatedPedidoUsuarioPendienteIds', id);
    }
  }
  if (path.startsWith('/purchase-batches/') && path.endsWith('/aceptar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'purchaseBatchPendienteIds', id);
      removeStateValue(context, 'seedCreatedPurchaseBatchPendienteIds', id);
    }
  }
  if (path.startsWith('/purchase-batches/') && path.endsWith('/cancelar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'purchaseBatchPendienteIds', id);
      removeStateValue(context, 'seedCreatedPurchaseBatchPendienteIds', id);
    }
  }

  if (
    path === '/purchase-batches/consolidate' &&
    result.endpoint.method === 'POST'
  ) {
    context.set('seedConsolidatePedidoUsuarioIds', []);

    const payload =
      result.payload && typeof result.payload === 'object'
        ? (result.payload as Record<string, unknown>)
        : null;

    const pedidoUsuarioIds = Array.isArray(payload?.pedidoUsuarioIds)
      ? (payload?.pedidoUsuarioIds as unknown[])
      : [];

    const pedidoUsuarioToPedidoPairs = getStateArray(
      context,
      'pedidoUsuarioToPedidoPairs'
    )
      .map((pair) => pair.split('|'))
      .filter(
        (parts) =>
          parts.length === 2 &&
          typeof parts[0] === 'string' &&
          parts[0].length > 0 &&
          typeof parts[1] === 'string' &&
          parts[1].length > 0
      );

    const consolidatedPedidoIds = new Set<string>();

    for (const id of pedidoUsuarioIds) {
      if (typeof id !== 'string' || id.trim().length === 0) {
        continue;
      }

      for (const [pedidoUsuarioId, pedidoId] of pedidoUsuarioToPedidoPairs) {
        if (pedidoUsuarioId === id) {
          consolidatedPedidoIds.add(pedidoId);
        }
      }
    }

    for (const id of consolidatedPedidoIds) {
      removeStateValue(context, 'pedidoPendienteIds', id);
      removeStateValue(context, 'seedCreatedPedidoPendienteIds', id);
    }

    for (const id of pedidoUsuarioIds) {
      if (typeof id !== 'string' || id.trim().length === 0) {
        continue;
      }
      removeStateValue(context, 'pedidoUsuarioPendienteIds', id);
      removeStateValue(context, 'seedCreatedPedidoUsuarioPendienteIds', id);
    }
  }

  if (path === '/recepciones' && result.endpoint.method === 'POST') {
    const payload =
      result.payload && typeof result.payload === 'object'
        ? (result.payload as Record<string, unknown>)
        : null;
    const pedidosPayload = Array.isArray(payload?.pedidos)
      ? (payload.pedidos as Array<Record<string, unknown>>)
      : [];

    for (const pedidoEntry of pedidosPayload) {
      const pedidoId =
        typeof pedidoEntry?.pedidoId === 'string' ? pedidoEntry.pedidoId : '';

      if (!pedidoId) {
        continue;
      }

      removeStateValue(context, 'pedidoReceivableIds', pedidoId);
      removeStateValue(context, 'seedCreatedPedidoReceivableIds', pedidoId);

      if (context.getState<string>('seedRecepcionPedidoId') === pedidoId) {
        context.set('seedRecepcionPedidoId', '');
      }
    }
  }

  if (path.startsWith('/pedidos/') && path.endsWith('/aceptar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'seedPreparedPedidoPendienteIds', id);
      removeStateValue(context, 'pedidoPendingListIds', id);
      removeStateValue(context, 'pedidoPendienteIds', id);
      removeStateValue(context, 'seedCreatedPedidoPendienteIds', id);
      pushStateValue(context, 'pedidoReceivableListIds', id);
      pushStateValue(context, 'pedidoReceivableIds', id);
      pushStateValue(context, 'seedCreatedPedidoReceivableIds', id);
    }
  }
  if (path.startsWith('/pedidos/') && path.endsWith('/cancelar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'seedPreparedPedidoPendienteIds', id);
      removeStateValue(context, 'pedidoPendingListIds', id);
      removeStateValue(context, 'pedidoPendienteIds', id);
      removeStateValue(context, 'seedCreatedPedidoPendienteIds', id);
      removeStateValue(context, 'pedidoReceivableListIds', id);
      removeStateValue(context, 'pedidoReceivableIds', id);
      removeStateValue(context, 'seedCreatedPedidoReceivableIds', id);
    }
  }
  if (path.startsWith('/incidencias/') && path.endsWith('/resolver')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'incidenciaPendienteIds', id);
    }
  }

  if (path.startsWith('/preparaciones/') && path.endsWith('/iniciar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'preparacionPendienteIds', id);
      removeStateValue(context, 'seedCreatedPreparacionPendienteIds', id);
      pushStateValue(context, 'preparacionEnProcesoIds', id);
      pushStateValue(context, 'seedCreatedPreparacionEnProcesoIds', id);
    }
  }
  if (path.startsWith('/preparaciones/') && path.endsWith('/finalizar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'preparacionEnProcesoIds', id);
      removeStateValue(context, 'seedCreatedPreparacionEnProcesoIds', id);
    }
  }
  if (path.startsWith('/preparaciones/') && path.endsWith('/cancelar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'preparacionPendienteIds', id);
      removeStateValue(context, 'seedCreatedPreparacionPendienteIds', id);
    }
  }

  if (path === '/auth/forgot-password') {
    const rawToken = deterministicToken('seed_token', 1, 'forgot-password');
    const hashedTokenValue = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const actorUserId = context.getState<string>('seedResetActorUserId');
    if (actorUserId) {
      const userRepo = AppDataSource.getRepository(Usuario);
      await userRepo.update(
        actorUserId,
        buildResetPasswordSeedUpdate(hashedTokenValue)
      );
      context.set('seedResetPasswordToken', rawToken);
      console.log(
        `[seed-massive] Re-seeded seedResetPasswordToken to ${rawToken} after forgot-password`
      );
    } else {
      context.set('seedResetPasswordToken', '');
    }
  }

  if (
    path === '/auth/change-password' ||
    path === '/usuarios/perfil/password'
  ) {
    const next = context.getState<string>('seedPasswordActorNextPassword');
    if (next) {
      context.set('seedPasswordActorCurrentPassword', next);
      context.set('seedPasswordActorNextPassword', '');

      const email = getRequiredStateString(context, 'seedPasswordActorEmail');
      const token = await context.loginWithCredentials({
        email,
        password: next,
      });
      context.set('seedTokenPasswordActor', token);
    }
  }

  if (path === '/auth/reset-password') {
    const rawToken = deterministicToken('seed_token', 2, 'reset-password');
    const hashedTokenValue = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const actorUserId = context.getState<string>('seedResetActorUserId');
    if (actorUserId) {
      const userRepo = AppDataSource.getRepository(Usuario);
      await userRepo.update(
        actorUserId,
        buildResetPasswordSeedUpdate(hashedTokenValue)
      );
      context.set('seedResetPasswordToken', rawToken);
      console.log(
        `[seed-massive] Re-seeded seedResetPasswordToken to ${rawToken} after reset-password`
      );
    } else {
      context.set('seedResetPasswordToken', '');
    }
  }
}
