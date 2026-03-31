import { SeedContext, HttpSeedRequestError } from './seed-context';
import AppDataSource from '../config/typeorm.config';
import { Preparacion } from '../modules/preparacion/preparacion.entity/preparacion.entity';
import { Inventario } from '../modules/inventario/inventario.entity/inventario.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { Ubicacion } from '../modules/ubicacion/ubicacion.entity/ubicacion.entity';
import { Endpoint, EnumCoverage, RequestResult } from './massive.types';
import {
  buildBody,
  buildGetPath,
  chooseTokenForPath,
  collectStateFromResponse,
  extractResourceId,
  getStateArray,
  isAdminFocusEndpoint,
  isPublicPath,
  pickStateValue,
  pushStateValue,
  resolvePathParams,
} from './massive.helpers';
import {
  ensureDeletableInventarioResource,
  ensureDeletableProfesorAdminSlotResource,
  ensureDeletableProveedorResource,
  ensureDeletableRecepcionResource,
} from './massive.runtime.deletables';
import {
  adminRouteActorByIteration,
  expectedStatusForAdminRouteRequest,
} from './massive.runtime.actors';

async function ensureRepositoryReady(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}

async function ensurePreparacionIngredientsHaveStock(
  context: SeedContext,
  preparacionId: string
): Promise<void> {
  if (!preparacionId) {
    return;
  }

  const preparedIds = getStateArray(context, 'seedPreparacionStockReadyIds');
  if (preparedIds.includes(preparacionId)) {
    return;
  }

  await ensureRepositoryReady();

  const preparacionRepo = AppDataSource.getRepository(Preparacion);
  const inventarioRepo = AppDataSource.getRepository(Inventario);
  const productoProveedorRepo = AppDataSource.getRepository(ProductoProveedor);
  const ubicacionRepo = AppDataSource.getRepository(Ubicacion);

  const preparacion = await preparacionRepo.findOne({
    where: { id: preparacionId } as any,
    relations: [
      'receta',
      'receta.ingredientes',
      'receta.ingredientes.producto',
    ],
  });

  if (!preparacion?.receta?.ingredientes?.length) {
    pushStateValue(context, 'seedPreparacionStockReadyIds', preparacionId);
    return;
  }

  const productoIds = [
    ...new Set(
      preparacion.receta.ingredientes
        .map((ingrediente: any) =>
          typeof ingrediente.productoId === 'string' && ingrediente.productoId
            ? ingrediente.productoId
            : typeof ingrediente.producto?.id === 'string'
              ? ingrediente.producto.id
              : ''
        )
        .filter((id) => typeof id === 'string' && id.length > 0)
    ),
  ];

  if (productoIds.length === 0) {
    pushStateValue(context, 'seedPreparacionStockReadyIds', preparacionId);
    return;
  }

  const targetStock = 1000;

  const existingInventarios = await inventarioRepo
    .createQueryBuilder('inv')
    .innerJoinAndSelect('inv.productoProveedor', 'pp')
    .where('pp.producto_id IN (:...productoIds)', { productoIds })
    .getMany();

  let defaultUbicacionId =
    context.getState<string>('seedDefaultUbicacionId') ||
    existingInventarios[0]?.ubicacionId ||
    '';

  if (!defaultUbicacionId) {
    const defaultUbicacion = await ubicacionRepo
      .createQueryBuilder('ub')
      .orderBy('ub.created_at', 'ASC')
      .getOne();

    if (!defaultUbicacion) {
      throw new Error(
        '[seed-massive] No hay ubicaciones disponibles para preparar stock de preparaciones'
      );
    }

    defaultUbicacionId = defaultUbicacion.id;
  }

  context.set('seedDefaultUbicacionId', defaultUbicacionId);

  const inventariosToUpdate = existingInventarios.filter(
    (inv) => Number(inv.cantidadActual) < targetStock
  );

  if (inventariosToUpdate.length > 0) {
    for (const inv of inventariosToUpdate) {
      inv.cantidadActual = targetStock;
      if (Number(inv.cantidadMinima) < 1) {
        inv.cantidadMinima = 1;
      }
      if (!inv.cantidadMaxima || Number(inv.cantidadMaxima) < targetStock) {
        inv.cantidadMaxima = targetStock * 2;
      }
    }

    await inventarioRepo.save(inventariosToUpdate as any);
  }

  const coveredProductoIds = new Set(
    existingInventarios
      .map((inv) => inv.productoProveedor?.productoId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  );

  const missingProductoIds = productoIds.filter(
    (productoId) => !coveredProductoIds.has(productoId)
  );

  if (missingProductoIds.length > 0) {
    const proveedores = await productoProveedorRepo
      .createQueryBuilder('pp')
      .where('pp.producto_id IN (:...productoIds)', {
        productoIds: missingProductoIds,
      })
      .orderBy('pp.created_at', 'ASC')
      .getMany();

    const proveedorByProducto = new Map<string, ProductoProveedor>();
    for (const proveedor of proveedores) {
      if (!proveedorByProducto.has(proveedor.productoId)) {
        proveedorByProducto.set(proveedor.productoId, proveedor);
      }
    }

    const nuevosInventarios: Inventario[] = [];
    for (const productoId of missingProductoIds) {
      const proveedor = proveedorByProducto.get(productoId);
      if (!proveedor) {
        throw new Error(
          `[seed-massive] No existe producto-proveedor para ingrediente ${productoId}`
        );
      }

      const nuevoInventario = new Inventario();
      nuevoInventario.productoProveedorId = proveedor.id;
      nuevoInventario.productoProveedor = { id: proveedor.id } as any;
      nuevoInventario.ubicacionId = defaultUbicacionId;
      nuevoInventario.ubicacion = { id: defaultUbicacionId } as any;
      nuevoInventario.cantidadActual = targetStock;
      nuevoInventario.cantidadMinima = 1;
      nuevoInventario.cantidadMaxima = targetStock * 2;
      nuevoInventario.fechaEntrada = new Date();
      nuevoInventario.fechaCaducidad = null;

      nuevosInventarios.push(nuevoInventario);
    }

    if (nuevosInventarios.length > 0) {
      const createdInventarios = await inventarioRepo.save(
        nuevosInventarios as any
      );
      for (const inv of createdInventarios) {
        pushStateValue(context, 'inventarioIds', inv.id);
        pushStateValue(
          context,
          'productoProveedorIds',
          inv.productoProveedorId
        );
      }
    }
  }

  for (const inv of existingInventarios) {
    pushStateValue(context, 'inventarioIds', inv.id);
    pushStateValue(context, 'productoProveedorIds', inv.productoProveedorId);
  }

  pushStateValue(context, 'seedPreparacionStockReadyIds', preparacionId);
}

async function ensurePendingPreparacionForCancel(
  context: SeedContext
): Promise<void> {
  const hasCreatedPending =
    getStateArray(context, 'seedCreatedPreparacionPendienteIds').length > 0;
  const hasAnyPending =
    getStateArray(context, 'preparacionPendienteIds').length > 0;

  if (hasCreatedPending || hasAnyPending) {
    return;
  }

  const recetaId =
    pickStateValue(context, 'seedCreatedRecetaIds', 0, '') ||
    pickStateValue(context, 'recetaIds', 0, '');
  const ubicacionDestinoId = pickStateValue(context, 'ubicacionIds', 0, '');

  if (!recetaId) {
    throw new Error(
      '[seed-massive] No se pudo crear preparación pendiente: faltan recetaIds'
    );
  }

  const previousToken = context.getAccessToken();
  const token =
    context.getState<string>('seedTokenSuperAdmin') ||
    context.getState<string>('seedTokenAdmin') ||
    previousToken;

  context.setAccessToken(token);

  try {
    const payload: Record<string, unknown> = {
      recetaId,
      cantidadAProducir: 1,
      observaciones: 'Seed cancel bootstrap',
    };

    if (ubicacionDestinoId) {
      payload.ubicacionDestinoId = ubicacionDestinoId;
    }

    const response = await context.requestJson<unknown>('/preparaciones', {
      method: 'POST',
      body: payload,
      auth: true,
    });

    collectStateFromResponse(context, '/preparaciones', response);

    const preparacionId = extractResourceId(response);
    if (!preparacionId) {
      throw new Error(
        '[seed-massive] No se recibió ID al crear preparación pendiente para cancelar'
      );
    }

    pushStateValue(context, 'seedCreatedPreparacionIds', preparacionId);
    pushStateValue(
      context,
      'seedCreatedPreparacionPendienteIds',
      preparacionId
    );
    pushStateValue(context, 'preparacionPendienteIds', preparacionId);
  } finally {
    context.setAccessToken(previousToken);
  }
}

async function ensureDeletableProfesorAdminSlot(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  await ensureDeletableProfesorAdminSlotResource(context, coverage, iteration);
}

async function ensureDeletableProveedor(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  await ensureDeletableProveedorResource(context, coverage, iteration);
}

async function ensureDeletableInventario(context: SeedContext): Promise<void> {
  await ensureDeletableInventarioResource(context);
}

async function ensureDeletableRecepcion(context: SeedContext): Promise<void> {
  await ensureDeletableRecepcionResource(context);
}

async function ensurePendingPedidoUsuarioForUpdate(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  const hasCreatedPending =
    getStateArray(context, 'seedCreatedPedidoUsuarioPendienteIds').length > 0;

  if (hasCreatedPending) {
    return;
  }

  const createEndpoint: Endpoint = {
    method: 'POST',
    path: '/pedido-usuarios',
    source: 'precreate-pedido-usuario',
  };

  const createBody = buildBody(
    context,
    createEndpoint,
    '/pedido-usuarios',
    iteration,
    coverage
  );

  const response = await context.requestJson<unknown>('/pedido-usuarios', {
    method: 'POST',
    body: createBody,
    auth: true,
  });

  collectStateFromResponse(context, '/pedido-usuarios', response);

  const pedidoUsuarioId = extractResourceId(response);
  if (!pedidoUsuarioId) {
    throw new Error(
      '[seed-massive] No se recibió ID al precrear pedido-usuario pendiente para PATCH'
    );
  }

  pushStateValue(context, 'seedCreatedPedidoUsuarioIds', pedidoUsuarioId);
  pushStateValue(
    context,
    'seedCreatedPedidoUsuarioPendienteIds',
    pedidoUsuarioId
  );
  pushStateValue(context, 'pedidoUsuarioPendienteIds', pedidoUsuarioId);
}

async function ensurePendingPurchaseBatchForUpdate(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  const hasCreatedPending =
    getStateArray(context, 'seedCreatedPurchaseBatchPendienteIds').length > 0;
  const hasAnyPending =
    getStateArray(context, 'purchaseBatchPendienteIds').length > 0;

  if (hasCreatedPending || hasAnyPending) {
    return;
  }

  const createEndpoint: Endpoint = {
    method: 'POST',
    path: '/purchase-batches/from-missing-stock',
    source: 'precreate-purchase-batch',
  };

  const createBody = buildBody(
    context,
    createEndpoint,
    '/purchase-batches/from-missing-stock',
    iteration,
    coverage
  );

  const response = await context.requestJson<unknown>(
    '/purchase-batches/from-missing-stock',
    {
      method: 'POST',
      body: createBody,
      auth: true,
    }
  );

  collectStateFromResponse(
    context,
    '/purchase-batches/from-missing-stock',
    response
  );

  const purchaseBatchId = extractResourceId(response);
  if (!purchaseBatchId) {
    throw new Error(
      '[seed-massive] No se recibió ID al precrear lote pendiente para PATCH /purchase-batches/:id'
    );
  }

  pushStateValue(
    context,
    'seedCreatedPurchaseBatchPendienteIds',
    purchaseBatchId
  );
  pushStateValue(context, 'purchaseBatchPendienteIds', purchaseBatchId);
}

async function createPendingPedidoUsuarioForConsolidate(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  const createEndpoint: Endpoint = {
    method: 'POST',
    path: '/pedido-usuarios',
    source: 'precreate-pedido-usuario-consolidate',
  };

  const createBody = buildBody(
    context,
    createEndpoint,
    '/pedido-usuarios',
    iteration,
    coverage
  );

  const response = await context.requestJson<unknown>('/pedido-usuarios', {
    method: 'POST',
    body: createBody,
    auth: true,
  });

  collectStateFromResponse(context, '/pedido-usuarios', response);

  const pedidoUsuarioId = extractResourceId(response);
  if (!pedidoUsuarioId) {
    throw new Error(
      '[seed-massive] No se recibió ID al precrear pedido-usuario para consolidación'
    );
  }

  pushStateValue(context, 'seedCreatedPedidoUsuarioIds', pedidoUsuarioId);
  pushStateValue(
    context,
    'seedCreatedPedidoUsuarioPendienteIds',
    pedidoUsuarioId
  );
  pushStateValue(context, 'pedidoUsuarioPendienteIds', pedidoUsuarioId);
}

async function ensureIncidenciaForResolver(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  const pendingIds = getStateArray(context, 'incidenciaPendienteIds');

  if (pendingIds.length > 0) {
    return;
  }

  const recepcionIds = getStateArray(context, 'recepcionIds');
  if (recepcionIds.length === 0) {
    throw new Error(
      '[seed-massive] No se pudo precrear incidencia para resolver: faltan recepcionIds'
    );
  }

  const createEndpoint: Endpoint = {
    method: 'POST',
    path: '/incidencias/reportar',
    source: 'precreate-incidencia-resolver',
  };

  const createBody = buildBody(
    context,
    createEndpoint,
    '/incidencias/reportar',
    iteration,
    coverage
  );

  if (!createBody.recepcionId) {
    createBody.recepcionId = recepcionIds[iteration % recepcionIds.length];
  }

  const previousToken = context.getAccessToken();
  context.setAccessToken(chooseTokenForPath(context, '/incidencias/reportar'));

  try {
    const response = await context.requestJson<unknown>(
      '/incidencias/reportar',
      {
        method: 'POST',
        body: createBody,
        auth: true,
      }
    );

    collectStateFromResponse(context, '/incidencias/reportar', response);
  } finally {
    context.setAccessToken(previousToken);
  }

  const hasPending =
    getStateArray(context, 'incidenciaPendienteIds').length > 0;
  const hasAny = getStateArray(context, 'incidenciaIds').length > 0;
  if (!hasPending && !hasAny) {
    throw new Error(
      '[seed-massive] No se pudo precrear incidencia para resolver: respuesta sin ID reutilizable'
    );
  }
}

export async function executeAdminFocusEndpointRequest(
  context: SeedContext,
  endpoint: Endpoint,
  resolvedPath: string,
  iteration: number,
  coverage: EnumCoverage
): Promise<RequestResult> {
  const key = `${endpoint.method} ${endpoint.path}`;
  const actor = adminRouteActorByIteration(iteration);

  const tokenByActor = {
    superadmin: context.getState<string>('seedTokenAdminRoutesSuper'),
    admin: context.getState<string>('seedTokenAdminRoutesAdmin'),
  };

  const actorToken = tokenByActor[actor];
  if (!actorToken) {
    return {
      ok: false,
      key,
      endpoint,
      resolvedPath,
      error: `[seed-massive] Falta token para actor ${actor} en rutas admin`,
    };
  }

  const previousToken = context.getAccessToken();
  context.setAccessToken(actorToken);

  const expectedStatusCodes = expectedStatusForAdminRouteRequest(endpoint);

  const requestPath =
    endpoint.method === 'GET'
      ? buildGetPath(context, resolvedPath, iteration)
      : resolvedPath;

  const requestPayload =
    endpoint.method === 'GET' ||
    endpoint.method === 'DELETE' ||
    endpoint.path === '/admin/users/:id/force-reset'
      ? undefined
      : buildBody(context, endpoint, resolvedPath, iteration, coverage);

  try {
    const response = await context.requestJson<unknown>(requestPath, {
      method: endpoint.method,
      body: requestPayload,
      auth: true,
    });

    const statusCode =
      context.getLastResponseStatusCode() ||
      (endpoint.method === 'POST' ? 201 : 200);

    if (!expectedStatusCodes.includes(statusCode)) {
      return {
        ok: false,
        countAsSuccess: false,
        key,
        endpoint,
        resolvedPath,
        payload: requestPayload,
        response,
        statusCode,
        error: `[seed-massive] ${key} actor=${actor} status inesperado ${statusCode}, esperado=${expectedStatusCodes.join(',')}`,
      };
    }

    if (statusCode >= 200 && statusCode < 300) {
      collectStateFromResponse(context, resolvedPath, response);
    }

    return {
      ok: true,
      countAsSuccess: statusCode >= 200 && statusCode < 300,
      key,
      endpoint,
      resolvedPath,
      payload: requestPayload,
      response,
      statusCode,
      resourceId: extractResourceId(response),
    };
  } catch (error) {
    const statusCode = context.getLastResponseStatusCode();
    const errorMessage = String(error instanceof Error ? error.message : error);
    return {
      ok: false,
      key,
      endpoint,
      resolvedPath,
      payload: requestPayload,
      statusCode,
      error: `[seed-massive] ${key} actor=${actor} fallo: ${errorMessage}`,
    };
  } finally {
    context.setAccessToken(previousToken);
  }
}

export async function executeEndpointRequest(
  context: SeedContext,
  endpoint: Endpoint,
  iteration: number,
  coverage: EnumCoverage
): Promise<RequestResult> {
  const key = `${endpoint.method} ${endpoint.path}`;

  if (
    endpoint.method === 'PATCH' &&
    endpoint.path.startsWith('/preparaciones/') &&
    endpoint.path.endsWith('/cancelar')
  ) {
    await ensurePendingPreparacionForCancel(context);
  }

  if (endpoint.method === 'PATCH' && endpoint.path === '/pedido-usuarios/:id') {
    await ensurePendingPedidoUsuarioForUpdate(context, coverage, iteration);
  }

  if (
    endpoint.method === 'PATCH' &&
    (endpoint.path === '/purchase-batches/:id' ||
      endpoint.path === '/purchase-batches/:id/aceptar' ||
      endpoint.path === '/purchase-batches/:id/cancelar')
  ) {
    await ensurePendingPurchaseBatchForUpdate(context, coverage, iteration);
  }

  if (
    endpoint.path === '/incidencias/:id/resolver' &&
    (endpoint.method === 'POST' || endpoint.method === 'PATCH')
  ) {
    await ensureIncidenciaForResolver(context, coverage, iteration);
  }

  if (
    endpoint.method === 'DELETE' &&
    endpoint.path === '/profesores/admin-slots/:id'
  ) {
    await ensureDeletableProfesorAdminSlot(context, coverage, iteration);
  }

  if (endpoint.method === 'DELETE' && endpoint.path === '/proveedor/:id') {
    await ensureDeletableProveedor(context, coverage, iteration);
  }

  if (endpoint.method === 'DELETE' && endpoint.path === '/inventario/:id') {
    await ensureDeletableInventario(context);
  }

  if (endpoint.method === 'DELETE' && endpoint.path === '/recepciones/:id') {
    await ensureDeletableRecepcion(context);
  }

  let resolvedPath = endpoint.path;
  try {
    resolvedPath = resolvePathParams(context, endpoint, iteration);
  } catch (error) {
    return {
      ok: false,
      key,
      endpoint,
      resolvedPath: endpoint.path,
      error: `resolvePathParams failed: ${String(error instanceof Error ? error.message : error)}`,
    };
  }

  if (isAdminFocusEndpoint(endpoint)) {
    return executeAdminFocusEndpointRequest(
      context,
      endpoint,
      resolvedPath,
      iteration,
      coverage
    );
  }

  const requiresAuth = !isPublicPath(resolvedPath);
  const previousToken = context.getAccessToken();

  if (requiresAuth) {
    context.setAccessToken(chooseTokenForPath(context, resolvedPath));
  }

  let requestPayload: unknown;

  try {
    const requestPath =
      endpoint.method === 'GET'
        ? buildGetPath(context, resolvedPath, iteration)
        : resolvedPath;

    if (
      endpoint.method === 'PATCH' &&
      resolvedPath.startsWith('/preparaciones/') &&
      resolvedPath.endsWith('/finalizar')
    ) {
      const preparacionId = resolvedPath.split('/')[2] || '';
      await ensurePreparacionIngredientsHaveStock(context, preparacionId);
    }

    if (
      endpoint.method === 'POST' &&
      resolvedPath === '/purchase-batches/consolidate'
    ) {
      await createPendingPedidoUsuarioForConsolidate(
        context,
        coverage,
        iteration
      );
    }

    if (
      endpoint.method === 'POST' &&
      resolvedPath === '/pedido/draft/finalize'
    ) {
      const draftEndpoint: Endpoint = {
        method: 'POST',
        path: '/pedido/draft',
        source: 'precreate-draft',
      };
      const draftBody = buildBody(
        context,
        draftEndpoint,
        '/pedido/draft',
        iteration,
        coverage
      );

      try {
        const draftResponse = await context.requestJson<unknown>(
          '/pedido/draft',
          {
            method: 'POST',
            body: draftBody,
            auth: requiresAuth,
          }
        );

        collectStateFromResponse(context, '/pedido/draft', draftResponse);
      } catch (err) {
        const errMsg = String(err instanceof Error ? err.message : err);
        return {
          ok: false,
          key,
          endpoint,
          resolvedPath,
          payload: draftBody,
          error: `[seed-massive] PRECREATE /pedido/draft fallo: ${errMsg}`,
        } as RequestResult;
      }
    }

    if (endpoint.method === 'POST' && resolvedPath === '/recepciones') {
      const existingPedidos = getStateArray(context, 'pedidoIds');
      if (existingPedidos.length === 0) {
        const pedidoEndpoint: Endpoint = {
          method: 'POST',
          path: '/pedidos',
        } as Endpoint;
        const pedidoBody = buildBody(
          context,
          pedidoEndpoint,
          '/pedidos',
          iteration,
          coverage
        );
        try {
          const pedidoResp = await context.requestJson('/pedidos', {
            method: 'POST',
            body: pedidoBody,
          });
          collectStateFromResponse(context, '/pedidos', pedidoResp);
          const createdId = extractResourceId(pedidoResp);
          if (createdId) {
            pushStateValue(context, 'seedCreatedPedidoPendienteIds', createdId);
          }
        } catch (err) {
          const errMsg = String(err instanceof Error ? err.message : err);
          return {
            ok: false,
            key,
            endpoint,
            resolvedPath,
            payload: pedidoBody,
            error: `[seed-massive] PRECREATE /pedidos fallo: ${errMsg}`,
          } as RequestResult;
        }
      }
    }

    requestPayload =
      endpoint.method === 'GET' || endpoint.method === 'DELETE'
        ? undefined
        : buildBody(context, endpoint, resolvedPath, iteration, coverage);

    if (
      endpoint.method === 'POST' &&
      resolvedPath === '/albaranes/upload-documento'
    ) {
      const recepcionId = pickStateValue(
        context,
        'recepcionIds',
        iteration,
        ''
      );
      const response = await context.postMultipart<unknown>(
        '/albaranes/upload-documento',
        {
          file: new Blob(['seed-document'], { type: 'application/pdf' }),
          numeroReferencia: `ALB-SEED-${Date.now()}-${iteration}`,
          ...(recepcionId ? { recepcionId } : {}),
          observaciones: 'Documento generado por seeder masivo',
        }
      );

      collectStateFromResponse(context, resolvedPath, response);
      const statusCode = context.getLastResponseStatusCode() || 201;
      return {
        ok: statusCode >= 200 && statusCode < 300,
        key,
        endpoint,
        resolvedPath,
        payload: '[multipart/form-data]',
        response,
        statusCode,
        resourceId: extractResourceId(response),
      };
    }

    if (endpoint.method === 'POST' && resolvedPath === '/archivos/upload') {
      const response = await context.postMultipart<unknown>(
        '/archivos/upload',
        {
          file: new Blob([`seed-file-${Date.now()}-${iteration}`], {
            type: 'application/pdf',
          }),
        }
      );

      collectStateFromResponse(context, resolvedPath, response);
      const statusCode = context.getLastResponseStatusCode() || 201;
      return {
        ok: statusCode >= 200 && statusCode < 300,
        key,
        endpoint,
        resolvedPath,
        payload: '[multipart/form-data]',
        response,
        statusCode,
        resourceId: extractResourceId(response),
      };
    }

    if (endpoint.method === 'POST' && resolvedPath === '/auth/logout') {
      const loginEmail =
        context.getState<string>('seedAdminLoginEmail') ||
        context.getState<string>('seedAdminLoginUsername') ||
        'admin@smarteconomat.com';
      const loginPassword =
        context.getState<string>('seedAdminCurrentPassword') ||
        'SmartEconomat2026!';

      const transientToken = await context.loginWithCredentials(
        {
          email: loginEmail,
          password: loginPassword,
        },
        { setActiveToken: false }
      );

      const response = await context.requestJson<unknown>('/auth/logout', {
        method: 'POST',
        auth: true,
        tokenOverride: transientToken,
      });

      const statusCode = context.getLastResponseStatusCode() || 200;
      return {
        ok: statusCode >= 200 && statusCode < 300,
        key,
        endpoint,
        resolvedPath,
        payload: '[logout-with-transient-token]',
        response,
        statusCode,
      };
    }

    const response = await context.requestJson<unknown>(requestPath, {
      method: endpoint.method,
      body: requestPayload,
      auth: requiresAuth,
    });

    collectStateFromResponse(context, resolvedPath, response);

    const statusCode = context.getLastResponseStatusCode() || 200;
    const isSuccess = statusCode >= 200 && statusCode < 300;
    return {
      ok: isSuccess,
      countAsSuccess: isSuccess,
      key,
      endpoint,
      resolvedPath,
      payload: requestPayload,
      response,
      statusCode,
      resourceId: extractResourceId(response),
    };
  } catch (error) {
    const statusCode =
      error instanceof HttpSeedRequestError
        ? error.status
        : context.getLastResponseStatusCode();

    return {
      ok: false,
      key,
      endpoint,
      resolvedPath,
      payload: requestPayload,
      error: String(error instanceof Error ? error.message : error),
      statusCode,
    };
  } finally {
    context.setAccessToken(previousToken);
  }
}
