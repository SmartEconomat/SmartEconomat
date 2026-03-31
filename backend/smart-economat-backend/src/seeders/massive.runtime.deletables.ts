import AppDataSource from '../config/typeorm.config';
import { Recepcion } from '../modules/recepcion/recepcion.entity/recepcion.entity';
import { SeedContext } from './seed-context';
import { Endpoint, EnumCoverage } from './massive.types';
import {
  buildBody,
  chooseTokenForPath,
  collectStateFromResponse,
  extractResourceId,
  toEntityArray,
} from './massive.helpers';
import { getStateArray, pickStateValue, pushStateValue } from './massive.state';

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

  createBody.aula = `Aula Delete Seed ${Date.now()}`;
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
  context: SeedContext
): Promise<void> {
  const deletableRecepcionIds = getStateArray(
    context,
    'seedCreatedDeletableRecepcionIds'
  );
  if (deletableRecepcionIds.length > 0) {
    return;
  }

  await ensureRepositoryReady();
  const recepcionRepo = AppDataSource.getRepository(Recepcion);
  const actorUserId =
    pickStateValue(context, 'seedAdminUserIds', 0, '') ||
    pickStateValue(context, 'usuarioIds', 0, '') ||
    undefined;

  const recepcion = recepcionRepo.create({
    usuarioId: actorUserId,
    fechaRecepcion: new Date(),
    observaciones: 'Seed deletable recepcion',
  } as Partial<Recepcion>);

  const saved = await recepcionRepo.save(recepcion as any);
  pushStateValue(context, 'seedCreatedDeletableRecepcionIds', saved.id);
  pushStateValue(context, 'recepcionIds', saved.id);
}
