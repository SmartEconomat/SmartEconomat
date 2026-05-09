import { SeedContext, HttpSeedRequestError } from './seed-context';
import AppDataSource from '../config/typeorm.config';
import { Preparacion } from '../modules/preparacion/preparacion.entity/preparacion.entity';
import { Receta } from '../modules/receta/receta.entity/receta.entity';
import { ProduccionLote } from '../modules/receta/produccion-lote.entity/produccion-lote.entity';
import { RecetaIngrediente } from '../modules/receta/receta-ingrediente.entity/receta-ingrediente.entity';
import { Inventario } from '../modules/inventario/inventario.entity/inventario.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { Ubicacion } from '../modules/ubicacion/ubicacion.entity/ubicacion.entity';
import { Endpoint, EnumCoverage, RequestResult } from './massive.types';
import { EstadoPedido } from '../modules/pedido/enums/estado-pedido.enum';
import { EstadoLote } from '../modules/pedido/enums/estado-lote.enum';
import { INCIDENCIA_ESTADOS } from './massive.config';
import {
  buildBody,
  buildGetPath,
  chooseTokenForPath,
  collectStateFromResponse,
  extractActiveEntityIds,
  extractResourceId,
  getStateArray,
  isAdminFocusEndpoint,
  isRecord,
  isPublicPath,
  listFromResponse,
  pickStateValue,
  pushStateValue,
  removeStateValue,
  resolvePathParams,
} from './massive.helpers';
import {
  ensureDeletablePedidoResource,
  ensureDeletableProductoAlergenoResource,
  ensureDeletableProductoResource,
  ensureDeletableInventarioResource,
  ensureDeletableProfesorAdminSlotResource,
  ensureDeletableProfesorSlotResource,
  ensureDeletableProveedorResource,
  ensureDeletableRecepcionResource,
  ensureSoftDeletedProveedorForRestore,
} from './massive.runtime.deletables';
import {
  adminRouteActorByIteration,
  expectedStatusForAdminRouteRequest,
} from './massive.runtime.actors';
import {
  fetchOpenFoodFactsProducts,
  generateFallbackOffProducts,
  hydrateOpenFoodFactsProductAssets,
  OffProduct,
} from './openfoodfacts.seed';
import { seedDateIso } from './deterministic.seed-data';

async function ensureRepositoryReady(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}

function buildPaginatedListPath(
  path: string,
  page: number,
  limit: number
): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}limit=${limit}&page=${page}`;
}

function toTrimmedSeedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toSeedFiniteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Number.NaN;
}

function rememberProfesorOwnedSlot(
  context: SeedContext,
  requestToken: string | undefined,
  slotId: string | undefined
): void {
  if (!requestToken || !slotId) {
    return;
  }

  const tokenIndexMapJson =
    context.getState<string>('seedProfesorIndexByToken') || '{}';
  const tokenIndexMap: Record<string, number> = JSON.parse(tokenIndexMapJson);
  const profesorIndex = tokenIndexMap[requestToken];
  if (profesorIndex === undefined) {
    return;
  }

  const slotOwnerMapJson =
    context.getState<string>('seedSlotToProfesorIndex') || '{}';
  const slotOwnerMap: Record<string, number> = JSON.parse(slotOwnerMapJson);
  slotOwnerMap[slotId] = profesorIndex;
  context.set('seedSlotToProfesorIndex', JSON.stringify(slotOwnerMap));

  const ownedIdsJson =
    context.getState<string>(`seedProfesorOwnedSlotIds:${profesorIndex}`) ||
    '[]';
  const ownedIds: string[] = JSON.parse(ownedIdsJson);
  if (!ownedIds.includes(slotId)) {
    ownedIds.push(slotId);
    context.set(
      `seedProfesorOwnedSlotIds:${profesorIndex}`,
      JSON.stringify(ownedIds)
    );
  }
}

function rememberPedidoUsuarioChildPedidos(
  context: SeedContext,
  pedidoUsuarioId: string,
  response: unknown
): string[] {
  const pedidoUsuario =
    listFromResponse(response).find(
      (entity) => entity.id === pedidoUsuarioId
    ) || listFromResponse(response)[0];

  if (!pedidoUsuario || !Array.isArray(pedidoUsuario.pedidos)) {
    return [];
  }

  const rememberedPedidoIds: string[] = [];

  for (const nestedPedido of pedidoUsuario.pedidos) {
    if (!isRecord(nestedPedido)) {
      continue;
    }

    const nestedPedidoId = toTrimmedSeedString(nestedPedido.id);
    if (!nestedPedidoId) {
      continue;
    }

    rememberedPedidoIds.push(nestedPedidoId);

    pushStateValue(context, 'pedidoIds', nestedPedidoId);
    pushStateValue(
      context,
      'pedidoUsuarioToPedidoPairs',
      `${pedidoUsuarioId}|${nestedPedidoId}`
    );

    const nestedPedidoState = toTrimmedSeedString(nestedPedido.estado);
    const pendingPedidoState = String(EstadoPedido.PENDIENTE_DE_APROBACION);
    const receivablePedidoState = String(EstadoPedido.POR_RECEPCIONAR);
    const nestedPedidoBatchId = toTrimmedSeedString(nestedPedido.batchId);

    if (
      nestedPedidoState === pendingPedidoState &&
      nestedPedidoBatchId.length === 0
    ) {
      pushStateValue(context, 'pedidoPendienteIds', nestedPedidoId);
      pushStateValue(context, 'seedCreatedPedidoPendienteIds', nestedPedidoId);
    } else {
      removeStateValue(context, 'pedidoPendienteIds', nestedPedidoId);
      removeStateValue(
        context,
        'seedCreatedPedidoPendienteIds',
        nestedPedidoId
      );
    }

    if (
      nestedPedidoState === receivablePedidoState &&
      nestedPedidoBatchId.length === 0
    ) {
      pushStateValue(context, 'pedidoReceivableIds', nestedPedidoId);
    } else {
      removeStateValue(context, 'pedidoReceivableIds', nestedPedidoId);
    }

    if (!Array.isArray(nestedPedido.pedidoProductos)) {
      continue;
    }

    for (const nestedPedidoProducto of nestedPedido.pedidoProductos) {
      if (!isRecord(nestedPedidoProducto)) {
        continue;
      }

      const nestedPedidoProductoId = toTrimmedSeedString(
        nestedPedidoProducto.id
      );
      if (!nestedPedidoProductoId) {
        continue;
      }

      pushStateValue(context, 'pedidoProductoIds', nestedPedidoProductoId);
      pushStateValue(
        context,
        'pedidoProductoToPedidoPairs',
        `${nestedPedidoProductoId}|${nestedPedidoId}`
      );
    }
  }

  return rememberedPedidoIds;
}

async function fetchPaginatedEntities(
  context: SeedContext,
  path: string,
  options?: {
    tokenOverride?: string;
    collectPath?: string;
    maxPages?: number;
    limit?: number;
  }
): Promise<Array<Record<string, unknown>>> {
  const maxPages = Math.max(1, options?.maxPages ?? 10);
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 50));
  const entities: Array<Record<string, unknown>> = [];

  for (let page = 1; page <= maxPages; page++) {
    const response = await context.requestJson<unknown>(
      buildPaginatedListPath(path, page, limit),
      {
        method: 'GET',
        auth: true,
        tokenOverride: options?.tokenOverride,
      }
    );

    if (options?.collectPath) {
      collectStateFromResponse(context, options.collectPath, response);
    }

    const pageItems = listFromResponse(response);
    if (pageItems.length === 0) {
      break;
    }

    entities.push(...pageItems);

    const totalPages =
      isRecord(response) && typeof response.totalPages === 'number'
        ? response.totalPages
        : isRecord(response) && typeof response.total === 'number'
          ? Math.ceil(response.total / limit)
          : undefined;

    if (typeof totalPages === 'number' && page >= totalPages) {
      break;
    }

    if (pageItems.length < limit && totalPages === undefined) {
      break;
    }
  }

  return entities;
}

/**
 * Expone "selectMermaCandidateFromStockResponse" en smart-economat-backend (Nest).
 * @undefined {unknown} response - Entrada efectiva esperada por el contrato.
 * @undefined {number} iteration - Entrada efectiva esperada por el contrato.
 * @undefined {{ productoId: string; maxCantidad: number; }} Datos efectivos después de ejecutar la operación.
 */
export function selectMermaCandidateFromStockResponse(
  response: unknown,
  iteration: number
): {
  productoId: string;
  maxCantidad: number;
} {
  const viableStocks = listFromResponse(response)
    .map((row) => ({
      productoId: toTrimmedSeedString(row.productoId),
      stockTotal: toSeedFiniteNumber(row.stockTotal),
    }))
    .filter(
      (row) =>
        row.productoId.length > 0 &&
        Number.isFinite(row.stockTotal) &&
        row.stockTotal >= 0.001
    )
    .sort((left, right) => right.stockTotal - left.stockTotal);

  if (viableStocks.length === 0) {
    throw new Error(
      '[seed-massive] No hay stock disponible para precrear una merma valida'
    );
  }

  const selectedStock = viableStocks[iteration % viableStocks.length];
  const maxCantidad = Math.max(
    0.001,
    Math.min(selectedStock.stockTotal * 0.25, 1.5)
  );

  return {
    productoId: selectedStock.productoId,
    maxCantidad: Number(maxCantidad.toFixed(3)),
  };
}

async function ensureOpenFoodFactsPool(context: SeedContext): Promise<void> {
  const existingPool = context.getState<OffProduct[]>('seedOpenFoodFactsPool');
  if (Array.isArray(existingPool) && existingPool.length > 0) {
    return;
  }

  const targetPoolSize = 50;
  const maxPages = 25;
  const dedupedByCode = new Map<string, OffProduct>();
  const elevatedToken =
    context.getState<string>('seedTokenSuperAdmin') ||
    context.getState<string>('seedTokenAdmin') ||
    context.getAccessToken();

  const activeProveedores = await fetchPaginatedEntities(
    context,
    '/proveedor',
    {
      tokenOverride: elevatedToken,
      collectPath: '/proveedor',
      maxPages: 10,
      limit: 50,
    }
  );
  const activeProveedorIds = extractActiveEntityIds(activeProveedores);

  if (activeProveedorIds.length === 0) {
    throw new Error(
      '[seed-massive] No hay proveedores activos para asociar productos de OpenFoodFacts'
    );
  }

  context.set('proveedorIds', activeProveedorIds);
  context.set('seedCreatedProveedorIds', activeProveedorIds);

  const existingProductos = await fetchPaginatedEntities(
    context,
    '/productos',
    {
      tokenOverride: elevatedToken,
      collectPath: '/productos',
      maxPages,
      limit: 50,
    }
  );
  const existingCodes = new Set(
    existingProductos
      .map((producto) => toTrimmedSeedString(producto.codigoBarras))
      .filter((code) => code.length > 0)
  );

  for (let page = 1; page <= maxPages; page++) {
    const products = await fetchOpenFoodFactsProducts({
      pageSize: 50,
      page,
      fallbackToCatalog: true,
    });
    if (!Array.isArray(products) || products.length === 0) {
      break;
    }

    for (const product of products) {
      const code = String(product?.code || '').trim();
      if (!code || existingCodes.has(code) || dedupedByCode.has(code)) {
        continue;
      }

      dedupedByCode.set(code, {
        ...product,
        code,
      });

      if (dedupedByCode.size >= targetPoolSize) {
        break;
      }
    }

    if (dedupedByCode.size >= targetPoolSize) {
      break;
    }
  }

  let nonExistingProducts = [...dedupedByCode.values()];

  if (nonExistingProducts.length === 0) {
    console.warn(
      '[seed-massive] Pool local vacío tras recorrer páginas → generando lote fallback determinista'
    );
    nonExistingProducts = generateFallbackOffProducts(targetPoolSize);
  }

  const previousToken = context.getAccessToken();

  if (elevatedToken) {
    context.setAccessToken(elevatedToken);
  }

  try {
    await hydrateOpenFoodFactsProductAssets(context, nonExistingProducts);
  } finally {
    context.setAccessToken(previousToken);
  }

  context.set('seedOpenFoodFactsPool', nonExistingProducts);
  context.set('seedOpenFoodFactsCursor', 0);
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

  type PreparacionIngredienteSeed = {
    productoId?: string;
    producto?: {
      id?: string;
    };
  };

  const productoIds = [
    ...new Set(
      preparacion.receta.ingredientes
        .map((ingrediente: PreparacionIngredienteSeed) => {
          if (
            typeof ingrediente.productoId === 'string' &&
            ingrediente.productoId.length > 0
          ) {
            return ingrediente.productoId;
          }

          return typeof ingrediente.producto?.id === 'string'
            ? ingrediente.producto.id
            : '';
        })
        .filter((id): id is string => id.length > 0)
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
      nuevoInventario.fechaEntrada = new Date(seedDateIso(0));
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
      '[seed-massive] Could not crear preparación pendiente: faltan recetaIds'
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

async function ensureRecetaStockReady(
  context: SeedContext,
  recetaId: string
): Promise<void> {
  const preparedIds = getStateArray(context, 'seedRecetaStockReadyIds');
  if (preparedIds.includes(recetaId)) {
    context.set('seedProduccionRecetaId', recetaId);
    return;
  }

  await ensureRepositoryReady();

  const recetaRepo = AppDataSource.getRepository(Receta);
  const inventarioRepo = AppDataSource.getRepository(Inventario);
  const productoProveedorRepo = AppDataSource.getRepository(ProductoProveedor);
  const ubicacionRepo = AppDataSource.getRepository(Ubicacion);

  const receta = await recetaRepo.findOne({
    where: { id: recetaId } as any,
    relations: ['ingredientes', 'ingredientes.producto'],
  });

  if (!receta?.ingredientes?.length) {
    pushStateValue(context, 'seedRecetaStockReadyIds', recetaId);
    context.set('seedProduccionRecetaId', recetaId);
    return;
  }

  type RecetaIngredienteSeed = {
    productoId?: string;
    producto?: { id?: string };
  };

  const productoIds = [
    ...new Set(
      receta.ingredientes
        .map((ingrediente: RecetaIngredienteSeed) => {
          if (
            typeof ingrediente.productoId === 'string' &&
            ingrediente.productoId.length > 0
          ) {
            return ingrediente.productoId;
          }

          return typeof ingrediente.producto?.id === 'string'
            ? ingrediente.producto.id
            : '';
        })
        .filter((id): id is string => id.length > 0)
    ),
  ];

  if (productoIds.length === 0) {
    pushStateValue(context, 'seedRecetaStockReadyIds', recetaId);
    context.set('seedProduccionRecetaId', recetaId);
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
        '[seed-massive] No hay ubicaciones disponibles para preparar stock de recetas'
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
      nuevoInventario.fechaEntrada = new Date(seedDateIso(0));
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

  pushStateValue(context, 'seedRecetaStockReadyIds', recetaId);
  context.set('seedProduccionRecetaId', recetaId);
}

async function ensureRecetaReadyForProduccion(
  context: SeedContext,
  iteration: number
): Promise<void> {
  const recetaId =
    pickStateValue(context, 'seedCreatedRecetaIds', iteration, '') ||
    pickStateValue(context, 'recetaIds', iteration, '');

  if (!recetaId) {
    throw new Error(
      '[seed-massive] Could not preparar producción: faltan recetaIds'
    );
  }

  await ensureRecetaStockReady(context, recetaId);
}

async function ensureDeletableProfesorAdminSlot(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  await ensureDeletableProfesorAdminSlotResource(context, coverage, iteration);
}

async function ensureDeletableProfesorSlot(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  await ensureDeletableProfesorSlotResource(context, coverage, iteration);
}

async function ensureDeletablePedido(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  await ensureDeletablePedidoResource(context, coverage, iteration);
}

async function ensureDeletableProveedor(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  await ensureDeletableProveedorResource(context, coverage, iteration);
}

async function ensureDeletableProducto(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  await ensureDeletableProductoResource(context, coverage, iteration);
}

async function ensureDeletableInventario(context: SeedContext): Promise<void> {
  await ensureDeletableInventarioResource(context);
}

const MIN_PORCIONES_FOR_CONSUMIR = 1;

/**
 * Sube el stock de los ingredientes de una receta para que `/produccion/ejecutar`
 * no falle por falta de existencias tras otros pasos del seed (p. ej. stock a 0).
 */
async function bumpInventarioForRecetaIngredients(
  recetaId: string
): Promise<void> {
  await ensureRepositoryReady();
  await AppDataSource.query(
    `UPDATE inventario AS i
     SET cantidad_actual = GREATEST(i.cantidad_actual::numeric, 500)
     FROM producto_proveedor AS pp
     WHERE pp.id = i.producto_proveedor_id
       AND i.deleted_at IS NULL
       AND pp.deleted_at IS NULL
       AND pp.producto_id IN (
         SELECT ri.producto_id FROM receta_ingrediente ri
         WHERE ri.receta_id = $1::uuid AND ri.deleted_at IS NULL
       )`,
    [recetaId]
  );
}

async function ensureLoteWithSufficientPortions(
  context: SeedContext,
  iteration: number
): Promise<void> {
  const createdLoteIds = getStateArray(context, 'seedCreatedProduccionLoteIds');
  const allLoteIds = [
    ...createdLoteIds,
    ...getStateArray(context, 'produccionLoteIds'),
  ];

  const targetId =
    allLoteIds.length > 0
      ? allLoteIds[iteration % allLoteIds.length]
      : undefined;

  if (targetId) {
    try {
      const lote = await context.requestJson<any>(`/produccion/${targetId}`, {
        method: 'GET',
        auth: true,
      });
      const porciones = Number(lote?.porcionesRestantes ?? 0);
      if (porciones >= MIN_PORCIONES_FOR_CONSUMIR) {
        context.set('consumirMaxPorciones', porciones);
        context.set('seedConsumirTargetLoteId', targetId);
        return;
      }
    } catch (error) {
      void error;
    }
  }

  const recetaId =
    pickStateValue(context, 'seedCreatedRecetaIds', 0, '') ||
    pickStateValue(context, 'recetaIds', 0, '');
  const ubicacionId = pickStateValue(context, 'ubicacionIds', 0, '');

  if (!recetaId) {
    return;
  }

  const previousToken = context.getAccessToken();
  const token =
    context.getState<string>('seedTokenSuperAdmin') ||
    context.getState<string>('seedTokenAdmin') ||
    previousToken;
  context.setAccessToken(token);

  try {
    await bumpInventarioForRecetaIngredients(recetaId);

    const cantidadesIntento = [10, 5, 1];
    let response: unknown;
    for (let i = 0; i < cantidadesIntento.length; i++) {
      const cantidadProducida = cantidadesIntento[i];
      const payload: Record<string, unknown> = {
        recetaId,
        cantidadProducida,
      };
      if (ubicacionId) {
        payload.ubicacionDestinoId = ubicacionId;
      }
      try {
        response = await context.requestJson<any>('/produccion/ejecutar', {
          method: 'POST',
          body: payload,
          auth: true,
        });
        break;
      } catch (err) {
        const msg = String(err instanceof Error ? err.message : err);
        if (
          msg.includes('Stock insuficiente') &&
          i < cantidadesIntento.length - 1
        ) {
          continue;
        }
        throw err;
      }
    }

    collectStateFromResponse(context, '/produccion/ejecutar', response);
    const newLoteId = extractResourceId(response);
    if (newLoteId) {
      pushStateValue(context, 'seedCreatedProduccionLoteIds', newLoteId);
      pushStateValue(context, 'produccionLoteIds', newLoteId);
      const respObj = response as { porcionesRestantes?: unknown };
      const porciones = Number(respObj?.porcionesRestantes ?? 10);
      context.set('consumirMaxPorciones', porciones);
      context.set('seedConsumirTargetLoteId', newLoteId);
    }
  } finally {
    context.setAccessToken(previousToken);
  }
}

async function ensureProductoWithSufficientStockForMerma(
  context: SeedContext,
  iteration: number
): Promise<void> {
  const elevatedToken =
    context.getState<string>('seedTokenSuperAdmin') ||
    context.getState<string>('seedTokenAdmin') ||
    context.getAccessToken();
  const stockResponse = await context.requestJson<unknown>(
    '/inventario/stock?consolidado=true',
    {
      method: 'GET',
      auth: true,
      tokenOverride: elevatedToken,
    }
  );
  const selectedStock = selectMermaCandidateFromStockResponse(
    stockResponse,
    iteration
  );

  context.set('seedMermaTargetProductoId', selectedStock.productoId);
  context.set('seedMermaMaxCantidad', selectedStock.maxCantidad);
}

async function resolveMermaProduccionStockTarget(
  ingredienteProductoIds: string[]
): Promise<
  | {
      productoId: string;
      stockTotal: number;
    }
  | undefined
> {
  if (ingredienteProductoIds.length === 0) {
    return undefined;
  }

  const stockRows = await AppDataSource.getRepository(Inventario)
    .createQueryBuilder('inv')
    .innerJoin('inv.productoProveedor', 'pp')
    .select('pp.producto_id', 'productoId')
    .addSelect('SUM(inv.cantidad_actual)', 'stockTotal')
    .where('pp.producto_id IN (:...productoIds)', {
      productoIds: ingredienteProductoIds,
    })
    .andWhere('inv.cantidad_actual > 0')
    .groupBy('pp.producto_id')
    .getRawMany<{
      productoId: string;
      stockTotal: string;
    }>();

  const viableRows = stockRows
    .map((row) => ({
      productoId: toTrimmedSeedString(row.productoId),
      stockTotal: toSeedFiniteNumber(row.stockTotal),
    }))
    .filter(
      (row) =>
        row.productoId.length > 0 &&
        Number.isFinite(row.stockTotal) &&
        row.stockTotal >= 0.001
    )
    .sort((left, right) => right.stockTotal - left.stockTotal);

  return viableRows[0];
}

async function ensureMermaProduccionTarget(
  context: SeedContext,
  iteration: number
): Promise<void> {
  await ensureLoteWithSufficientPortions(context, iteration);
  await ensureRepositoryReady();

  const loteRepository = AppDataSource.getRepository(ProduccionLote);
  const recetaIngredienteRepository =
    AppDataSource.getRepository(RecetaIngrediente);

  const loteCandidates = [
    context.getState<string>('seedConsumirTargetLoteId') || '',
    ...getStateArray(context, 'seedCreatedProduccionLoteIds'),
    ...getStateArray(context, 'produccionLoteIds'),
  ]
    .map((loteId) => loteId.trim())
    .filter((loteId) => loteId.length > 0);

  const uniqueLoteIds = [...new Set(loteCandidates)];

  if (uniqueLoteIds.length === 0) {
    throw new Error(
      '[seed-massive] No hay lotes de producción disponibles para merma de producción'
    );
  }

  const pivot = iteration % uniqueLoteIds.length;
  const orderedLoteIds = [
    ...uniqueLoteIds.slice(pivot),
    ...uniqueLoteIds.slice(0, pivot),
  ];

  for (const loteId of orderedLoteIds) {
    const lote = await loteRepository.findOne({
      where: { id: loteId } as any,
      withDeleted: true,
    });

    if (!lote?.recetaId) {
      continue;
    }

    const ingredientes = await recetaIngredienteRepository.find({
      where: { recetaId: lote.recetaId } as any,
      withDeleted: true,
    });

    const ingredienteProductoIds = [
      ...new Set(
        ingredientes
          .map((ingrediente) => toTrimmedSeedString(ingrediente.productoId))
          .filter((productoId) => productoId.length > 0)
      ),
    ];

    if (ingredienteProductoIds.length === 0) {
      continue;
    }

    let stockTarget = await resolveMermaProduccionStockTarget(
      ingredienteProductoIds
    );

    if (!stockTarget) {
      await ensureRecetaStockReady(context, lote.recetaId);
      stockTarget = await resolveMermaProduccionStockTarget(
        ingredienteProductoIds
      );
    }

    const selectedProductoId =
      stockTarget?.productoId || ingredienteProductoIds[0];
    const stockTotal = stockTarget?.stockTotal ?? 1;
    const maxCantidad = Math.max(0.001, Math.min(stockTotal * 0.25, 1.5));

    context.set('seedMermaProduccionLoteId', lote.id);
    context.set('seedMermaProduccionProductoId', selectedProductoId);
    context.set(
      'seedMermaProduccionMaxCantidad',
      Number(maxCantidad.toFixed(3))
    );

    return;
  }

  throw new Error(
    '[seed-massive] Could not resolver lote e ingrediente válidos para /merma/produccion/reportar'
  );
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
  rememberPedidoUsuarioChildPedidos(context, pedidoUsuarioId, response);
}

/**
 * Pone a 0 el stock de inventario de los ingredientes de las recetas sembradas,
 * para que `from-missing-stock` pueda generar líneas (requerido > disponible).
 */
async function ensureInventarioBajoParaFaltantesDesdeRecetasSeed(
  context: SeedContext
): Promise<void> {
  const merged = Array.from(
    new Set(
      [
        ...getStateArray(context, 'seedCreatedRecetaIds'),
        ...getStateArray(context, 'recetaIds'),
      ].filter(
        (id): id is string => typeof id === 'string' && id.trim().length > 0
      )
    )
  );

  let recetaIds = merged;
  if (recetaIds.length === 0) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const rowsUnknown: unknown = await AppDataSource.query(
      `SELECT id FROM receta WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 8`
    );
    const parsed: string[] = [];
    if (Array.isArray(rowsUnknown)) {
      for (const row of rowsUnknown) {
        if (typeof row === 'object' && row !== null && 'id' in row) {
          const id = (row as { id: unknown }).id;
          if (typeof id === 'string' && id.trim().length > 0) {
            parsed.push(id);
          }
        }
      }
    }
    recetaIds = parsed;
  }

  if (recetaIds.length === 0) {
    return;
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.query(
    `UPDATE inventario AS i
     SET cantidad_actual = 0
     WHERE i.deleted_at IS NULL
       AND EXISTS (
         SELECT 1 FROM producto_proveedor pp
         WHERE pp.id = i.producto_proveedor_id
           AND pp.deleted_at IS NULL
           AND pp.producto_id IN (
             SELECT DISTINCT ri.producto_id
             FROM receta_ingrediente ri
             WHERE ri.receta_id = ANY($1::uuid[])
           )
       )`,
    [recetaIds]
  );
}

async function ensurePendingPedidoForUpdate(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  const hasPreparedPending =
    getStateArray(context, 'seedPreparedPedidoPendienteIds').length > 0;

  if (hasPreparedPending) {
    return;
  }

  const createEndpoint: Endpoint = {
    method: 'POST',
    path: '/pedidos',
    source: 'precreate-pedido',
  };

  const createBody = buildBody(
    context,
    createEndpoint,
    '/pedidos',
    iteration,
    coverage
  );

  const response = await context.requestJson<unknown>('/pedidos', {
    method: 'POST',
    body: createBody,
    auth: true,
  });

  collectStateFromResponse(context, '/pedidos', response);

  const pedidoId = extractResourceId(response);
  if (!pedidoId) {
    throw new Error(
      '[seed-massive] No se recibió ID al precrear pedido pendiente para PATCH'
    );
  }

  const createdPedido = listFromResponse(response).find(
    (entity) => entity.id === pedidoId
  );

  if (createdPedido?.estado !== EstadoPedido.PENDIENTE_DE_APROBACION) {
    throw new Error(
      `[seed-massive] El pedido precreado ${pedidoId} no quedo en estado pendiente.`
    );
  }

  pushStateValue(context, 'seedPreparedPedidoPendienteIds', pedidoId);
  pushStateValue(context, 'seedCreatedPedidoPendienteIds', pedidoId);
  pushStateValue(context, 'pedidoPendienteIds', pedidoId);
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

  await ensureInventarioBajoParaFaltantesDesdeRecetasSeed(context);

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

  const createdBatch = listFromResponse(response).find(
    (entity) => entity.id === purchaseBatchId
  );

  if (createdBatch?.estado !== EstadoLote.PENDIENTE) {
    throw new Error(
      `[seed-massive] El lote precreado ${purchaseBatchId} no quedo en estado pendiente.`
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
  rememberPedidoUsuarioChildPedidos(context, pedidoUsuarioId, response);
  pushStateValue(context, 'seedConsolidatePedidoUsuarioIds', pedidoUsuarioId);
}

async function ensureReportableRecepcionIds(
  context: SeedContext
): Promise<void> {
  await ensureRepositoryReady();

  const rows = await AppDataSource.query(`
    SELECT DISTINCT rp.recepcion_id AS "recepcionId"
    FROM recepcion_producto rp
    INNER JOIN pedido_producto pp ON pp.id = rp.pedido_producto_id
    WHERE rp.deleted_at IS NULL
      AND pp.deleted_at IS NULL
      AND (
        ABS(COALESCE(rp.cantidad_recibida, 0) - COALESCE(pp.cantidad, 0)) > 0.0005
        OR rp.estado_producto IN ('ROTO', 'FALTA_TOTAL', 'EXCEDE')
      )
  `);

  const recepcionIds = (Array.isArray(rows) ? rows : [])
    .map((row) => (isRecord(row) ? toTrimmedSeedString(row.recepcionId) : ''))
    .filter((id) => id.length > 0);

  if (recepcionIds.length === 0) {
    throw new Error(
      '[seed-massive] No hay recepciones con discrepancia para /incidencias/reportar'
    );
  }

  context.set('recepcionReportableIds', Array.from(new Set(recepcionIds)));
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
      '[seed-massive] Could not precrear incidencia para resolver: faltan recepcionIds'
    );
  }

  const createEndpoint: Endpoint = {
    method: 'POST',
    path: '/incidencias',
    source: 'precreate-incidencia-resolver',
  };

  const createBody = buildBody(
    context,
    createEndpoint,
    '/incidencias',
    iteration,
    coverage
  );

  const recepcionCandidates = recepcionIds.filter((id) => id.length > 0);
  const pedidoProductoCandidates = Array.from(
    new Set([
      ...getStateArray(context, 'pedidoProductoIdsFresh'),
      ...getStateArray(context, 'seedCreatedPedidoProductoIds'),
      ...getStateArray(context, 'pedidoProductoIds'),
    ])
  ).filter((id) => id.length > 0);

  if (pedidoProductoCandidates.length === 0) {
    throw new Error(
      '[seed-massive] Could not precrear incidencia para resolver: faltan pedidoProductoIds válidos'
    );
  }

  const previousToken = context.getAccessToken();
  context.setAccessToken(chooseTokenForPath(context, '/incidencias'));

  try {
    let created = false;

    for (const [recepcionIndex, recepcionId] of recepcionCandidates.entries()) {
      for (
        let lineIndex = 0;
        lineIndex < Math.min(pedidoProductoCandidates.length, 6);
        lineIndex++
      ) {
        const pedidoProductoId =
          pedidoProductoCandidates[
            (iteration + recepcionIndex + lineIndex) %
              pedidoProductoCandidates.length
          ] || '';

        if (!pedidoProductoId) {
          continue;
        }

        const lineasBase = Array.isArray(createBody.lineas)
          ? createBody.lineas
          : [];
        const primeraLinea =
          lineasBase.length > 0 && isRecord(lineasBase[0]) ? lineasBase[0] : {};

        const candidateBody = {
          ...createBody,
          recepcionId,

          pedidoId: undefined,
          lineas: [
            {
              ...primeraLinea,
              pedidoProductoId,
              cantidadEsperada:
                Number(primeraLinea.cantidadEsperada) > 0
                  ? Number(primeraLinea.cantidadEsperada)
                  : 10,
              cantidadRecibida: Number.isFinite(
                Number(primeraLinea.cantidadRecibida)
              )
                ? Number(primeraLinea.cantidadRecibida)
                : 8,
              tipoDiferencia:
                typeof primeraLinea.tipoDiferencia === 'string'
                  ? primeraLinea.tipoDiferencia
                  : 'FALTANTE',
              observaciones:
                typeof primeraLinea.observaciones === 'string'
                  ? primeraLinea.observaciones
                  : 'Precreación de incidencia para flujo resolver',
            },
          ],
        };

        try {
          const response = await context.requestJson<unknown>('/incidencias', {
            method: 'POST',
            body: candidateBody,
            auth: true,
          });

          collectStateFromResponse(context, '/incidencias', response);
          created = true;
          break;
        } catch (error) {
          if (
            error instanceof HttpSeedRequestError &&
            [400, 404, 409].includes(error.status)
          ) {
            continue;
          }

          throw error;
        }
      }

      if (created) {
        break;
      }
    }

    if (!created) {
      for (const recepcionId of recepcionCandidates) {
        try {
          const response = await context.requestJson<unknown>(
            '/incidencias/reportar',
            {
              method: 'POST',
              body: {
                recepcionId,
                tipo:
                  typeof createBody.tipo === 'string'
                    ? createBody.tipo
                    : 'otro',
              },
              auth: true,
            }
          );

          collectStateFromResponse(context, '/incidencias/reportar', response);
          created = true;
          break;
        } catch (error) {
          if (
            error instanceof HttpSeedRequestError &&
            [400, 404, 409].includes(error.status)
          ) {
            continue;
          }

          throw error;
        }
      }
    }
  } finally {
    context.setAccessToken(previousToken);
  }

  const hasPending =
    getStateArray(context, 'incidenciaPendienteIds').length > 0;
  if (!hasPending) {
    throw new Error(
      '[seed-massive] Could not precrear incidencia para resolver: response without reusable ID'
    );
  }
}

function buildDistribucionLineasDesdeDisponible(
  disponible: Record<string, unknown>,
  iteration: number
): Array<Record<string, unknown>> {
  const lineasRaw = Array.isArray(disponible.lineas) ? disponible.lineas : [];
  const lineas: Array<Record<string, unknown>> = [];

  for (const [index, lineaRaw] of lineasRaw.entries()) {
    if (!isRecord(lineaRaw)) {
      continue;
    }

    const pedidoUsuarioLineaId = toTrimmedSeedString(
      lineaRaw.pedidoUsuarioLineaId
    );
    const cantidadPendiente = toSeedFiniteNumber(lineaRaw.cantidadPendiente);

    if (!pedidoUsuarioLineaId || !Number.isFinite(cantidadPendiente)) {
      continue;
    }

    if (cantidadPendiente < 0.001) {
      continue;
    }

    const cantidadBase = Math.min(
      cantidadPendiente,
      1 + ((iteration + index) % 2)
    );
    const cantidad = Number(Math.max(0.001, cantidadBase).toFixed(3));

    if (!Number.isFinite(cantidad) || cantidad < 0.001) {
      continue;
    }

    lineas.push({
      pedidoUsuarioLineaId,
      cantidad,
      observaciones: 'Preparado por seed masivo',
    });

    if (lineas.length >= 4) {
      break;
    }
  }

  return lineas;
}

function resolveDistribucionDestinoDesdeDisponible(
  disponible: Record<string, unknown>
): {
  ubicacionDestinoId?: string;
  alumnoSlotId?: string;
} {
  const ubicacionSugerida = isRecord(disponible.ubicacionDestinoSugerida)
    ? disponible.ubicacionDestinoSugerida
    : undefined;
  const alumnoSlot = isRecord(disponible.alumnoSlot)
    ? disponible.alumnoSlot
    : undefined;

  const ubicacionesUsuario = Array.isArray(disponible.ubicacionesUsuario)
    ? disponible.ubicacionesUsuario
    : [];

  const primeraUbicacionUsuario = ubicacionesUsuario.find(
    (ubicacion) =>
      isRecord(ubicacion) && toTrimmedSeedString(ubicacion.id).length > 0
  ) as Record<string, unknown> | undefined;

  const ubicacionDestinoId =
    toTrimmedSeedString(ubicacionSugerida?.id) ||
    toTrimmedSeedString(alumnoSlot?.ubicacionId) ||
    toTrimmedSeedString(primeraUbicacionUsuario?.id);
  const alumnoSlotId = toTrimmedSeedString(alumnoSlot?.id);

  return {
    ...(ubicacionDestinoId ? { ubicacionDestinoId } : {}),
    ...(alumnoSlotId ? { alumnoSlotId } : {}),
  };
}

function findPedidoIdsForPedidoUsuario(
  context: SeedContext,
  pedidoUsuarioId: string
): string[] {
  const pairs = getStateArray(context, 'pedidoUsuarioToPedidoPairs');
  return pairs
    .map((pair) => pair.split('|'))
    .filter(
      (parts) =>
        parts.length === 2 &&
        parts[0] === pedidoUsuarioId &&
        typeof parts[1] === 'string' &&
        parts[1].length > 0
    )
    .map((parts) => parts[1]);
}

function findPedidoProductoIdForPedido(
  context: SeedContext,
  pedidoId: string,
  iteration: number
): string {
  const pairs = [
    ...getStateArray(context, 'pedidoProductoToPedidoPairsFresh'),
    ...getStateArray(context, 'pedidoProductoToPedidoPairs'),
  ];

  const pedidoProductoIds = pairs
    .map((pair) => pair.split('|'))
    .filter(
      (parts) =>
        parts.length === 2 &&
        parts[1] === pedidoId &&
        typeof parts[0] === 'string' &&
        parts[0].length > 0
    )
    .map((parts) => parts[0]);

  if (pedidoProductoIds.length === 0) {
    return '';
  }

  return pedidoProductoIds[iteration % pedidoProductoIds.length] || '';
}

function hasProfesorOwnedSlots(context: SeedContext, token: string): boolean {
  if (!token) {
    return false;
  }

  const tokenIndexMapJson =
    context.getState<string>('seedProfesorIndexByToken') || '{}';

  let tokenIndexMap: Record<string, number> = {};
  try {
    tokenIndexMap = JSON.parse(tokenIndexMapJson) as Record<string, number>;
  } catch {
    tokenIndexMap = {};
  }

  const profesorIndex = tokenIndexMap[token];
  if (typeof profesorIndex !== 'number') {
    return false;
  }

  const ownedSlotIdsJson =
    context.getState<string>(`seedProfesorOwnedSlotIds:${profesorIndex}`) ||
    '[]';

  let ownedSlotIds: unknown = [];
  try {
    ownedSlotIds = JSON.parse(ownedSlotIdsJson) as unknown;
  } catch {
    ownedSlotIds = [];
  }

  return (
    Array.isArray(ownedSlotIds) &&
    ownedSlotIds.some(
      (slotId) => typeof slotId === 'string' && slotId.trim().length > 0
    )
  );
}

function chooseDistribucionBootstrapActorToken(
  context: SeedContext,
  fallbackToken: string
): string {
  const privilegedToken =
    context.getState<string>('seedTokenSuperAdmin') ||
    context.getState<string>('seedTokenAdmin') ||
    '';

  if (privilegedToken) {
    return privilegedToken;
  }

  const sessionProfesorTokens = context.getSessionTokensByPrefix('profesor:');
  const stateProfesorTokens = getStateArray(context, 'seedProfesorTokens');
  const fixedProfesorToken =
    context.getState<string>('seedTokenProfesor') || '';

  const candidateTokens = Array.from(
    new Set(
      [
        ...sessionProfesorTokens,
        ...stateProfesorTokens,
        fixedProfesorToken,
      ].filter((token) => Boolean(token))
    )
  );

  const tokenWithSlots = candidateTokens.find((token) =>
    hasProfesorOwnedSlots(context, token)
  );

  return tokenWithSlots || candidateTokens[0] || fallbackToken;
}

function resolveBootstrapDestinoUbicacionId(
  context: SeedContext,
  iteration: number
): string {
  const ubicaciones = getStateArray(context, 'ubicacionIds').filter(
    (ubicacionId) => typeof ubicacionId === 'string' && ubicacionId.length > 0
  );
  const originId =
    context.getState<string>('seedDefaultUbicacionId') || ubicaciones[0] || '';

  const preferredDestino =
    ubicaciones.find((ubicacionId) => ubicacionId !== originId) ||
    pickStateValue(context, 'ubicacionIds', iteration + 1, '');

  if (preferredDestino && preferredDestino !== originId) {
    return preferredDestino;
  }

  return '';
}

async function ensureDistribucionDisponibilidadBootstrap(
  context: SeedContext,
  iteration: number,
  coverage: EnumCoverage,
  tokenOverride?: string
): Promise<void> {
  const fallbackToken =
    tokenOverride || chooseTokenForPath(context, '/pedido-usuarios', 'POST');
  const bootstrapToken = chooseDistribucionBootstrapActorToken(
    context,
    fallbackToken
  );

  const createPedidoUsuarioEndpoint: Endpoint = {
    method: 'POST',
    path: '/pedido-usuarios',
    source: 'precreate-distribucion-pedido-usuario',
  };

  const pedidoUsuarioBody = buildBody(
    context,
    createPedidoUsuarioEndpoint,
    '/pedido-usuarios',
    iteration,
    coverage
  );
  const pedidoUsuarioBodyRecord: Record<string, unknown> = isRecord(
    pedidoUsuarioBody
  )
    ? { ...pedidoUsuarioBody }
    : {};

  const suggestedDestinoId = resolveBootstrapDestinoUbicacionId(
    context,
    iteration
  );
  if (
    suggestedDestinoId &&
    !toTrimmedSeedString(pedidoUsuarioBodyRecord.ubicacionEntregaSugeridaId)
  ) {
    pedidoUsuarioBodyRecord.ubicacionEntregaSugeridaId = suggestedDestinoId;
  }

  const pedidoUsuarioResponse = await context.requestJson<unknown>(
    '/pedido-usuarios',
    {
      method: 'POST',
      body: pedidoUsuarioBodyRecord,
      auth: true,
      tokenOverride: bootstrapToken,
    }
  );

  collectStateFromResponse(context, '/pedido-usuarios', pedidoUsuarioResponse);

  const pedidoUsuarioId = extractResourceId(pedidoUsuarioResponse);
  if (!pedidoUsuarioId) {
    throw new Error(
      '[seed-massive] Could not precrear pedido-usuario para bootstrap de distribuciones'
    );
  }

  pushStateValue(context, 'seedCreatedPedidoUsuarioIds', pedidoUsuarioId);
  pushStateValue(context, 'pedidoUsuarioIds', pedidoUsuarioId);
  pushStateValue(context, 'pedidoUsuarioPendienteIds', pedidoUsuarioId);
  rememberPedidoUsuarioChildPedidos(
    context,
    pedidoUsuarioId,
    pedidoUsuarioResponse
  );

  const aceptarResponse = await context.requestJson<unknown>(
    `/pedido-usuarios/${pedidoUsuarioId}/aceptar`,
    {
      method: 'PATCH',
      body: {},
      auth: true,
      tokenOverride: bootstrapToken,
    }
  );

  collectStateFromResponse(
    context,
    `/pedido-usuarios/${pedidoUsuarioId}/aceptar`,
    aceptarResponse
  );
  rememberPedidoUsuarioChildPedidos(context, pedidoUsuarioId, aceptarResponse);

  const pedidoIds = findPedidoIdsForPedidoUsuario(context, pedidoUsuarioId);
  if (pedidoIds.length === 0) {
    throw new Error(
      '[seed-massive] No se generaron pedidos asociados al pedido-usuario bootstrap para distribuciones'
    );
  }

  const pedidoId = pedidoIds[0];

  try {
    const aceptarPedidoResponse = await context.requestJson<unknown>(
      `/pedidos/${pedidoId}/aceptar`,
      {
        method: 'PATCH',
        body: {},
        auth: true,
        tokenOverride: bootstrapToken,
      }
    );
    collectStateFromResponse(
      context,
      `/pedidos/${pedidoId}/aceptar`,
      aceptarPedidoResponse
    );
  } catch (error) {
    void error;
  }

  let pedidoProductoId = findPedidoProductoIdForPedido(
    context,
    pedidoId,
    iteration
  );

  if (!pedidoProductoId) {
    const pedidoDetalleResponse = await context.requestJson<unknown>(
      `/pedidos/${pedidoId}`,
      {
        method: 'GET',
        auth: true,
        tokenOverride: bootstrapToken,
      }
    );

    collectStateFromResponse(
      context,
      `/pedidos/${pedidoId}`,
      pedidoDetalleResponse
    );
    pedidoProductoId = findPedidoProductoIdForPedido(
      context,
      pedidoId,
      iteration
    );
  }

  if (!pedidoProductoId) {
    throw new Error(
      '[seed-massive] Could not resolver pedidoProductoId para bootstrap de distribuciones'
    );
  }

  const albaranRef = `ALB-DIST-${String(iteration + 1).padStart(6, '0')}`;

  const recepcionBody: Record<string, unknown> = {
    pedidos: [
      {
        pedidoId,
        nAlbaran: albaranRef,
        observaciones: 'Recepción bootstrap para habilitar distribución',
      },
    ],
    nAlbaran: albaranRef,
    fechaRecepcion: seedDateIso(0),
    observaciones: 'Recepción bootstrap para habilitar distribución',
    productos: [
      {
        pedidoProductoId,
        cantidadRecibida: 1,
        cantidadAlbaran: 1,
        estadoVisual: 'OPTIMO',
        estadoProducto: 'PERFECTO',
        observaciones: 'Línea de recepción bootstrap',
        isWeighedWithScale: false,
      },
    ],
    productosNuevos: [],
  };

  const recepcionToken = chooseTokenForPath(context, '/recepciones', 'POST');

  const recepcionResponse = await context.requestJson<unknown>('/recepciones', {
    method: 'POST',
    body: recepcionBody,
    auth: true,
    tokenOverride: recepcionToken,
  });

  collectStateFromResponse(context, '/recepciones', recepcionResponse);
}

/**
 * Garantiza la existencia, coherencia o validez del recurso indicado.
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {EnumCoverage} coverage - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function ensureDistribucionDisponiblesPostRun(
  context: SeedContext,
  coverage: EnumCoverage
): Promise<void> {
  const readToken =
    context.getState<string>('seedTokenSuperAdmin') ||
    context.getState<string>('seedTokenAdmin') ||
    chooseTokenForPath(context, '/distribuciones/disponibles', 'GET');
  const bootstrapToken = chooseDistribucionBootstrapActorToken(
    context,
    readToken
  );

  const fetchDisponibles = async (): Promise<
    Array<Record<string, unknown>>
  > => {
    const response = await context.requestJson<unknown>(
      buildPaginatedListPath('/distribuciones/disponibles', 1, 50),
      {
        method: 'GET',
        auth: true,
        tokenOverride: readToken,
      }
    );

    collectStateFromResponse(context, '/distribuciones/disponibles', response);
    return listFromResponse(response);
  };

  let disponibles = await fetchDisponibles();
  if (disponibles.length > 0) {
    return;
  }

  const bootstrapIteration =
    getStateArray(context, 'pedidoUsuarioIds').length +
    getStateArray(context, 'distribucionIds').length;

  await ensureDistribucionDisponibilidadBootstrap(
    context,
    bootstrapIteration,
    coverage,
    bootstrapToken
  );

  disponibles = await fetchDisponibles();
  if (disponibles.length === 0) {
    throw new Error(
      '[seed-massive] No se pudieron dejar pedidos disponibles para distribuir tras el bootstrap final'
    );
  }
}

function unwrapIncidenciaPayload(
  payload: unknown
): Record<string, unknown> | null {
  if (isRecord(payload)) {
    if (isRecord(payload.data)) {
      return payload.data;
    }

    return payload;
  }

  return null;
}

function readIncidenciaEstado(payload: unknown): string {
  const incidencia = unwrapIncidenciaPayload(payload);
  const estado = toTrimmedSeedString(incidencia?.estado);
  return estado.toLowerCase();
}

function readIncidenciaLineas(
  payload: unknown
): Array<Record<string, unknown>> {
  const incidencia = unwrapIncidenciaPayload(payload);
  if (!incidencia || !Array.isArray(incidencia.lineas)) {
    return [];
  }

  return incidencia.lineas.filter(isRecord);
}

async function createReportedIncidencia(
  context: SeedContext,
  recepcionIds: string[],
  token: string,
  startOffset: number
): Promise<string> {
  for (let offset = 0; offset < recepcionIds.length; offset++) {
    const recepcionId =
      recepcionIds[(startOffset + offset) % recepcionIds.length] || '';
    if (!recepcionId) {
      continue;
    }

    try {
      const response = await context.requestJson<unknown>(
        '/incidencias/reportar',
        {
          method: 'POST',
          body: {
            recepcionId,
            tipo: 'otro',
          },
          auth: true,
          tokenOverride: token,
        }
      );

      collectStateFromResponse(context, '/incidencias/reportar', response);
      const incidenciaId = extractResourceId(response);
      if (incidenciaId) {
        return incidenciaId;
      }
    } catch (error) {
      if (
        error instanceof HttpSeedRequestError &&
        [400, 404, 409].includes(error.status)
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    '[seed-massive] No fue posible crear incidencia reportada para garantizar cobertura final de estados'
  );
}

async function fetchIncidenciaById(
  context: SeedContext,
  incidenciaId: string,
  token: string
): Promise<Record<string, unknown>> {
  const payload = await context.requestJson<unknown>(
    `/incidencias/${incidenciaId}`,
    {
      method: 'GET',
      auth: true,
      tokenOverride: token,
    }
  );

  collectStateFromResponse(context, '/incidencias/:id', payload);
  const incidencia = unwrapIncidenciaPayload(payload);
  if (!incidencia) {
    throw new Error(
      `[seed-massive] Could not leer incidencia ${incidenciaId} to verify state`
    );
  }

  return incidencia;
}

async function fetchObservedIncidenciaStates(
  context: SeedContext,
  token: string
): Promise<Set<string>> {
  const observed = new Set<string>();

  for (let page = 1; page <= 5; page++) {
    const payload = await context.requestJson<unknown>(
      buildPaginatedListPath('/incidencias', page, 50),
      {
        method: 'GET',
        auth: true,
        tokenOverride: token,
      }
    );

    collectStateFromResponse(context, '/incidencias', payload);
    const rows = listFromResponse(payload);
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      const estado = toTrimmedSeedString(row.estado).toLowerCase();
      if (estado.length > 0) {
        observed.add(estado);
      }
    }

    if (rows.length < 50) {
      break;
    }
  }

  return observed;
}

async function ensureIncidenciaStateSample(
  context: SeedContext,
  targetEstado: string,
  recepcionIds: string[],
  usuarioId: string,
  token: string,
  cursor: number
): Promise<string> {
  const incidenciaId = await createReportedIncidencia(
    context,
    recepcionIds,
    token,
    cursor
  );

  if (targetEstado === 'abierta') {
    return incidenciaId;
  }

  const incidenciaDetalle = await fetchIncidenciaById(
    context,
    incidenciaId,
    token
  );
  const lineas = readIncidenciaLineas(incidenciaDetalle);

  if (targetEstado === 'en_proceso') {
    const ajustes = lineas
      .map((linea) => {
        const lineaId = toTrimmedSeedString(linea.id);
        const cantidadPedidaLinea =
          toSeedFiniteNumber(linea.cantidadEsperada) ||
          toSeedFiniteNumber(linea.cantidadPedida);

        if (!lineaId || !Number.isFinite(cantidadPedidaLinea)) {
          return null;
        }

        return {
          id: lineaId,
          cantidadRecibida: Number(cantidadPedidaLinea.toFixed(3)),
        };
      })
      .filter(
        (linea): linea is { id: string; cantidadRecibida: number } =>
          linea !== null
      );

    if (ajustes.length === 0) {
      const primeraLineaId = toTrimmedSeedString(lineas[0]?.id);
      if (!primeraLineaId) {
        throw new Error(
          `[seed-massive] Incidencia ${incidenciaId} sin líneas para pasar a EN_PROCESO`
        );
      }

      const responseReclamo = await context.requestJson<unknown>(
        `/incidencias/${incidenciaId}/resolver`,
        {
          method: 'PATCH',
          body: {
            marcarComoResuelta: false,
            lineas: [
              {
                id: primeraLineaId,
                estadoReclamacion: 'RECLAMADO',
              },
            ],
            observacionesResolucion:
              'Seed cobertura en_proceso (reclamo línea)',
          },
          auth: true,
          tokenOverride: token,
        }
      );
      collectStateFromResponse(
        context,
        `/incidencias/${incidenciaId}/resolver`,
        responseReclamo
      );
      return incidenciaId;
    }

    const response = await context.requestJson<unknown>(
      `/incidencias/${incidenciaId}/resolver`,
      {
        method: 'PATCH',
        body: {
          marcarComoResuelta: false,
          lineas: ajustes,
          observacionesResolucion:
            'Seed cobertura en_proceso (ajuste cantidades)',
        },
        auth: true,
        tokenOverride: token,
      }
    );
    collectStateFromResponse(
      context,
      `/incidencias/${incidenciaId}/resolver`,
      response
    );
    return incidenciaId;
  }

  if (targetEstado === 'resuelta') {
    const response = await context.requestJson<unknown>(
      `/incidencias/${incidenciaId}/resolver`,
      {
        method: 'PATCH',
        body: {
          usuarioId,
          marcarComoResuelta: true,
          estadoFinal: 'resuelta',
          observacionesResolucion: 'Seed cobertura estado resuelta',
        },
        auth: true,
        tokenOverride: token,
      }
    );
    collectStateFromResponse(
      context,
      `/incidencias/${incidenciaId}/resolver`,
      response
    );
    return incidenciaId;
  }

  throw new Error(
    `[seed-massive] Estado de incidencia no soportado en post-run: ${targetEstado}`
  );
}

/**
 * Garantiza la existencia, coherencia o validez del recurso indicado.
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function ensureIncidenciaEstadosPostRun(
  context: SeedContext
): Promise<void> {
  const recepcionIds = getStateArray(context, 'recepcionIds').filter(
    (id) => id.length > 0
  );
  const usuarioIds = getStateArray(context, 'usuarioIds').filter(
    (id) => id.length > 0
  );

  if (recepcionIds.length === 0 || usuarioIds.length === 0) {
    throw new Error(
      '[seed-massive] No hay recepciones o usuarios suficientes para garantizar estados finales de incidencias'
    );
  }

  const token =
    context.getState<string>('seedTokenSuperAdmin') ||
    context.getState<string>('seedTokenAdmin') ||
    chooseTokenForPath(context, '/incidencias/reportar', 'POST');

  const observedBefore = await fetchObservedIncidenciaStates(context, token);
  const missingStates = INCIDENCIA_ESTADOS.filter(
    (estado) => !observedBefore.has(estado)
  );

  let cursor = 0;
  for (const estado of missingStates) {
    const incidenciaId = await ensureIncidenciaStateSample(
      context,
      estado,
      recepcionIds,
      usuarioIds[cursor % usuarioIds.length] || usuarioIds[0] || '',
      token,
      cursor
    );

    const refreshed = await fetchIncidenciaById(context, incidenciaId, token);
    const finalEstado = readIncidenciaEstado(refreshed);
    if (finalEstado !== estado) {
      throw new Error(
        `[seed-massive] Estado final de incidencia no coincide: esperado=${estado}, obtenido=${finalEstado || 'desconocido'} (id=${incidenciaId})`
      );
    }

    cursor += 1;
  }

  const observedAfter = await fetchObservedIncidenciaStates(context, token);
  const stillMissing = INCIDENCIA_ESTADOS.filter(
    (estado) => !observedAfter.has(estado)
  );

  if (stillMissing.length > 0) {
    throw new Error(
      `[seed-massive] No se logró cobertura final de estados de incidencia: ${stillMissing.join(', ')}`
    );
  }
}

async function buildDistribucionCreateBody(
  context: SeedContext,
  iteration: number,
  coverage: EnumCoverage,
  tokenOverride?: string
): Promise<Record<string, unknown>> {
  const fetchDisponibles = async (): Promise<
    Array<Record<string, unknown>>
  > => {
    const disponiblesResponse = await context.requestJson<unknown>(
      buildPaginatedListPath('/distribuciones/disponibles', 1, 50),
      {
        method: 'GET',
        auth: true,
        tokenOverride,
      }
    );

    collectStateFromResponse(
      context,
      '/distribuciones/disponibles',
      disponiblesResponse
    );

    return listFromResponse(disponiblesResponse);
  };

  const buildBodyFromDisponibles = (
    disponiblesItems: Array<Record<string, unknown>>,
    cycleOffset: number
  ): Record<string, unknown> | undefined => {
    for (let offset = 0; offset < disponiblesItems.length; offset++) {
      const candidato =
        disponiblesItems[
          (iteration + cycleOffset + offset) % disponiblesItems.length
        ];
      if (!candidato) {
        continue;
      }

      const pedidoUsuarioId = toTrimmedSeedString(candidato.pedidoUsuarioId);
      if (!pedidoUsuarioId) {
        continue;
      }

      const lineas = buildDistribucionLineasDesdeDisponible(
        candidato,
        iteration
      );
      if (lineas.length === 0) {
        continue;
      }

      const ubicacionOrigenId =
        context.getState<string>('seedDefaultUbicacionId') ||
        pickStateValue(context, 'ubicacionIds', iteration, '');

      const destino = resolveDistribucionDestinoDesdeDisponible(candidato);
      const fallbackUbicacionDestinoId =
        getStateArray(context, 'ubicacionIds').find(
          (ubicacionId) =>
            typeof ubicacionId === 'string' &&
            ubicacionId.length > 0 &&
            ubicacionId !== ubicacionOrigenId
        ) ||
        pickStateValue(context, 'ubicacionIds', iteration + offset + 1, '');
      const ubicacionDestinoId =
        destino.ubicacionDestinoId || fallbackUbicacionDestinoId;

      if (!ubicacionDestinoId) {
        continue;
      }

      return {
        pedidoUsuarioId,
        ...(ubicacionOrigenId ? { ubicacionOrigenId } : {}),
        ...(ubicacionDestinoId ? { ubicacionDestinoId } : {}),
        ...(destino.alumnoSlotId ? { alumnoSlotId: destino.alumnoSlotId } : {}),
        observaciones: `Distribución automática seed #${iteration + 1}`,
        lineas,
      };
    }

    return undefined;
  };

  let disponibles = await fetchDisponibles();
  let distribucionBody = buildBodyFromDisponibles(disponibles, 0);
  if (distribucionBody) {
    return distribucionBody;
  }

  await ensureDistribucionDisponibilidadBootstrap(
    context,
    iteration + disponibles.length,
    coverage,
    tokenOverride
  );

  disponibles = await fetchDisponibles();
  distribucionBody = buildBodyFromDisponibles(disponibles, 1);
  if (distribucionBody) {
    return distribucionBody;
  }

  throw new Error(
    '[seed-massive] No se encontró candidato distribuible con lineas pendientes y destino válido'
  );
}

async function ensurePreparedDistribucionForAction(
  context: SeedContext,
  iteration: number,
  coverage: EnumCoverage
): Promise<void> {
  const preparedIds = getStateArray(context, 'distribucionPreparadaIds');
  if (preparedIds.length > 0) {
    return;
  }

  const token = chooseTokenForPath(context, '/distribuciones', 'POST');
  const body = await buildDistribucionCreateBody(
    context,
    iteration,
    coverage,
    token
  );

  const response = await context.requestJson<unknown>('/distribuciones', {
    method: 'POST',
    body,
    auth: true,
    tokenOverride: token,
  });

  collectStateFromResponse(context, '/distribuciones', response);

  const distribucionId = extractResourceId(response);
  if (distribucionId) {
    pushStateValue(context, 'seedCreatedDistribucionIds', distribucionId);
    pushStateValue(context, 'distribucionIds', distribucionId);
    pushStateValue(context, 'distribucionPreparadaIds', distribucionId);
  }

  if (getStateArray(context, 'distribucionPreparadaIds').length === 0) {
    throw new Error(
      '[seed-massive] Could not precrear una distribución preparada para operar con PATCH'
    );
  }
}

async function ensureDistribucionOriginStockForConfirm(
  context: SeedContext,
  distribucionId: string,
  iteration: number,
  tokenOverride?: string
): Promise<void> {
  const alreadyPrepared = getStateArray(
    context,
    'seedDistribucionStockReadyIds'
  );
  if (alreadyPrepared.includes(distribucionId)) {
    return;
  }

  const detailResponse = await context.requestJson<unknown>(
    `/distribuciones/${distribucionId}`,
    {
      method: 'GET',
      auth: true,
      tokenOverride,
    }
  );

  collectStateFromResponse(
    context,
    `/distribuciones/${distribucionId}`,
    detailResponse
  );

  const distribucion =
    listFromResponse(detailResponse).find(
      (entity) => entity.id === distribucionId
    ) || listFromResponse(detailResponse)[0];

  if (!distribucion) {
    return;
  }

  const ubicacionOrigenFromRelation = isRecord(distribucion.ubicacionOrigen)
    ? toTrimmedSeedString(distribucion.ubicacionOrigen.id)
    : '';
  const ubicacionOrigenId =
    toTrimmedSeedString(distribucion.ubicacionOrigenId) ||
    ubicacionOrigenFromRelation ||
    context.getState<string>('seedDefaultUbicacionId') ||
    pickStateValue(context, 'ubicacionIds', iteration, '');

  if (!ubicacionOrigenId || !Array.isArray(distribucion.lineas)) {
    return;
  }

  const inventoryToken = chooseTokenForPath(context, '/inventario', 'POST');
  let lineIndex = 0;

  for (const lineaRaw of distribucion.lineas) {
    if (!isRecord(lineaRaw)) {
      continue;
    }

    const productoProveedorId =
      toTrimmedSeedString(lineaRaw.productoProveedorId) ||
      (isRecord(lineaRaw.productoProveedor)
        ? toTrimmedSeedString(lineaRaw.productoProveedor.id)
        : '');

    const cantidadADistribuir = toSeedFiniteNumber(
      lineaRaw.cantidadADistribuir ?? lineaRaw.cantidadEntregada
    );

    if (
      !productoProveedorId ||
      !Number.isFinite(cantidadADistribuir) ||
      cantidadADistribuir < 0.001
    ) {
      continue;
    }

    const cantidadObjetivo = Number(
      Math.max(cantidadADistribuir + 1, cantidadADistribuir * 2, 1).toFixed(3)
    );

    const inventarioResponse = await context.requestJson<unknown>(
      '/inventario',
      {
        method: 'POST',
        body: {
          productoProveedorId,
          ubicacionId: ubicacionOrigenId,
          cantidadActual: cantidadObjetivo,
          cantidadMinima: 1,
          cantidadMaxima: Number((cantidadObjetivo * 2).toFixed(3)),
          fechaCaducidad: seedDateIso(iteration + 90 + lineIndex),
        },
        auth: true,
        tokenOverride: inventoryToken,
      }
    );

    collectStateFromResponse(context, '/inventario', inventarioResponse);
    lineIndex++;
  }

  pushStateValue(context, 'seedDistribucionStockReadyIds', distribucionId);
}

/**
 * Expone "executeAdminFocusEndpointRequest" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {Endpoint} endpoint - Entrada efectiva esperada por el contrato.
 * @undefined {string} resolvedPath - Entrada efectiva esperada por el contrato.
 * @undefined {number} iteration - Entrada efectiva esperada por el contrato.
 * @undefined {EnumCoverage} coverage - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<RequestResult>} Datos efectivos después de ejecutar la operación.
 */
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
    const statusCode =
      error instanceof HttpSeedRequestError ? error.status : undefined;
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

/**
 * Expone "executeEndpointRequest" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {Endpoint} endpoint - Entrada efectiva esperada por el contrato.
 * @undefined {number} iteration - Entrada efectiva esperada por el contrato.
 * @undefined {EnumCoverage} coverage - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<RequestResult>} Datos efectivos después de ejecutar la operación.
 */
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

  if (
    (endpoint.method === 'PATCH' || endpoint.method === 'DELETE') &&
    endpoint.path === '/pedido-usuarios/:id'
  ) {
    await ensurePendingPedidoUsuarioForUpdate(context, coverage, iteration);
  }

  if (
    endpoint.method === 'PATCH' &&
    (endpoint.path === '/pedidos/:id' ||
      endpoint.path === '/pedidos/:id/aceptar' ||
      endpoint.path === '/pedidos/:id/cancelar' ||
      endpoint.path === '/pedidos/:id/fecha-entrega')
  ) {
    await ensurePendingPedidoForUpdate(context, coverage, iteration);
  }

  if (
    endpoint.method === 'PATCH' &&
    (endpoint.path === '/purchase-batches/:id' ||
      endpoint.path === '/purchase-batches/:id/aceptar' ||
      endpoint.path === '/purchase-batches/:id/cancelar' ||
      endpoint.path === '/purchase-batches/:id/tramitar')
  ) {
    await ensurePendingPurchaseBatchForUpdate(context, coverage, iteration);
  }

  if (
    endpoint.path === '/incidencias/:id/resolver' &&
    (endpoint.method === 'POST' || endpoint.method === 'PATCH')
  ) {
    await ensureIncidenciaForResolver(context, coverage, iteration);
  }

  if (endpoint.method === 'POST' && endpoint.path === '/incidencias/reportar') {
    await ensureReportableRecepcionIds(context);
  }

  if (
    endpoint.method === 'PATCH' &&
    (endpoint.path === '/distribuciones/:id/confirmar' ||
      endpoint.path === '/distribuciones/:id/cancelar')
  ) {
    await ensurePreparedDistribucionForAction(context, iteration, coverage);
  }

  if (
    endpoint.method === 'DELETE' &&
    endpoint.path === '/profesores/admin-slots/:id'
  ) {
    await ensureDeletableProfesorAdminSlot(context, coverage, iteration);
  }

  if (
    endpoint.method === 'DELETE' &&
    endpoint.path === '/profesores/slots/:id'
  ) {
    await ensureDeletableProfesorSlot(context, coverage, iteration);
  }

  if (endpoint.method === 'DELETE' && endpoint.path === '/proveedor/:id') {
    await ensureDeletableProveedor(context, coverage, iteration);
  }

  if (
    endpoint.method === 'POST' &&
    endpoint.path === '/proveedor/:id/restore'
  ) {
    await ensureSoftDeletedProveedorForRestore(context, coverage, iteration);
  }

  if (endpoint.method === 'DELETE' && endpoint.path === '/productos/:id') {
    await ensureDeletableProducto(context, coverage, iteration);
  }

  if (endpoint.method === 'DELETE' && endpoint.path === '/inventario/:id') {
    await ensureDeletableInventario(context);
  }

  if (endpoint.method === 'DELETE' && endpoint.path === '/pedidos/:id') {
    await ensureDeletablePedido(context, coverage, iteration);
  }

  if (endpoint.method === 'DELETE' && endpoint.path === '/recepciones/:id') {
    await ensureDeletableRecepcionResource(context, iteration);
  }

  if (
    endpoint.method === 'DELETE' &&
    endpoint.path === '/producto-alergenos/:idProducto/:alergeno'
  ) {
    await ensureDeletableProductoAlergenoResource(context, iteration);
  }

  if (
    endpoint.method === 'POST' &&
    (endpoint.path === '/pedido-usuarios/from-missing-stock' ||
      endpoint.path === '/purchase-batches/from-missing-stock')
  ) {
    await ensureInventarioBajoParaFaltantesDesdeRecetasSeed(context);
  }

  if (endpoint.method === 'POST' && endpoint.path === '/productos') {
    await ensureOpenFoodFactsPool(context);
  }

  if (
    endpoint.method === 'PATCH' &&
    endpoint.path === '/produccion/lote/:id/consumir'
  ) {
    await ensureLoteWithSufficientPortions(context, iteration);
  }

  if (
    endpoint.method === 'POST' &&
    (endpoint.path === '/produccion/ejecutar' ||
      endpoint.path === '/produccion/validar')
  ) {
    await ensureRecetaReadyForProduccion(context, iteration);
  }

  if (
    endpoint.method === 'POST' &&
    endpoint.path === '/merma/produccion/reportar'
  ) {
    await ensureMermaProduccionTarget(context, iteration);
  }

  if (endpoint.method === 'POST' && endpoint.path === '/merma') {
    await ensureProductoWithSufficientStockForMerma(context, iteration);
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
  const requestToken = requiresAuth
    ? chooseTokenForPath(context, resolvedPath, endpoint.method)
    : undefined;

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
      endpoint.method === 'PATCH' &&
      /^\/distribuciones\/[^/]+\/confirmar$/.test(resolvedPath)
    ) {
      const distribucionId = resolvedPath.split('/')[2] || '';
      if (distribucionId) {
        await ensureDistribucionOriginStockForConfirm(
          context,
          distribucionId,
          iteration,
          requestToken
        );
      }
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
            tokenOverride: requestToken,
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
          tokenOverride: requestToken,
        });
        collectStateFromResponse(context, '/pedidos', pedidoResp);
        const createdId = extractResourceId(pedidoResp);
        if (createdId) {
          pushStateValue(context, 'seedCreatedPedidoPendienteIds', createdId);
          try {
            const acceptedPedidoResp = await context.requestJson(
              `/pedidos/${createdId}/aceptar`,
              {
                method: 'PATCH',
                body: {},
                tokenOverride: requestToken,
              }
            );
            collectStateFromResponse(
              context,
              `/pedidos/${createdId}/aceptar`,
              acceptedPedidoResp
            );
            removeStateValue(context, 'pedidoPendienteIds', createdId);
            removeStateValue(
              context,
              'seedCreatedPedidoPendienteIds',
              createdId
            );
            pushStateValue(context, 'pedidoReceivableIds', createdId);
            pushStateValue(
              context,
              'seedCreatedPedidoReceivableIds',
              createdId
            );
          } catch (err) {
            const errMsg = String(err instanceof Error ? err.message : err);
            return {
              ok: false,
              key,
              endpoint,
              resolvedPath,
              payload: pedidoBody,
              error: `[seed-massive] PREACCEPT /pedidos/${createdId}/aceptar fallo: ${errMsg}`,
            } as RequestResult;
          }
          context.set('seedRecepcionPedidoId', createdId);
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

    if (
      endpoint.method === 'PATCH' &&
      /^\/pedido-usuarios\/[^/]+\/restaurar$/.test(resolvedPath)
    ) {
      const entityId = resolvedPath.split('/')[2] || '';
      if (entityId) {
        try {
          const cancelResponse = await context.requestJson<unknown>(
            `/pedido-usuarios/${entityId}/cancelar`,
            {
              method: 'PATCH',
              body: { motivoCancelacion: 'Precondición seed restaurar' },
              auth: requiresAuth,
              tokenOverride: requestToken,
            }
          );
          collectStateFromResponse(
            context,
            `/pedido-usuarios/${entityId}/cancelar`,
            cancelResponse
          );
        } catch (error) {
          void error;
        }
      }
    }

    if (
      endpoint.method === 'PATCH' &&
      /^\/purchase-batches\/[^/]+\/restaurar$/.test(resolvedPath)
    ) {
      const entityId = resolvedPath.split('/')[2] || '';
      if (entityId) {
        try {
          const cancelResponse = await context.requestJson<unknown>(
            `/purchase-batches/${entityId}/cancelar`,
            {
              method: 'PATCH',
              body: { motivoCancelacion: 'Precondición seed restaurar' },
              auth: requiresAuth,
              tokenOverride: requestToken,
            }
          );
          collectStateFromResponse(
            context,
            `/purchase-batches/${entityId}/cancelar`,
            cancelResponse
          );
        } catch (error) {
          void error;
        }
      }
    }

    if (
      endpoint.method === 'PATCH' &&
      /^\/pedidos\/[^/]+\/restaurar$/.test(resolvedPath)
    ) {
      const entityId = resolvedPath.split('/')[2] || '';
      if (entityId) {
        try {
          const cancelResponse = await context.requestJson<unknown>(
            `/pedidos/${entityId}/cancelar`,
            {
              method: 'PATCH',
              body: { motivoCancelacion: 'Precondición seed restaurar' },
              auth: requiresAuth,
              tokenOverride: requestToken,
            }
          );
          collectStateFromResponse(
            context,
            `/pedidos/${entityId}/cancelar`,
            cancelResponse
          );
        } catch (error) {
          void error;
        }
      }
    }

    if (endpoint.method === 'GET' || endpoint.method === 'DELETE') {
      requestPayload = undefined;
    } else if (
      endpoint.method === 'POST' &&
      resolvedPath === '/distribuciones'
    ) {
      requestPayload = await buildDistribucionCreateBody(
        context,
        iteration,
        coverage,
        requestToken
      );
    } else {
      requestPayload = buildBody(
        context,
        endpoint,
        resolvedPath,
        iteration,
        coverage
      );
    }

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
      const runTagRaw = String(
        context.getState<string>('seedRunTag') || 'seed'
      );
      const runTag =
        runTagRaw
          .replace(/[^A-Za-z0-9]/g, '')
          .toUpperCase()
          .slice(-12) || 'SEED';
      const numeroReferencia = `ALB-UP-${runTag}-${String(
        iteration + 1
      ).padStart(6, '0')}`.slice(0, 40);
      const response = await context.postMultipart<unknown>(
        '/albaranes/upload-documento',
        {
          file: new Blob(['seed-document'], { type: 'application/pdf' }),
          numeroReferencia,
          ...(recepcionId ? { recepcionId } : {}),
          observaciones: 'Documento generado por seeder masivo',
        },
        requestToken
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
          file: new Blob(
            [`seed-file-${String(iteration + 1).padStart(6, '0')}`],
            {
              type: 'application/pdf',
            }
          ),
        },
        requestToken
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
      tokenOverride: requestToken,
    });

    collectStateFromResponse(context, resolvedPath, response);

    if (endpoint.method === 'POST' && resolvedPath === '/distribuciones') {
      const distribucionId = extractResourceId(response);
      if (distribucionId) {
        pushStateValue(context, 'seedCreatedDistribucionIds', distribucionId);
      }
    }

    if (endpoint.method === 'POST' && resolvedPath === '/roles') {
      const roleId = extractResourceId(response);
      if (roleId) {
        pushStateValue(context, 'seedCreatedRoleIds', roleId);
      }
    }

    if (resolvedPath === '/profesores/slots') {
      rememberProfesorOwnedSlot(
        context,
        requestToken,
        extractResourceId(response)
      );
    }

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
      error instanceof HttpSeedRequestError ? error.status : undefined;

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
    /* token is passed via tokenOverride, no context restore needed */
  }
}
