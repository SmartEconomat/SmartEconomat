import AppDataSource from '../config/typeorm.config';
import { Pedido } from '../modules/pedido/pedido.entity/pedido.entity';
import { EstadoPedido } from '../modules/pedido/enums/estado-pedido.enum';
import { reserveNextPedidoProveedorNumero } from '../modules/pedido/utils/pedido-numero.util';
import { Recepcion } from '../modules/recepcion/recepcion.entity/recepcion.entity';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import {
  TipoProducto,
  UnidadMedida,
} from '../modules/producto/enums/producto.enums';
import { SeedContext } from './seed-context';
import { Endpoint, EnumCoverage } from './massive.types';
import { ALERGEN_VALUES } from './massive.config';
import {
  buildBody,
  chooseTokenForPath,
  collectStateFromResponse,
  extractResourceId,
  listFromResponse,
  toEntityArray,
} from './massive.helpers';
import { getStateArray, pushStateValue } from './massive.state';
import { seedDateIso } from './deterministic.seed-data';

async function ensureRepositoryReady(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}

export async function ensureDeletableProfesorAdminSlotResource(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  const deletableIds = getStateArray(
    context,
    'seedCreatedDeletableProfesorAdminSlotIds'
  );
  if (deletableIds.length > 0) {
    return;
  }

  const createEndpoint: Endpoint = {
    method: 'POST',
    path: '/profesores/admin-slots',
    source: 'precreate-profesor-admin-slot-delete',
  };

  const createBody = buildBody(
    context,
    createEndpoint,
    '/profesores/admin-slots',
    iteration,
    coverage
  );

  createBody.aula = `Aula Delete Seed ${String(iteration + 1).padStart(4, '0')}`;
  createBody.numeroClase = 90000 + (iteration % 1000);
  createBody.capacidad = 1;

  const previousToken = context.getAccessToken();
  context.setAccessToken(
    chooseTokenForPath(context, '/profesores/admin-slots')
  );

  try {
    const response = await context.requestJson<unknown>(
      '/profesores/admin-slots',
      {
        method: 'POST',
        body: createBody,
        auth: true,
      }
    );

    collectStateFromResponse(context, '/profesores/admin-slots', response);

    const slotId = extractResourceId(response);
    if (!slotId) {
      throw new Error(
        '[seed-massive] No se recibió ID al precrear slot admin eliminable'
      );
    }

    pushStateValue(context, 'seedCreatedDeletableProfesorAdminSlotIds', slotId);
    pushStateValue(context, 'profesorAdminSlotIds', slotId);
  } finally {
    context.setAccessToken(previousToken);
  }
}

export async function ensureDeletableProfesorSlotResource(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  const deletableIds = getStateArray(
    context,
    'seedCreatedDeletableProfesorSlotIds'
  );
  if (deletableIds.length > 0) {
    return;
  }

  const createEndpoint: Endpoint = {
    method: 'POST',
    path: '/profesores/slots',
    source: 'precreate-profesor-slot-delete',
  };

  const createBody = buildBody(
    context,
    createEndpoint,
    '/profesores/slots',
    iteration,
    coverage
  );

  createBody.aula = `Aula Delete Profesor ${String(iteration + 1).padStart(4, '0')}`;
  createBody.numeroClase = 95000 + (iteration % 1000);
  createBody.capacidad = 1;

  const profesorToken = chooseTokenForPath(context, '/profesores/slots');

  try {
    const response = await context.requestJson<unknown>('/profesores/slots', {
      method: 'POST',
      body: createBody,
      auth: true,
      tokenOverride: profesorToken,
    });

    collectStateFromResponse(context, '/profesores/slots', response);

    const slotId = extractResourceId(response);
    if (!slotId) {
      throw new Error(
        '[seed-massive] No se recibió ID al precrear slot de profesor eliminable'
      );
    }

    pushStateValue(context, 'seedCreatedDeletableProfesorSlotIds', slotId);
    pushStateValue(context, 'profesorSlotIds', slotId);

    const tokenIndexMapJson =
      context.getState<string>('seedProfesorIndexByToken') || '{}';
    const tokenIndexMap: Record<string, number> = JSON.parse(tokenIndexMapJson);
    const profesorIndex = tokenIndexMap[profesorToken];

    if (profesorIndex !== undefined) {
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
  } finally {
    void 0;
  }
}

export async function ensureDeletableProveedorResource(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  const deletableProveedorIds = getStateArray(
    context,
    'seedCreatedDeletableProveedorIds'
  );
  if (deletableProveedorIds.length > 0) {
    return;
  }

  const createEndpoint: Endpoint = {
    method: 'POST',
    path: '/proveedor',
    source: 'precreate-proveedor-delete',
  };

  const createBody = buildBody(
    context,
    createEndpoint,
    '/proveedor',
    iteration,
    coverage
  );

  const proveedorDeleteSuffix = String(iteration + 1).padStart(4, '0');
  createBody.nombre = `Proveedor eliminable seed ${proveedorDeleteSuffix}`;
  createBody.contacto = 'Responsable Eliminaciones Seed';
  createBody.telefono = `+3494${String(1000000 + iteration).slice(-7)}`;
  createBody.email = `proveedor.eliminable.${proveedorDeleteSuffix}@smarteconomat.local`;
  createBody.direccion = `Plataforma logistica seed ${proveedorDeleteSuffix}, Valencia`;
  createBody.nif = `DEL${String(700000 + iteration).padStart(6, '0')}`;

  const previousToken = context.getAccessToken();
  context.setAccessToken(chooseTokenForPath(context, '/proveedor'));

  try {
    const response = await context.requestJson<unknown>('/proveedor', {
      method: 'POST',
      body: createBody,
      auth: true,
    });

    collectStateFromResponse(context, '/proveedor', response);

    const proveedorId = extractResourceId(response);
    if (!proveedorId) {
      throw new Error(
        '[seed-massive] No se recibió ID al precrear proveedor eliminable'
      );
    }

    pushStateValue(context, 'seedCreatedDeletableProveedorIds', proveedorId);
    pushStateValue(context, 'proveedorIds', proveedorId);
  } finally {
    context.setAccessToken(previousToken);
  }
}

export async function ensureDeletablePedidoResource(
  context: SeedContext,
  coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  const deletablePedidoIds = getStateArray(
    context,
    'seedCreatedDeletablePedidoIds'
  );
  if (deletablePedidoIds.length > 0) {
    return;
  }

  await ensureRepositoryReady();

  const pedidoRepo = AppDataSource.getRepository(Pedido);
  const numeroGlobal = await reserveNextPedidoProveedorNumero(
    pedidoRepo.manager
  );
  const savedPedido = await pedidoRepo.save(
    pedidoRepo.create({
      numeroGlobal,
      fechaPedido: new Date(seedDateIso(iteration, 0)),
      observaciones: 'Pedido deletable generado por seed',
      costeTotal: 0,
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
    })
  );

  if (!savedPedido.id) {
    throw new Error(
      '[seed-massive] No se recibió ID al precrear pedido eliminable'
    );
  }

  pushStateValue(context, 'seedCreatedDeletablePedidoIds', savedPedido.id);
  pushStateValue(context, 'pedidoIds', savedPedido.id);
  pushStateValue(context, 'pedidoPendienteIds', savedPedido.id);
}

export async function ensureDeletableInventarioResource(
  context: SeedContext
): Promise<void> {
  const deletableInventarioIds = getStateArray(
    context,
    'seedCreatedDeletableInventarioIds'
  );
  if (deletableInventarioIds.length > 0) {
    return;
  }

  const previousToken = context.getAccessToken();
  context.setAccessToken(chooseTokenForPath(context, '/inventario'));

  try {
    const response = await context.requestJson<unknown>(
      '/inventario?limit=50&page=1&sortBy=createdAt&order=DESC',
      {
        method: 'GET',
        auth: true,
      }
    );

    collectStateFromResponse(context, '/inventario', response);

    const candidate = toEntityArray(response).find((entity) => {
      if (
        typeof entity.id !== 'string' ||
        (typeof entity.productoProveedorId !== 'string' &&
          typeof entity.cantidadActual !== 'number' &&
          typeof entity.cantidadActual !== 'string')
      ) {
        return false;
      }

      const deletedAt = entity.deletedAt ?? entity.deleted_at;
      const isSoftDeleted =
        deletedAt instanceof Date ||
        (typeof deletedAt === 'string' && deletedAt.trim().length > 0);

      return !isSoftDeleted;
    });

    if (!candidate || typeof candidate.id !== 'string') {
      throw new Error(
        '[seed-massive] GET /inventario no devolvió un ID eliminable'
      );
    }

    pushStateValue(context, 'seedCreatedDeletableInventarioIds', candidate.id);
    pushStateValue(context, 'inventarioIds', candidate.id);
  } finally {
    context.setAccessToken(previousToken);
  }
}

export async function ensureDeletableRecepcionResource(
  context: SeedContext,
  iteration: number
): Promise<void> {
  const deletableRecepcionIds = getStateArray(
    context,
    'seedCreatedDeletableRecepcionIds'
  );
  if (deletableRecepcionIds.length > 0) {
    return;
  }

  const usuarioIds = getStateArray(context, 'usuarioIds').filter(
    (id) => id.trim().length > 0
  );
  if (usuarioIds.length === 0) {
    throw new Error(
      '[seed-massive] No hay usuarioIds disponibles para precrear recepción eliminable'
    );
  }

  await ensureRepositoryReady();

  const recepcionRepo = AppDataSource.getRepository(Recepcion);
  const savedRecepcion = await recepcionRepo.save(
    recepcionRepo.create({
      fechaRecepcion: new Date(seedDateIso(iteration, 30)),
      observaciones: 'Recepción deletable generada por seed',
      usuarioId: usuarioIds[iteration % usuarioIds.length],
      incidencia: false,
    })
  );

  if (!savedRecepcion.id) {
    throw new Error(
      '[seed-massive] No se recibió ID al precrear recepción eliminable'
    );
  }

  pushStateValue(
    context,
    'seedCreatedDeletableRecepcionIds',
    savedRecepcion.id
  );
  pushStateValue(context, 'recepcionIds', savedRecepcion.id);
}

export async function ensureDeletableProductoResource(
  context: SeedContext,
  _coverage: EnumCoverage,
  iteration: number
): Promise<void> {
  const deletableProductoIds = getStateArray(
    context,
    'seedCreatedDeletableProductoIds'
  );
  if (deletableProductoIds.length > 0) {
    return;
  }

  await ensureRepositoryReady();

  const productoRepo = AppDataSource.getRepository(Producto);
  const savedProducto = await productoRepo.save(
    productoRepo.create({
      nombre: `Producto deletable seed ${String(iteration + 1).padStart(4, '0')}`,
      unidad: UnidadMedida.UNIDAD,
      tipo: TipoProducto.OTRO,
      contenido: 1,
      pmp: 0,
    })
  );

  if (!savedProducto.id) {
    throw new Error(
      '[seed-massive] No se recibio ID al precrear producto eliminable'
    );
  }

  pushStateValue(context, 'seedCreatedDeletableProductoIds', savedProducto.id);
  pushStateValue(context, 'productoIds', savedProducto.id);
}

export async function ensureDeletableProductoAlergenoResource(
  context: SeedContext,
  iteration: number
): Promise<void> {
  const deletablePairs = getStateArray(
    context,
    'seedCreatedDeletableProductoAlergenoPairs'
  );
  if (deletablePairs.length > 0) {
    return;
  }

  const allProductoIds = [
    ...new Set([
      ...getStateArray(context, 'seedCreatedProductoIds'),
      ...getStateArray(context, 'productoIds'),
    ]),
  ].filter((id) => id.trim().length > 0);

  if (allProductoIds.length === 0) {
    throw new Error(
      '[seed-massive] No hay productos disponibles para precrear producto-alergeno eliminable'
    );
  }

  const previousToken = context.getAccessToken();
  context.setAccessToken(chooseTokenForPath(context, '/producto-alergenos'));

  try {
    for (let offset = 0; offset < allProductoIds.length; offset++) {
      const productoId =
        allProductoIds[(iteration + offset) % allProductoIds.length];
      if (!productoId) {
        continue;
      }

      const existingResponse = await context.requestJson<unknown>(
        `/producto-alergenos?idProducto=${encodeURIComponent(productoId)}`,
        {
          method: 'GET',
          auth: true,
        }
      );
      collectStateFromResponse(
        context,
        '/producto-alergenos',
        existingResponse
      );

      const existingRows = listFromResponse(existingResponse);
      const existingAlergenos = new Set(
        existingRows
          .map((row) =>
            typeof row.alergeno === 'string' ? row.alergeno.trim() : ''
          )
          .filter(Boolean)
      );

      const existingPair = existingRows.find(
        (row) =>
          typeof row.alergeno === 'string' && row.alergeno.trim().length > 0
      );

      if (existingPair && typeof existingPair.alergeno === 'string') {
        const pair = `${productoId}|${existingPair.alergeno}`;
        pushStateValue(
          context,
          'seedCreatedDeletableProductoAlergenoPairs',
          pair
        );
        pushStateValue(context, 'productoAlergenoPairs', pair);
        return;
      }

      const availableAlergeno = ALERGEN_VALUES.find(
        (value) => !existingAlergenos.has(value)
      );

      if (!availableAlergeno) {
        continue;
      }

      const createdResponse = await context.requestJson<unknown>(
        '/producto-alergenos',
        {
          method: 'POST',
          body: {
            idProducto: productoId,
            alergeno: availableAlergeno,
          },
          auth: true,
        }
      );
      collectStateFromResponse(context, '/producto-alergenos', createdResponse);

      const pair = `${productoId}|${availableAlergeno}`;
      pushStateValue(
        context,
        'seedCreatedDeletableProductoAlergenoPairs',
        pair
      );
      pushStateValue(context, 'productoAlergenoPairs', pair);
      return;
    }
  } finally {
    context.setAccessToken(previousToken);
  }

  throw new Error(
    '[seed-massive] No se pudo obtener ni crear una asociacion producto-alergeno eliminable'
  );
}
