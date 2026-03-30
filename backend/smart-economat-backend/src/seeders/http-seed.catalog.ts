import { SeedContext } from './seed-context';
import { faker } from '@faker-js/faker';
import { SEED_GLOBAL_CONFIG } from './massive.config';

type SeederTask = (context: SeedContext) => Promise<void>;

function getVolumeMultiplier(context: SeedContext): number {
  const fromState = context.getState<number>('seedMultiplier');
  if (typeof fromState === 'number' && Number.isFinite(fromState)) {
    return Math.max(1, Math.floor(fromState));
  }
  return Math.max(1, Math.floor(SEED_GLOBAL_CONFIG.multiplier));
}

const DEFAULT_SEED_PASSWORD = 'SmartEconomat2026!';

function listFromResponse(input: any): any[] {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.items)) return input.items;
  if (Array.isArray(input?.data?.items)) return input.data.items;
  if (Array.isArray(input?.data)) return input.data;
  return [];
}

function pushId(
  context: SeedContext,
  key: string,
  id: string | undefined
): void {
  if (!id) return;
  const current = context.getState<string[]>(key) || [];
  if (!current.includes(id)) {
    current.push(id);
    context.set(key, current);
  }
}

async function saveListIds(
  context: SeedContext,
  endpoint: string,
  stateKey: string
): Promise<any[]> {
  let list = await safe(`listar ${endpoint} paginado`, () =>
    context.getJson<any>(`${endpoint}?limit=25&page=1`)
  );

  if (!list) {
    list = await safe(`listar ${endpoint} simple`, () =>
      context.getJson<any>(endpoint)
    );
  }

  if (!list) {
    return [];
  }

  const items = listFromResponse(list);
  for (const item of items) {
    pushId(context, stateKey, item?.id);
  }
  return items;
}

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    const lower = message.toLowerCase();
    const isListRead = label.toLowerCase().startsWith('listar');
    if (
      message.includes('403') ||
      message.includes('404') ||
      message.includes('401') ||
      message.includes('429') ||
      (isListRead &&
        (message.includes('400') || lower.includes('bad request'))) ||
      message.includes('409') ||
      lower.includes('duplicate') ||
      lower.includes('already exists') ||
      lower.includes('already registered') ||
      lower.includes('ya está registrado') ||
      lower.includes('duplica') ||
      lower.includes('duplicate_entry')
    ) {
      console.warn(`[seed] ${label} omitido: ${message}`);
      return null;
    }
    throw error;
  }
}

async function rolesPermisosTask(context: SeedContext): Promise<void> {
  const roles = await safe('roles', () =>
    context.getJson<any[]>('/admin/roles')
  );
  const permisos = await safe('permisos', () =>
    context.getJson<any[]>('/admin/permissions')
  );

  context.set('roles', roles || []);
  context.set('permisos', permisos || []);

  if (!Array.isArray(roles) || roles.length === 0) {
    console.warn('[seed] No se encontraron roles en /admin/roles');
  }

  const roleIds = listFromResponse(roles)
    .map((r: any) => r?.id)
    .filter(Boolean);
  context.set('roleIds', roleIds);

  const permissionIds = listFromResponse(permisos)
    .map((p: any) => p?.id)
    .filter(Boolean);
  context.set('permissionIds', permissionIds);
}

async function usuariosTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  const desiredUsers = [
    {
      nombre: 'Super Administrador',
      username: 'superadmin',
      email: 'superadmin@smarteconomat.com',
      password: DEFAULT_SEED_PASSWORD,
      rol: 'SUPER_ADMIN',
    },
    {
      nombre: 'Administrador Principal',
      username: 'admin',
      email: 'admin@smarteconomat.com',
      password: DEFAULT_SEED_PASSWORD,
      rol: 'ADMINISTRADOR',
    },
  ];

  for (let i = 0; i < 8 * volumeMultiplier; i++) {
    desiredUsers.push({
      nombre: faker.person.fullName(),
      username: `seed_user_${i}`,
      email: `seed.user.${i}@smarteconomat.local`,
      password: DEFAULT_SEED_PASSWORD,
      rol: i % 3 === 0 ? 'PROFESOR' : 'ADMINISTRADOR',
    });
  }

  const list = await safe('listar usuarios', () =>
    context.getJson<any>('/usuarios?limit=25&page=1')
  );
  if (!list) {
    return;
  }
  const users = Array.isArray(list?.items)
    ? list.items
    : Array.isArray(list?.data?.items)
      ? list.data.items
      : Array.isArray(list)
        ? list
        : [];

  for (const user of desiredUsers) {
    const already = users.find((u: any) => u?.email === user.email);
    if (already) {
      context.set(`usuario:${user.username}`, already.id);
      pushId(context, 'usuarioIds', already.id);
      continue;
    }

    try {
      const created = await context.postJson<any>('/usuarios/admin', user);
      context.set(`usuario:${user.username}`, created?.id);
      pushId(context, 'usuarioIds', created?.id);
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error);
      if (
        !message.includes('409') &&
        !message.toLowerCase().includes('already')
      ) {
        throw error;
      }
    }
  }

  const profesores = await saveListIds(
    context,
    '/profesores/all-profesores',
    'profesorIds'
  );

  const profExists = profesores.some(
    (p: any) => p?.user?.email === 'profesor1@smarteconomat.com'
  );

  if (!profExists) {
    try {
      const created = await context.postJson<any>('/admin/profesores', {
        username: 'profesor1',
        email: 'profesor1@smarteconomat.com',
        password: DEFAULT_SEED_PASSWORD,
        cial: 'CIAL-11111',
      });
      pushId(context, 'usuarioIds', created?.id);
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error);
      if (!message.includes('409')) {
        throw error;
      }
    }
  }

  await saveListIds(context, '/usuarios', 'usuarioIds');
  await saveListIds(context, '/profesores/all-profesores', 'profesorIds');
  await saveListIds(context, '/profesores/all-slots', 'profesorSlotIds');

  const usuarioIds = context.getState<string[]>('usuarioIds') || [];
  if (usuarioIds.length > 0) {
    const id = usuarioIds[0];
    await safe(`admin activate user ${id}`, () =>
      context.patchJson(`/admin/users/${id}/activate`, {})
    );
    await safe(`admin force reset user ${id}`, () =>
      context.postJson(`/admin/users/${id}/force-reset`, {})
    );
    await safe(`activar usuario ${id}`, () =>
      context.patchJson(`/usuarios/${id}/activar`, {})
    );
    await safe(`perfil usuario ${id}`, () =>
      context.getJson(`/usuarios/${id}`)
    );
    await safe(`DELETE usuario ${id}`, () =>
      context.deleteJson(`/usuarios/${id}`)
    );
  }

  await safe('usuarios minimos', () => context.getJson('/usuarios/minimos'));
  await safe('get self profile', () => context.getJson('/usuarios/perfil'));
  await safe('get auth profile', () => context.getJson('/auth/profile'));

  const adminToken = context.getAccessToken();
  const seedProfesor = desiredUsers.find((user) => user.rol === 'PROFESOR');

  if (seedProfesor) {
    let profesorToken: string | null = null;
    try {
      profesorToken = await context.loginWithCredentials({
        email: seedProfesor.email,
        password: seedProfesor.password,
      });
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error);
      console.warn(
        `[seed] login profesor ${seedProfesor.email} omitido: ${message}`
      );
    }

    if (profesorToken) {
      try {
        await saveListIds(context, '/profesores/slots', 'profesorSlotIds');
        await saveListIds(context, '/profesores/alumnos', 'alumnoIds');

        const alumnoIds = context.getState<string[]>('alumnoIds') || [];
        if (alumnoIds.length > 0) {
          const aid = alumnoIds[0];
          await safe(`profesor activar alumno ${aid}`, () =>
            context.patchJson(`/profesores/alumnos/${aid}/activate`, {})
          );
          await safe(`profesor force reset alumno ${aid}`, () =>
            context.postJson(`/profesores/alumnos/${aid}/force-reset`, {})
          );
        }

        const slotIds = context.getState<string[]>('profesorSlotIds') || [];
        if (slotIds.length > 0) {
          const sid = slotIds[0];
          await safe(`borrar slot profesor ${sid}`, () =>
            context.deleteJson(`/profesores/slots/${sid}`)
          );
        }
      } finally {
        context.setAccessToken(adminToken);
      }
    } else {
      context.setAccessToken(adminToken);
      console.warn(
        '[seed] No se pudo autenticar profesor semilla para listar /profesores/slots y /profesores/alumnos'
      );
    }
  }
}

async function profesorAlumnoTask(context: SeedContext): Promise<void> {
  await safe('listar aulas', () => context.getJson('/alumnos/aulas'));
  const aulas = await safe('get json aulas', () =>
    context.getJson<any[]>('/alumnos/aulas')
  );
  if (Array.isArray(aulas) && aulas.length > 0) {
    const aula = aulas[0]?.aula;
    if (aula) {
      await safe(`listar clases aula ${aula}`, () =>
        context.getJson(`/alumnos/aulas/${aula}/clases`)
      );
      const clases = await safe(`get json clases aula ${aula}`, () =>
        context.getJson<any[]>(`/alumnos/aulas/${aula}/clases`)
      );
      if (Array.isArray(clases) && clases.length > 0) {
        const clase = clases[0]?.numeroClase;
        if (clase !== undefined) {
          await safe(`listar profesores aula ${aula} clase ${clase}`, () =>
            context.getJson(`/alumnos/aulas/${aula}/clases/${clase}/profesores`)
          );
        }
      }
    }
  }

  await safe('change profesor alumno', () =>
    context.patchJson('/alumnos/change-profesor', {
      nuevoProfesorId: faker.string.uuid(),
    })
  );

  await saveListIds(context, '/profesores/admin-slots', 'profesorAdminSlotIds');
  const adminSlots = context.getState<string[]>('profesorAdminSlotIds') || [];
  if (adminSlots.length > 0) {
    await safe(`DELETE admin-slot ${adminSlots[0]}`, () =>
      context.deleteJson(`/profesores/admin-slots/${adminSlots[0]}`)
    );
  }
}

async function proveedorTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  const runTag = faker.string.alphanumeric(6).toUpperCase();
  const desired = Array.from({ length: 15 * volumeMultiplier }).map(
    (_, idx) => ({
      nombre: `Proveedor Semilla ${runTag}-${idx}`,
      contacto: faker.person.fullName(),
      telefono: `+34${faker.string.numeric(9)}`,
      email: `proveedor.seed.${runTag}.${idx}@smarteconomat.local`,
      direccion: faker.location.streetAddress(),
      nif: `S${runTag}${String(idx).padStart(3, '0')}`,
    })
  );

  const list = await safe('listar proveedor', () =>
    context.getJson<any>('/proveedor?limit=50&page=1')
  );
  if (!list) {
    return;
  }
  const items = Array.isArray(list?.items)
    ? list.items
    : Array.isArray(list?.data?.items)
      ? list.data.items
      : [];

  for (const proveedor of desired) {
    const exists = items.find((p: any) => p?.nif === proveedor.nif);
    if (exists) {
      context.set(`proveedor:${proveedor.nif}`, exists.id);
      continue;
    }

    const created = await safe(`crear proveedor ${proveedor.nif}`, () =>
      context.postJson<any>('/proveedor', proveedor)
    );
    if (!created) {
      continue;
    }
    context.set(`proveedor:${proveedor.nif}`, created?.id);
    pushId(context, 'proveedorIds', created?.id);
  }

  await saveListIds(context, '/proveedor', 'proveedorIds');
  const ids = context.getState<string[]>('proveedorIds') || [];
  if (ids.length > 0) {
    const id = ids[0];
    await safe(`get proveedor ${id}`, () =>
      context.getJson(`/proveedor/${id}`)
    );

    await safe(`delete proveedor ${id}`, () =>
      context.deleteJson(`/proveedor/${id}`)
    );
  }
}

async function productoTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(context, '/proveedor', 'proveedorIds');
  const runTag = faker.string.alphanumeric(7).toUpperCase();
  const maxToCreate = 16 * volumeMultiplier;
  const batchSize = 4;

  const list = await safe('listar productos', () =>
    context.getJson<any>('/productos?limit=50&page=1')
  );
  if (!list) {
    return;
  }
  const items = Array.isArray(list?.items)
    ? list.items
    : Array.isArray(list?.data?.items)
      ? list.data.items
      : [];

  const existingCodes = new Set(
    items.map((p: any) => p?.codigoBarras).filter(Boolean)
  );

  const candidates: Array<{ code: string; payload: Record<string, unknown> }> =
    [];
  for (let i = 0; i < maxToCreate; i++) {
    const targetCode = `SEED-${runTag}-${String(i).padStart(4, '0')}`;
    if (existingCodes.has(targetCode)) {
      continue;
    }

    candidates.push({
      code: targetCode,
      payload: {
        nombre: faker.commerce.productName(),
        marca: faker.company.name(),
        descripcion: faker.commerce.productDescription(),
        unidad: i % 2 === 0 ? 'KG' : 'UNIDAD',
        tipo: i % 3 === 0 ? 'cereal' : i % 3 === 1 ? 'verdura' : 'lacteo',
        codigoBarras: targetCode,
        contenido: Number(
          faker.number.float({ min: 0.1, max: 25, fractionDigits: 2 })
        ),
      },
    });
  }

  let consecutiveMisses = 0;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const createdBatch = await Promise.all(
      batch.map((candidate) =>
        safe(`crear producto semilla ${candidate.code}`, () =>
          context.postJson<any>('/productos', candidate.payload)
        )
      )
    );

    let batchHits = 0;
    for (const created of createdBatch) {
      if (!created) {
        continue;
      }
      batchHits++;
      pushId(context, 'productoIds', created?.id);
    }

    if (batchHits === 0) {
      consecutiveMisses++;
    } else {
      consecutiveMisses = 0;
    }

    if (consecutiveMisses >= 3) {
      console.warn(
        '[seed] productoTask detenido anticipadamente por demasiados lotes sin inserciones'
      );
      break;
    }
  }

  await saveListIds(context, '/productos', 'productoIds');
  await saveListIds(
    context,
    '/producto-proveedor/search',
    'productoProveedorIds'
  );

  const productoIds = context.getState<string[]>('productoIds') || [];
  if (productoIds.length > 0) {
    const pid = productoIds[0];
    await safe(`get producto ${pid}`, () =>
      context.getJson(`/productos/${pid}`)
    );
    await safe(`get pmp producto ${pid}`, () =>
      context.getJson(`/productos/${pid}/pmp`)
    );
    await safe(`get historial precios producto ${pid}`, () =>
      context.getJson(`/productos/${pid}/historial-precios`)
    );
    await safe(`delete producto ${pid}`, () =>
      context.deleteJson(`/productos/${pid}`)
    );
  }

  await safe('generar ean13', () =>
    context.getJson('/productos/generar-ean13')
  );
  await safe('producto alergenos', () =>
    context.getJson('/producto-alergenos')
  );

  const ppIds = context.getState<string[]>('productoProveedorIds') || [];
  if (ppIds.length > 0) {
    const ppid = ppIds[0];
    await safe(`historial producto-proveedor ${ppid}`, () =>
      context.getJson(`/producto-proveedor/${ppid}/historial`)
    );
  }

  if (productoIds.length > 1) {
    await safe(`comparar producto ${productoIds[1]}`, () =>
      context.getJson(`/producto-proveedor/comparar/${productoIds[1]}`)
    );
  }
}

async function ubicacionTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  const current = await saveListIds(context, '/ubicacion', 'ubicacionIds');
  const existingNames = new Set(
    current.map((x: any) => x?.nombre).filter(Boolean)
  );

  for (let i = 0; i < 20 * volumeMultiplier; i++) {
    const nombre = `UBI-SEED-${String(i).padStart(3, '0')}`;
    if (existingNames.has(nombre)) {
      continue;
    }

    const created = await safe(`crear ubicacion ${nombre}`, () =>
      context.postJson<any>('/ubicacion', {
        nombre,
        descripcion: `Ubicacion automatica ${i}`,
        activo: true,
      })
    );

    pushId(context, 'ubicacionIds', created?.id);
  }

  await saveListIds(context, '/ubicacion', 'ubicacionIds');

  const ubiIds = context.getState<string[]>('ubicacionIds') || [];
  if (ubiIds.length > 0) {
    const uid = ubiIds[0];
    await safe(`get ubicacion ${uid}`, () =>
      context.getJson(`/ubicacion/${uid}`)
    );
    await safe(`delete ubicacion ${uid}`, () =>
      context.deleteJson(`/ubicacion/${uid}`)
    );
  }
}

async function inventarioTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(
    context,
    '/producto-proveedor/search',
    'productoProveedorIds'
  );
  await saveListIds(context, '/ubicacion', 'ubicacionIds');

  const productoProveedorIds =
    context.getState<string[]>('productoProveedorIds') || [];
  const ubicacionIds = context.getState<string[]>('ubicacionIds') || [];
  const toCreate = Math.min(
    productoProveedorIds.length,
    ubicacionIds.length,
    25 * volumeMultiplier
  );

  for (let i = 0; i < toCreate; i++) {
    await safe(`crear inventario ${i}`, () =>
      context.postJson('/inventario', {
        productoProveedorId: productoProveedorIds[i],
        ubicacionId: ubicacionIds[i],
        cantidadActual: faker.number.int({ min: 10, max: 500 }),
        cantidadMinima: faker.number.int({ min: 2, max: 25 }),
        cantidadMaxima: faker.number.int({ min: 300, max: 800 }),
      })
    );
  }

  await saveListIds(context, '/inventario', 'inventarioIds');
  await safe('inventario stock', () => context.getJson('/inventario/stock'));

  const invIds = context.getState<string[]>('inventarioIds') || [];
  if (invIds.length > 0) {
    const iid = invIds[0];
    await safe(`get inventario ${iid}`, () =>
      context.getJson(`/inventario/${iid}`)
    );
    await safe(`delete inventario ${iid}`, () =>
      context.deleteJson(`/inventario/${iid}`)
    );
  }

  const inventarioIds = context.getState<string[]>('inventarioIds') || [];
  for (const id of inventarioIds.slice(0, 12)) {
    const tipoAjuste = faker.helpers.arrayElement([
      'entrada',
      'ajuste',
      'salida_ajuste',
    ]);

    let ajusteValue = 1;
    if (tipoAjuste === 'salida_ajuste') {
      ajusteValue = -Math.abs(faker.number.int({ min: 1, max: 8 }));
    } else if (tipoAjuste === 'ajuste') {
      const v = faker.number.int({ min: -5, max: 8 });
      ajusteValue = v === 0 ? (Math.random() < 0.5 ? -1 : 1) : v;
    } else {
      ajusteValue = Math.abs(faker.number.int({ min: 1, max: 8 }));
    }

    await safe(`ajuste inventario ${id}`, () =>
      context.postJson('/inventario/ajustes-manuales', {
        inventarioId: id,
        tipo: tipoAjuste,
        ajuste: ajusteValue,
        motivo: 'Ajuste seed masivo',
        observaciones: 'Ajuste automatizado por seeder HTTP',
      })
    );
  }
}

async function pingTask(context: SeedContext, path: string): Promise<void> {
  await safe(`ping ${path}`, () => context.getJson(`${path}?limit=10&page=1`));
}

async function pedidoTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(context, '/pedido-usuarios', 'pedidoUsuarioIds');
  await saveListIds(context, '/purchase-batches', 'purchaseBatchIds');
  await saveListIds(context, '/pedidos', 'pedidoIds');
  await saveListIds(context, '/recetas', 'recetaIds');

  const recetaIds = context.getState<string[]>('recetaIds') || [];
  const recetaIdsForPedido = recetaIds.slice(0, 3);

  for (let i = 0; i < 8 * volumeMultiplier; i++) {
    await safe(`pedido-draft ${i}`, () =>
      context.postJson('/pedido/draft', {
        payload: {
          nombre: `Borrador Pedido ${i}`,
          nota: faker.lorem.sentence(),
          lineas: [],
        },
      })
    );

    if (recetaIdsForPedido.length > 0) {
      try {
        await safe(`pedido from recipes ${i}`, () =>
          context.postJson('/pedidos/from-recipes', {
            recetaIds: recetaIdsForPedido,
            observaciones: 'Generado por seeder HTTP',
          })
        );
      } catch (err) {
        console.warn(
          `[seed] pedido from recipes omitido: ${String(
            err instanceof Error ? err.message : err
          )}`
        );
      }
    }

    const pendingPedidoIds = (
      context.getState<string[]>('pedidoPendienteIds') || []
    ).slice(0, 5);
    const pendingPedidoUsuarioIds = (
      context.getState<string[]>('pedidoUsuarioPendienteIds') ||
      context.getState<string[]>('pedidoUsuarioIds') ||
      []
    ).slice(0, 5);

    const consolidateBody: Record<string, unknown> = {};
    if (pendingPedidoIds.length > 0)
      consolidateBody.pedidoIds = pendingPedidoIds;
    if (pendingPedidoUsuarioIds.length > 0)
      consolidateBody.pedidoUsuarioIds = pendingPedidoUsuarioIds;

    if (Object.keys(consolidateBody).length > 0) {
      consolidateBody.observaciones = faker.lorem.sentence();
      try {
        await safe(`purchase batch consolidate ${i}`, () =>
          context.postJson('/purchase-batches/consolidate', consolidateBody)
        );
      } catch (err) {
        console.warn(
          `[seed] purchase batch consolidate omitido: ${String(
            err instanceof Error ? err.message : err
          )}`
        );
      }
    } else {
      console.warn(
        '[seed] purchase batch consolidate omitido: no hay pedidos pendientes'
      );
    }
  }

  await saveListIds(context, '/pedido-usuarios', 'pedidoUsuarioIds');
  await saveListIds(context, '/purchase-batches', 'purchaseBatchIds');
  await saveListIds(context, '/pedidos', 'pedidoIds');

  const puIds = context.getState<string[]>('pedidoUsuarioIds') || [];
  if (puIds.length > 0) {
    const puid = puIds[0];
    await safe(`get pedido-usuario ${puid}`, () =>
      context.getJson(`/pedido-usuarios/${puid}`)
    );
    await safe(`get pdf pedido-usuario ${puid}`, () =>
      context.getJson(`/pedido-usuarios/${puid}/pdf`)
    );
    await safe(`PATCH pedido-usuario ${puid}`, () =>
      context.patchJson(`/pedido-usuarios/${puid}`, { items: [] })
    );
  }

  const pbIds = context.getState<string[]>('purchaseBatchIds') || [];
  if (pbIds.length > 0) {
    const pbid = pbIds[0];
    await safe(`get purchase-batch ${pbid}`, () =>
      context.getJson(`/purchase-batches/${pbid}`)
    );
    await safe(`get pdf purchase-batch ${pbid}`, () =>
      context.getJson(`/purchase-batches/${pbid}/pdf`)
    );
    await safe(`PATCH purchase-batch ${pbid}`, () =>
      context.patchJson(`/purchase-batches/${pbid}`, {
        observaciones: 'Modified',
      })
    );
    await safe(`PATCH purchase-batch cancelar ${pbid}`, () =>
      context.patchJson(`/purchase-batches/${pbid}/cancelar`, {})
    );
    await safe(`PATCH purchase-batch aceptar ${pbid}`, () =>
      context.patchJson(`/purchase-batches/${pbid}/aceptar`, {})
    );
  }

  const pedIds = context.getState<string[]>('pedidoIds') || [];
  if (pedIds.length > 0) {
    const pedid = pedIds[0];
    await safe(`get pedido ${pedid}`, () =>
      context.getJson(`/pedidos/${pedid}`)
    );
    await safe(`PATCH pedido ${pedid}`, () =>
      context.patchJson(`/pedidos/${pedid}`, { nota: 'Updated' })
    );
    await safe(`PATCH pedido fecha-entrega ${pedid}`, () =>
      context.patchJson(`/pedidos/${pedid}/fecha-entrega`, {
        fechaEntrega: new Date(),
      })
    );
    await safe(`delete pedido ${pedid}`, () =>
      context.deleteJson(`/pedidos/${pedid}`)
    );
  }

  await safe('get pedido draft', () => context.getJson('/pedido/draft'));
  await safe('delete pedido draft', () => context.deleteJson('/pedido/draft'));

  await safe('purchase batches from missing stock', () =>
    context.postJson('/purchase-batches/from-missing-stock', {})
  );
  await safe('purchase batches from recipes', () =>
    context.postJson('/purchase-batches/from-recipes', {
      recetaIds: context.getState<string[]>('recetaIds')?.slice(0, 2) || [],
      observaciones: 'Seed from recipes',
    })
  );
  await saveListIds(context, '/purchase-batches', 'purchaseBatchIds');
}

async function recepcionTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(context, '/recepciones', 'recepcionIds');
  for (let i = 0; i < 5 * volumeMultiplier; i++) {
    await safe(`recepcion-draft ${i}`, () =>
      context.postJson('/recepcion/draft', {
        payload: {
          nombre: `Borrador Recepcion ${i}`,
          nota: faker.lorem.sentence(),
        },
      })
    );
  }

  await saveListIds(context, '/recepciones', 'recepcionIds');
  await saveListIds(context, '/recepcion-productos', 'recepcionProductoIds');

  await safe('get recepcion draft', () => context.getJson('/recepcion/draft'));
  await safe('delete recepcion draft', () =>
    context.deleteJson('/recepcion/draft')
  );

  const recIds = context.getState<string[]>('recepcionIds') || [];
  if (recIds.length > 0) {
    const rid = recIds[0];
    await safe(`get recepcion ${rid}`, () =>
      context.getJson(`/recepciones/${rid}`)
    );
    await safe(`PATCH recepcion ${rid}`, () =>
      context.patchJson(`/recepciones/${rid}`, { nota: 'Updated' })
    );
    await safe(`delete recepcion ${rid}`, () =>
      context.deleteJson(`/recepciones/${rid}`)
    );
  }

  const rpIds = context.getState<string[]>('recepcionProductoIds') || [];
  if (rpIds.length > 0) {
    const rpid = rpIds[0];
    await safe(`get recepcion-producto ${rpid}`, () =>
      context.getJson(`/recepcion-productos/${rpid}`)
    );
    await safe(`PATCH recepcion-producto ${rpid}`, () =>
      context.patchJson(`/recepcion-productos/${rpid}`, { cantidad: 5 })
    );
    await safe(`DELETE recepcion-producto ${rpid}`, () =>
      context.deleteJson(`/recepcion-productos/${rpid}`)
    );
  }

  await safe('crear recepcion-producto manual', () =>
    context.postJson('/recepcion-productos', {
      recepcionId: recIds[0],
      productoProveedorId: faker.string.uuid(),
      cantidad: 1,
    })
  );

  await safe('reporte recepciones', () =>
    context.getJson('/recepciones/reporte-pdf')
  );
  await saveListIds(context, '/recepciones', 'recepcionIds');
  await saveListIds(context, '/recepcion-productos', 'recepcionProductoIds');
}

async function albaranTask(context: SeedContext): Promise<void> {
  await saveListIds(context, '/albaranes', 'albaranIds');

  const albIds = context.getState<string[]>('albaranIds') || [];
  if (albIds.length > 0) {
    const aid = albIds[0];
    await safe(`get albaran ${aid}`, () =>
      context.getJson(`/albaranes/${aid}`)
    );
    await safe(`delete albaran ${aid}`, () =>
      context.deleteJson(`/albaranes/${aid}`)
    );
  }

  await safe('crear albaran (sin documento)', () =>
    context.postJson('/albaranes', {
      nAlbaran: `ALB-SEED-${Date.now()}`,
    })
  );

  await safe('upload albaran documento mockup', () =>
    context.postJson('/albaranes/upload-documento', { dummy: 'mock' })
  );
}

async function historialPrecioTask(context: SeedContext): Promise<void> {
  await saveListIds(context, '/historial-precio', 'historialPrecioIds');
  const hpIds = context.getState<string[]>('historialPrecioIds') || [];
  if (hpIds.length > 0) {
    const hpid = hpIds[0];
    await safe(`get historial-precio ${hpid}`, () =>
      context.getJson(`/historial-precio/${hpid}`)
    );
    await safe(`delete historial-precio ${hpid}`, () =>
      context.deleteJson(`/historial-precio/${hpid}`)
    );
  }
}

async function incidenciaTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(context, '/incidencias', 'incidenciaIds');
  await saveListIds(context, '/incidencias-resueltas', 'incidenciaResueltaIds');
  await saveListIds(context, '/recepciones', 'recepcionIds');

  const incIds = context.getState<string[]>('incidenciaIds') || [];
  if (incIds.length > 0) {
    const iid = incIds[0];
    await safe(`get incidencia ${iid}`, () =>
      context.getJson(`/incidencias/${iid}`)
    );
    await safe(`PATCH incidencia ${iid}`, () =>
      context.patchJson(`/incidencias/${iid}`, { tipo: 'otro' })
    );
    await safe(`PATCH resolver incidencia ${iid}`, () =>
      context.patchJson(`/incidencias/${iid}/resolver`, {})
    );
    await safe(`POST resolver incidencia ${iid}`, () =>
      context.postJson(`/incidencias/${iid}/resolver`, {})
    );
    await safe(`delete incidencia ${iid}`, () =>
      context.deleteJson(`/incidencias/${iid}`)
    );
  }

  const resIds = context.getState<string[]>('incidenciaResueltaIds') || [];
  if (resIds.length > 0) {
    const rsid = resIds[0];
    await safe(`get incidencia-resuelta ${rsid}`, () =>
      context.getJson(`/incidencias-resueltas/${rsid}`)
    );
    await safe(`PATCH incidencia-resuelta ${rsid}`, () =>
      context.patchJson(`/incidencias-resueltas/${rsid}`, { nota: 'Updated' })
    );
    await safe(`DELETE incidencia-resuelta ${rsid}`, () =>
      context.deleteJson(`/incidencias-resueltas/${rsid}`)
    );
  }

  await safe('POST incidencias-resueltas dummy', () =>
    context.postJson('/incidencias-resueltas', { incidenciaId: incIds[0] })
  );

  const recepcionIds = context.getState<string[]>('recepcionIds') || [];

  for (let i = 0; i < 6 * volumeMultiplier; i++) {
    const recepcionId = recepcionIds[i % Math.max(1, recepcionIds.length)];
    if (!recepcionId) {
      continue;
    }

    await safe(`incidencia reportar ${i}`, () =>
      context.postJson('/incidencias/reportar', {
        recepcionId,
        tipo: faker.helpers.arrayElement([
          'rotura',
          'caducado',
          'falta_producto',
          'exceso_producto',
          'otro',
        ]),
      })
    );
  }
  await saveListIds(context, '/incidencias', 'incidenciaIds');
  await saveListIds(context, '/incidencias-resueltas', 'incidenciaResueltaIds');
}

async function recetaTask(context: SeedContext): Promise<void> {
  const volumeMultiplier = getVolumeMultiplier(context);
  await saveListIds(context, '/recetas', 'recetaIds');
  const recetaIds = context.getState<string[]>('recetaIds') || [];
  if (recetaIds.length > 0) {
    const rid = recetaIds[0];
    await safe(`get receta ${rid}`, () => context.getJson(`/recetas/${rid}`));
    await safe(`get receta detalle ${rid}`, () =>
      context.getJson(`/recetas/${rid}/detalle`)
    );
    await safe(`get receta escandallo ${rid}`, () =>
      context.getJson(`/recetas/${rid}/escandallo`)
    );
    await safe(`get receta pdf ${rid}`, () =>
      context.getJson(`/recetas/${rid}/pdf`)
    );
  }

  const sourceId = recetaIds[0];

  if (!sourceId) {
    return;
  }

  for (let i = 0; i < 10 * volumeMultiplier; i++) {
    await safe(`duplicar receta ${i}`, () =>
      context.postJson('/recetas/duplicate', {
        sourceId,
        newName: `Receta duplicada seed ${i} ${faker.string.alphanumeric(4)}`,
      })
    );
  }

  await safe('export recetas pdf', () =>
    context.getJson(
      `/recetas/export/pdf?ids=${recetaIds.slice(0, 3).join(',')}`
    )
  );
  await saveListIds(context, '/recetas', 'recetaIds');
}

async function mermaTask(context: SeedContext): Promise<void> {
  await safe('merma stats', () => context.getJson('/merma/stats'));
  await saveListIds(context, '/merma', 'mermaIds');
  const merIds = context.getState<string[]>('mermaIds') || [];
  if (merIds.length > 0) {
    await safe(`get merma ${merIds[0]}`, () =>
      context.getJson(`/merma/${merIds[0]}`)
    );
  }
}

async function preparacionTaskEnhanced(context: SeedContext): Promise<void> {
  await safe('listar preparaciones', () => context.getJson('/preparaciones'));
  await saveListIds(context, '/preparaciones', 'preparacionIds');
  const prepIds = context.getState<string[]>('preparacionIds') || [];
  if (prepIds.length > 0) {
    const pid = prepIds[0];
    await safe(`get preparacion ${pid}`, () =>
      context.getJson(`/preparaciones/${pid}`)
    );
    await safe(`PATCH iniciar preparacion ${pid}`, () =>
      context.patchJson(`/preparaciones/${pid}/iniciar`, {})
    );
    await safe(`PATCH finalizar preparacion ${pid}`, () =>
      context.patchJson(`/preparaciones/${pid}/finalizar`, {})
    );
    await safe(`PATCH cancelar preparacion ${pid}`, () =>
      context.patchJson(`/preparaciones/${pid}/cancelar`, {})
    );
    await safe(`DELETE preparacion ${pid}`, () =>
      context.deleteJson(`/preparaciones/${pid}`)
    );
  }

  await safe('POST preparaciones dummy', () =>
    context.postJson('/preparaciones', { recetaId: faker.string.uuid() })
  );
}

async function produccionTask(context: SeedContext): Promise<void> {
  await safe('validar produccion', () =>
    context.postJson('/produccion/validar', {})
  );
  await safe('ejecutar produccion', () =>
    context.postJson('/produccion/ejecutar', {})
  );

  await saveListIds(context, '/produccion', 'produccionLoteIds');
  const lotIds = context.getState<string[]>('produccionLoteIds') || [];
  if (lotIds.length > 0) {
    const lid = lotIds[0];
    await safe(`get produccion ${lid}`, () =>
      context.getJson(`/produccion/${lid}`)
    );
    await safe(`PATCH consumir lote ${lid}`, () =>
      context.patchJson(`/produccion/lote/${lid}/consumir`, {})
    );
  }
}

async function movimientosTask(context: SeedContext): Promise<void> {
  await safe('movimientos historial', () =>
    context.getJson('/movimientos/historial')
  );
  await saveListIds(context, '/movimientos', 'movimientoIds');
  const movIds = context.getState<string[]>('movimientoIds') || [];
  if (movIds.length > 0) {
    const mid = movIds[0];
    await safe(`get movimiento ${mid}`, () =>
      context.getJson(`/movimientos/${mid}`)
    );
    await safe(`DELETE movimiento ${mid}`, () =>
      context.deleteJson(`/movimientos/${mid}`)
    );
  }
}

async function archivosTask(context: SeedContext): Promise<void> {
  await safe('mock upload archivo', () =>
    context.postJson('/archivos/upload', { dummy: 'file' })
  );
  await saveListIds(context, '/archivos', 'archivoIds');
  const arcIds = context.getState<string[]>('archivoIds') || [];
  if (arcIds.length > 0) {
    const aid = arcIds[0];
    await safe(`get archivo ${aid}`, () => context.getJson(`/archivos/${aid}`));
    await safe(`DELETE archivo ${aid}`, () =>
      context.deleteJson(`/archivos/${aid}`)
    );
  }
}

async function exportTask(context: SeedContext): Promise<void> {
  const endpoints = [
    '/export/albaranes/pdf',
    '/export/albaranes/xlsx',
    '/export/incidencias/xlsx',
    '/export/inventario/pdf',
    '/export/inventario/xlsx',
    '/export/movimientos/xlsx',
    '/export/pedidos/pdf',
    '/export/pedidos/xlsx',
    '/export/productos/pdf',
    '/export/productos/xlsx',
    '/export/proveedores/pdf',
    '/export/proveedores/xlsx',
    '/export/recepciones/xlsx',
    '/export/recetas/pdf',
    '/export/recetas/xlsx',
    '/export/ubicaciones/xlsx',
    '/export/usuarios/xlsx',
  ];
  for (const ep of endpoints) {
    await safe(`export ${ep}`, () => context.getJson(ep));
  }
}

async function authTask(context: SeedContext): Promise<void> {
  await safe('auth forgot-password', () =>
    context.postJson('/auth/forgot-password', { email: 'test@example.com' })
  );
  await safe('auth reset-password', () =>
    context.postJson('/auth/reset-password', {
      token: 'dummy',
      newPassword: 'Dummy',
    })
  );
  await safe('auth register mock', () =>
    context.postJson('/auth/register', { dummy: 'mock' })
  );
  await safe('auth change-password', () =>
    context.patchJson('/auth/change-password', {
      currentPassword: DEFAULT_SEED_PASSWORD,
      newPassword: 'NewPassword123!',
    })
  );
  await safe('auth logout', () => context.postJson('/auth/logout', {}));
}

async function baseTask(context: SeedContext): Promise<void> {
  await safe('root v1', () => context.getJson('/'));
}

async function alertasTask(context: SeedContext): Promise<void> {
  await safe('alertas caducidad', () => context.getJson('/alertas/caducidad'));
  await safe('alertas stock', () => context.getJson('/alertas/stock'));
}

const TASKS: Record<string, SeederTask> = {
  'roles-permisos': rolesPermisosTask,
  usuario: usuariosTask,
  proveedor: proveedorTask,
  producto: productoTask,
  inventario: inventarioTask,
  pedido: pedidoTask,
  recepcion: recepcionTask,
  albaran: albaranTask,
  'historial-precio': historialPrecioTask,
  incidencia: incidenciaTask,
  receta: recetaTask,
  preparacion: preparacionTaskEnhanced,
  merma: mermaTask,
  ubicacion: ubicacionTask,
  ping: (c) => pingTask(c, '/dashboard/stats'),
  profesorAlumno: profesorAlumnoTask,
  archivos: archivosTask,
  export: exportTask,
  produccion: produccionTask,
  movimientos: movimientosTask,
  auth: authTask,
  base: baseTask,
  alertas: alertasTask,
};

export async function runNamedHttpSeeder(
  name: string,
  context: SeedContext
): Promise<void> {
  const task = TASKS[name];
  if (!task) {
    throw new Error(`[seed] Seeder HTTP no registrado: ${name}`);
  }

  await task(context);
}
