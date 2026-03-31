import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';
import AppDataSource from '../config/typeorm.config';
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
    pushStateValue(
      context,
      'seedCreatedPedidoReceivableIds',
      result.resourceId
    );
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
    pushStateValue(
      context,
      'seedCreatedPurchaseBatchPendienteIds',
      result.resourceId
    );
  }

  if (
    path === '/produccion/ejecutar' &&
    result.endpoint.method === 'POST' &&
    result.resourceId
  ) {
    pushStateValue(context, 'seedCreatedProduccionLoteIds', result.resourceId);
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

  if (result.endpoint.method === 'DELETE' && /^\/usuarios\/[^/]+$/.test(path)) {
    const deletedUserId = path.split('/')[2] || '';
    if (deletedUserId) {
      removeStateValue(context, 'usuarioIds', deletedUserId);
      removeStateValue(context, 'seedMutableUserIds', deletedUserId);

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
    const payload =
      result.payload && typeof result.payload === 'object'
        ? (result.payload as Record<string, unknown>)
        : null;

    const pedidoIds = Array.isArray(payload?.pedidoIds)
      ? (payload?.pedidoIds as unknown[])
      : [];
    const pedidoUsuarioIds = Array.isArray(payload?.pedidoUsuarioIds)
      ? (payload?.pedidoUsuarioIds as unknown[])
      : [];

    for (const id of pedidoIds) {
      if (typeof id !== 'string' || id.trim().length === 0) {
        continue;
      }
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

  if (path.startsWith('/pedidos/') && path.endsWith('/aceptar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'pedidoPendienteIds', id);
      removeStateValue(context, 'seedCreatedPedidoPendienteIds', id);
    }
  }
  if (path.startsWith('/pedidos/') && path.endsWith('/cancelar')) {
    const id = path.split('/')[2];
    if (id) {
      removeStateValue(context, 'pedidoPendienteIds', id);
      removeStateValue(context, 'seedCreatedPedidoPendienteIds', id);
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
    const rawToken = `seed_token_${faker.string.alphanumeric(10)}`;
    const hashedTokenValue = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const actorUserId = context.getState<string>('seedResetActorUserId');
    if (actorUserId) {
      const userRepo = AppDataSource.getRepository(Usuario);
      await userRepo.update(actorUserId, {
        resetPasswordOtp: hashedTokenValue,
        resetPasswordOtpExpires: new Date(Date.now() + 3600000),
      } as any);
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
    const rawToken = `seed_token_${faker.string.alphanumeric(10)}`;
    const hashedTokenValue = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const actorUserId = context.getState<string>('seedResetActorUserId');
    if (actorUserId) {
      const userRepo = AppDataSource.getRepository(Usuario);
      await userRepo.update(actorUserId, {
        resetPasswordOtp: hashedTokenValue,
        resetPasswordOtpExpires: new Date(Date.now() + 3600000),
      } as any);
      context.set('seedResetPasswordToken', rawToken);
      console.log(
        `[seed-massive] Re-seeded seedResetPasswordToken to ${rawToken} after reset-password`
      );
    } else {
      context.set('seedResetPasswordToken', '');
    }
  }
}
