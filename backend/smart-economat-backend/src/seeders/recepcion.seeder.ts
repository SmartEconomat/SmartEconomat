import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { EstadoPedido } from '../modules/pedido/enums/estado-pedido.enum';
import { EstadoProductoRecepcion } from '../modules/recepcion/enums/estado-producto.enum';
import { EstadoVisualProducto } from '../modules/recepcion/enums/estado-visual.enum';
import { SeedContext } from './seed-context';
import {
  DETERMINISTIC_SHORT_NOTES,
  deterministicBool,
  deterministicCode,
  deterministicInt,
  pickDeterministic,
  seedDateIso,
} from './deterministic.seed-data';

type SeedRecord = Record<string, unknown>;

type PaginatedSeedResponse<T> = {
  items?: T[];
  data?: T[] | { items?: T[] };
  totalPages?: number;
};

type PedidoResumenSeed = {
  id: string;
  estado: EstadoPedido;
};

type PedidoProductoSeed = {
  id: string;
  cantidad: number | string;
};

type PedidoDetalleSeed = PedidoResumenSeed & {
  pedidoProductos?: PedidoProductoSeed[];
};

type PedidoRecepcionSeedPayload = {
  pedidoId: string;
  nAlbaran: string;
  observaciones: string;
};

type RecepcionLineaSeedPayload = {
  pedidoProductoId: string;
  cantidadRecibida: number;
  cantidadAlbaran: number;
  estadoVisual: EstadoVisualProducto;
  estadoProducto: EstadoProductoRecepcion;
  fechaCaducidad: string;
  observaciones: string;
  isWeighedWithScale: boolean;
};

type CreateRecepcionSeedPayload = {
  pedidos: PedidoRecepcionSeedPayload[];
  nAlbaran: string;
  fechaRecepcion: string;
  observaciones: string;
  productos: RecepcionLineaSeedPayload[];
};

function isRecord(value: unknown): value is SeedRecord {
  return typeof value === 'object' && value !== null;
}

function extractItems<T>(input: unknown): T[] {
  if (Array.isArray(input)) {
    return input as T[];
  }

  if (!isRecord(input)) {
    return [];
  }

  if (Array.isArray(input.items)) {
    return input.items as T[];
  }

  if (Array.isArray(input.data)) {
    return input.data as T[];
  }

  if (isRecord(input.data) && Array.isArray(input.data.items)) {
    return input.data.items as T[];
  }

  return [];
}

function extractEntity<T>(input: unknown): T | null {
  if (!isRecord(input)) {
    return null;
  }

  if (isRecord(input.data)) {
    return input.data as T;
  }

  return input as T;
}

function extractTotalPages(input: unknown): number | null {
  if (!isRecord(input)) {
    return null;
  }

  if (typeof input.totalPages === 'number') {
    return input.totalPages;
  }

  if (isRecord(input.data) && typeof input.data.totalPages === 'number') {
    return input.data.totalPages;
  }

  return null;
}

function isPedidoResumenSeed(value: unknown): value is PedidoResumenSeed {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    Object.values(EstadoPedido).includes(value.estado as EstadoPedido)
  );
}

function isPedidoDetalleSeed(value: unknown): value is PedidoDetalleSeed {
  if (!isPedidoResumenSeed(value)) {
    return false;
  }

  return !('pedidoProductos' in value) || Array.isArray(value.pedidoProductos);
}

function normalizeCantidad(value: unknown): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return Number(numericValue.toFixed(2));
}

function isRecepcionLineaSeedPayload(
  value: RecepcionLineaSeedPayload | null
): value is RecepcionLineaSeedPayload {
  return value !== null;
}

function seedIndexFromId(id: string): number {
  const compact = id.replace(/[^a-fA-F0-9]/g, '').slice(0, 8);
  const parsed = Number.parseInt(compact || '0', 16);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildRecepcionPayload(
  pedido: PedidoDetalleSeed
): CreateRecepcionSeedPayload | null {
  const baseSeed = seedIndexFromId(pedido.id);
  const productos = (pedido.pedidoProductos || [])
    .map((pedidoProducto, lineIndex): RecepcionLineaSeedPayload | null => {
      const cantidad = normalizeCantidad(pedidoProducto.cantidad);
      const seed = baseSeed + lineIndex;

      if (cantidad <= 0 || typeof pedidoProducto.id !== 'string') {
        return null;
      }

      return {
        pedidoProductoId: pedidoProducto.id,
        cantidadRecibida: cantidad,
        cantidadAlbaran: cantidad,
        estadoVisual: EstadoVisualProducto.OPTIMO,
        estadoProducto: EstadoProductoRecepcion.PERFECTO,
        fechaCaducidad: seedDateIso(
          deterministicInt(15, 45, seed, 'recepcion-linea-caducidad')
        ),
        observaciones: pickDeterministic(
          DETERMINISTIC_SHORT_NOTES,
          seed,
          'recepcion-linea-observacion'
        ),
        isWeighedWithScale: deterministicBool(seed, 'recepcion-linea-peso'),
      };
    })
    .filter(isRecepcionLineaSeedPayload);

  if (productos.length === 0) {
    return null;
  }

  const nAlbaran = deterministicCode(
    'ALB-SEED-',
    baseSeed,
    10,
    'recepcion-nalbaran'
  );
  const observaciones = `Recepcion generada por seeder para pedido ${pedido.id}. ${pickDeterministic(
    DETERMINISTIC_SHORT_NOTES,
    baseSeed,
    'recepcion-observacion'
  )}`;

  return {
    pedidos: [
      {
        pedidoId: pedido.id,
        nAlbaran,
        observaciones,
      },
    ],
    nAlbaran,
    fechaRecepcion: seedDateIso(
      deterministicInt(0, 3, baseSeed, 'recepcion-fecha')
    ),
    observaciones,
    productos,
  };
}

async function loadReceivablePedidos(
  context: SeedContext
): Promise<PedidoResumenSeed[]> {
  const pedidos: PedidoResumenSeed[] = [];
  let page = 1;

  while (page <= 10) {
    const response = await context.getJson<PaginatedSeedResponse<unknown>>(
      `/pedidos?limit=50&page=${page}`
    );
    const pageItems =
      extractItems<unknown>(response).filter(isPedidoResumenSeed);

    pedidos.push(
      ...pageItems.filter(
        (pedido) => pedido.estado === EstadoPedido.POR_RECEPCIONAR
      )
    );

    const totalPages = extractTotalPages(response);
    if (pageItems.length === 0 || (totalPages !== null && page >= totalPages)) {
      break;
    }

    page += 1;
  }

  return pedidos;
}

async function loadPedidoDetalle(
  context: SeedContext,
  pedidoId: string
): Promise<PedidoDetalleSeed | null> {
  const response = await context.getJson<unknown>(`/pedidos/${pedidoId}`);
  const pedido = extractEntity<unknown>(response);

  if (!isPedidoDetalleSeed(pedido)) {
    return null;
  }

  return pedido;
}

/**
 * Expone "runSeeder" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export const runSeeder = async (context: SeedContext) => {
  const pedidosRecepcionables = await loadReceivablePedidos(context);

  if (pedidosRecepcionables.length === 0) {
    console.warn(
      '[seed] No hay pedidos por recepcionar; se omite la creación de recepciones.'
    );
    return;
  }

  let recepcionesCreadas = 0;

  for (const pedido of pedidosRecepcionables) {
    const pedidoDetalle = await loadPedidoDetalle(context, pedido.id);

    if (!pedidoDetalle) {
      continue;
    }

    const payload = buildRecepcionPayload(pedidoDetalle);
    if (!payload) {
      continue;
    }

    await context.postJson('/recepciones', payload);
    recepcionesCreadas += 1;
  }

  if (recepcionesCreadas === 0) {
    console.warn(
      '[seed] No se crearon recepciones porque los pedidos recepcionables no tenían líneas válidas.'
    );
    return;
  }

  console.log(SeederI18nHelper.getSeederSuccess('recepciones'));
};
