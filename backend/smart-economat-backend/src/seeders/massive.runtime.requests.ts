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
      '[seed-massive] No se pudo preparar producción: faltan recetaIds'
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
    const payload: Record<string, unknown> = {
      recetaId,
      cantidadProducida: 10,
    };
    if (ubicacionId) {
      payload.ubicacionDestinoId = ubicacionId;
    }

    const response = await context.requestJson<any>('/produccion/ejecutar', {
      method: 'POST',
      body: payload,
      auth: true,
    });

    collectStateFromResponse(context, '/produccion/ejecutar', response);
    const newLoteId = extractResourceId(response);
    if (newLoteId) {
      pushStateValue(context, 'seedCreatedProduccionLoteIds', newLoteId);
      pushStateValue(context, 'produccionLoteIds', newLoteId);
      const porciones = Number(response?.porcionesRestantes ?? 10);
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
    '[seed-massive] No se pudo resolver lote e ingrediente válidos para /merma/produccion/reportar'
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
  if (!hasPending) {
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

  if (
    endpoint.method === 'DELETE' &&
    endpoint.path === '/profesores/slots/:id'
  ) {
    await ensureDeletableProfesorSlot(context, coverage, iteration);
  }

  if (endpoint.method === 'DELETE' && endpoint.path === '/proveedor/:id') {
    await ensureDeletableProveedor(context, coverage, iteration);
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
    /* token is passed via tokenOverride, no context restore needed */
  }
}
