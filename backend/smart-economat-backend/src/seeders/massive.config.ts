import { HttpMethod } from './massive.types';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export const API_PREFIX = '/api/v1';

/**
 * Ejecuta la lógica de read positive int dentro del flujo de la aplicación.
 *
 * @param name Parámetro de entrada para la operación.
 * @param fallback Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

const BASE_MIN_REQUESTS = 10;
const BASE_MAX_REQUESTS = 30;
const BASE_MIN_PRODUCTS = 30;
const BASE_CONCURRENCY = readPositiveInt('SEED_BASE_CONCURRENCY', 32);

/** Constantes públicas (SEED_MULTIPLIER) expuestas en smart-economat-backend (Nest). */
export const SEED_MULTIPLIER = readPositiveInt('SEED_MULTIPLIER', 1);

const scaledMinRequests = BASE_MIN_REQUESTS * SEED_MULTIPLIER;
const scaledMaxRequests = BASE_MAX_REQUESTS * SEED_MULTIPLIER;
const scaledMinProducts = BASE_MIN_PRODUCTS * SEED_MULTIPLIER;
const scaledConcurrency = BASE_CONCURRENCY * SEED_MULTIPLIER;

/** Constantes públicas (SEED_GLOBAL_CONFIG) expuestas en smart-economat-backend (Nest). */
export const SEED_GLOBAL_CONFIG = {
  multiplier: SEED_MULTIPLIER,
  minRequests: scaledMinRequests,
  maxRequests: scaledMaxRequests,
  minProducts: scaledMinProducts,
  concurrency: readPositiveInt('SEED_CONCURRENCY', scaledConcurrency),
} as const;

/** Constantes públicas (ENDPOINT_BATCH_CONCURRENCY) expuestas en smart-economat-backend (Nest). */
export const ENDPOINT_BATCH_CONCURRENCY = readPositiveInt(
  'SEED_ENDPOINT_BATCH_CONCURRENCY',
  Math.max(1, Math.min(64, SEED_GLOBAL_CONFIG.concurrency))
);

/** Constantes públicas (SEED_PROFILE) expuestas en smart-economat-backend (Nest). */
export const SEED_PROFILE = 'unified';

/** Constantes públicas (DEFAULT_ADMIN_EMAIL) expuestas en smart-economat-backend (Nest). */
export const DEFAULT_ADMIN_EMAIL = 'admin@smarteconomat.com';
/** Constantes públicas (DEFAULT_SEED_PASSWORD) expuestas en smart-economat-backend (Nest). */
export const DEFAULT_SEED_PASSWORD = 'SmartEconomat2026!';
/** Constantes públicas (ALT_SEED_PASSWORD) expuestas en smart-economat-backend (Nest). */
export const ALT_SEED_PASSWORD = 'SmartEconomat2026!';

const defaultMinSuccessPerEndpoint = SEED_GLOBAL_CONFIG.minRequests;
const defaultMaxSuccessPerEndpoint = SEED_GLOBAL_CONFIG.maxRequests;

const configuredTargetSuccess = readPositiveInt(
  'SEED_TARGET_SUCCESS_PER_ENDPOINT',
  defaultMinSuccessPerEndpoint
);

const configuredMinSuccess = readPositiveInt(
  'SEED_MIN_SUCCESS_PER_ENDPOINT',
  defaultMinSuccessPerEndpoint
);

const configuredMaxSuccess = readPositiveInt(
  'SEED_MAX_SUCCESS_PER_ENDPOINT',
  defaultMaxSuccessPerEndpoint
);

/** Constantes públicas (MIN_SUCCESS_PER_ENDPOINT) expuestas en smart-economat-backend (Nest). */
export const MIN_SUCCESS_PER_ENDPOINT = Math.min(
  configuredMinSuccess,
  configuredMaxSuccess
);
/** Constantes públicas (MAX_SUCCESS_PER_ENDPOINT) expuestas en smart-economat-backend (Nest). */
export const MAX_SUCCESS_PER_ENDPOINT = Math.max(
  configuredMinSuccess,
  configuredMaxSuccess
);

/** Constantes públicas (DEFAULT_TARGET_SUCCESS_PER_ENDPOINT) expuestas en smart-economat-backend (Nest). */
export const DEFAULT_TARGET_SUCCESS_PER_ENDPOINT = Math.max(
  MIN_SUCCESS_PER_ENDPOINT,
  Math.min(MAX_SUCCESS_PER_ENDPOINT, configuredTargetSuccess)
);

/** Constantes públicas (MAX_ATTEMPTS_PER_ENDPOINT) expuestas en smart-economat-backend (Nest). */
export const MAX_ATTEMPTS_PER_ENDPOINT = readPositiveInt(
  'SEED_MAX_ATTEMPTS_PER_ENDPOINT',
  Math.max(150, MAX_SUCCESS_PER_ENDPOINT * 3)
);

/** Constantes públicas (SOFT_MAX_TOTAL_DURATION_MS) expuestas en smart-economat-backend (Nest). */
export const SOFT_MAX_TOTAL_DURATION_MS = readPositiveInt(
  'SEED_SOFT_MAX_DURATION_MS',
  1_200_000 * SEED_MULTIPLIER
);

/** Constantes públicas (HARD_MAX_TOTAL_DURATION_MS) expuestas en smart-economat-backend (Nest). */
export const HARD_MAX_TOTAL_DURATION_MS = readPositiveInt(
  'SEED_HARD_MAX_DURATION_MS',
  3_600_000 * SEED_MULTIPLIER
);

/** Constantes públicas (ADMIN_ROUTE_TARGET_PER_ENDPOINT) expuestas en smart-economat-backend (Nest). */
export const ADMIN_ROUTE_TARGET_PER_ENDPOINT = readPositiveInt(
  'SEED_ADMIN_TARGET_PER_ENDPOINT',
  DEFAULT_TARGET_SUCCESS_PER_ENDPOINT
);

/** Constantes públicas (MIN_REQUIRED_PRODUCT_IDS) expuestas en smart-economat-backend (Nest). */
export const MIN_REQUIRED_PRODUCT_IDS = readPositiveInt(
  'SEED_MIN_REQUIRED_PRODUCT_IDS',
  SEED_GLOBAL_CONFIG.minProducts
);

/**
 * Ejecuta la lógica de special target dentro del flujo de la aplicación.
 *
 * @param baseTarget Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
function specialTarget(baseTarget: number): number {
  return Math.max(
    MIN_SUCCESS_PER_ENDPOINT,
    Math.min(MAX_SUCCESS_PER_ENDPOINT, baseTarget * SEED_MULTIPLIER)
  );
}

/** Constantes públicas (SPECIAL_TARGETS) expuestas en smart-economat-backend (Nest). */
export const SPECIAL_TARGETS = new Map<string, number>([
  ['POST /productos', specialTarget(30)],
  ['POST /pedido/draft/finalize', 1],
  ['POST /pedidos', specialTarget(20)],
  ['POST /pedido-usuarios', specialTarget(20)],
  ['POST /purchase-batches', specialTarget(20)],
  ['POST /recepciones', specialTarget(20)],
  ['POST /incidencias', specialTarget(30)],
  ['DELETE /ubicaciones/:id', 0],
  ['DELETE /producto-alergenos/:idProducto/:alergeno', 5],
  ['DELETE /albaranes/:id', 3],
  ['DELETE /archivos/:id', 3],
  ['DELETE /productos/:id', 3],
  ['DELETE /proveedor/:id', 2],
  ['DELETE /preparaciones/:id', 2],
  ['DELETE /movimientos/:id', 2],
  ['DELETE /pedidos/:id', 2],
  ['DELETE /usuarios/:id', 2],
  ['DELETE /incidencias/:id', 2],
  ['DELETE /inventario/:id', 2],

  ['POST /inventario/transferencias', specialTarget(12)],
  ['DELETE /usuarios/:id/permisos-adicionales/:permisoId', 5],
  ['DELETE /usuarios/:id/permisos-excluidos/:permisoId', 5],
  ['POST /admin/profesores', ADMIN_ROUTE_TARGET_PER_ENDPOINT],
  ['PATCH /admin/users/:id/role', ADMIN_ROUTE_TARGET_PER_ENDPOINT],
]);

/** Constantes públicas (ADMIN_FOCUS_ENDPOINT_KEYS) expuestas en smart-economat-backend (Nest). */
export const ADMIN_FOCUS_ENDPOINT_KEYS = new Set<string>([
  'POST /admin/profesores',
  'PATCH /admin/users/:id/role',
]);

/** Constantes públicas (METHOD_PRIORITY) expuestas en smart-economat-backend (Nest). */
export const METHOD_PRIORITY: Record<HttpMethod, number> = {
  POST: 1,
  GET: 2,
  PATCH: 3,
  PUT: 4,
  DELETE: 5,
};

/** Constantes públicas (DOMAIN_ORDER) expuestas en smart-economat-backend (Nest). */
export const DOMAIN_ORDER = [
  '/admin',
  '/auth',
  '/usuarios',
  '/profesores',
  '/alumnos',
  '/proveedor',
  '/productos',
  '/producto-proveedor',
  '/producto-alergenos',
  '/historial-precio',
  '/ubicaciones',
  '/inventario',
  '/recetas',
  '/produccion',
  '/preparaciones',
  '/pedido',
  '/pedido-usuarios',
  '/purchase-batches',
  '/pedidos',
  '/recepcion',
  '/recepciones',
  '/recepcion-productos',
  '/distribuciones',
  '/albaranes',
  '/incidencias',
  '/incidencias-resueltas',
  '/movimientos',
  '/merma',
  '/dashboard',
  '/alertas',
  '/export',
  '/archivos',
];

/** Constantes públicas (PUBLIC_PATH_PREFIXES) expuestas en smart-economat-backend (Nest). */
export const PUBLIC_PATH_PREFIXES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/profesores/register',
  '/alumnos/register',
  '/alumnos/slots/',
  '/alumnos/aulas',
  '/alumnos/aulas/',
];

/** Constantes públicas (PAGINATED_PATHS) expuestas en smart-economat-backend (Nest). */
export const PAGINATED_PATHS = new Set<string>([
  '/usuarios',
  '/proveedor',
  '/productos',
  '/historial-precio',
  '/ubicaciones',
  '/inventario',
  '/pedido-usuarios',
  '/pedidos',
  '/recepciones',
  '/recepcion-productos',
  '/distribuciones',
  '/albaranes',
  '/incidencias',
  '/incidencias-resueltas',
  '/movimientos',
  '/recetas',
  '/preparaciones',
  '/merma',
  '/archivos',
]);

/** Constantes públicas (PRODUCT_UNITS) expuestas en smart-economat-backend (Nest). */
export const PRODUCT_UNITS = ['KG', 'G', 'L', 'ML', 'UNIDAD', 'PAQ'] as const;
/** Constantes públicas (PRODUCT_TYPES) expuestas en smart-economat-backend (Nest). */
export const PRODUCT_TYPES = [
  'verdura',
  'fruta',
  'carne',
  'pescado',
  'marisco',
  'lacteo',
  'huevo',
  'cereal',
  'legumbre',
  'fruto_seco',
  'condimento',
  'aceite',
  'azucar',
  'bebida',
  'elaborado',
  'otro',
] as const;
/** Constantes públicas (ALERGEN_VALUES) expuestas en smart-economat-backend (Nest). */
export const ALERGEN_VALUES = [
  'GLUTEN',
  'CRUSTACEOS',
  'HUEVOS',
  'PESCADO',
  'CACAHUETES',
  'SOJA',
  'LACTEOS',
  'FRUTOS_CON_CASCARA',
  'APIO',
  'MOSTAZA',
  'SESAMO',
  'SULFITO',
  'ALTRAMUCES',
  'MOLUSCOS',
] as const;
/** Constantes públicas (USER_ROLES) expuestas en smart-economat-backend (Nest). */
export const USER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'PROFESOR',
  'ALUMNO',
] as const;
/** Constantes públicas (USER_STATUSES) expuestas en smart-economat-backend (Nest). */
export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;
/** Constantes públicas (MOVIMIENTO_TYPES) expuestas en smart-economat-backend (Nest). */
export const MOVIMIENTO_TYPES = [
  'entrada',
  'salida',
  'ajuste',
  'pedido',
  'entrada_compra',
  'salida_elaboracion',
  'produccion_consumo',
  'produccion_resultado',
  'salida_ajuste',
  'merma',
] as const;
/** Constantes públicas (MOVIMIENTO_MANUAL_TYPES) expuestas en smart-economat-backend (Nest). */
export const MOVIMIENTO_MANUAL_TYPES = [
  'entrada',
  'ajuste',
  'salida_ajuste',
] as const;
/** Constantes públicas (RECETA_DIFICULTAD) expuestas en smart-economat-backend (Nest). */
export const RECETA_DIFICULTAD = ['Fácil', 'Media', 'Difícil'] as const;
/** Constantes públicas (RECETA_UNIDADES) expuestas en smart-economat-backend (Nest). */
export const RECETA_UNIDADES = [
  'g',
  'kg',
  'l',
  'ml',
  'pieza',
  'cda',
  'cdta',
] as const;
/** Constantes públicas (INCIDENCIA_TIPOS) expuestas en smart-economat-backend (Nest). */
export const INCIDENCIA_TIPOS = [
  'rotura',
  'caducado',
  'falta_producto',
  'exceso_producto',
  'otro',
] as const;
/** Estados de cabecera de incidencia (minúsculas). Alineados con `EstadoIncidencia` (ABIERTA, EN_PROCESO, RESUELTA). */
export const INCIDENCIA_ESTADOS = [
  'abierta',
  'en_proceso',
  'resuelta',
] as const;
/** Constantes públicas (RESOLUCION_TIPOS) expuestas en smart-economat-backend (Nest). */
export const RESOLUCION_TIPOS = [
  'aceptada',
  'rechazada',
  'parcial',
  'devolucion',
  'abono',
  'cambio',
] as const;
/** Constantes públicas (MERMA_MOTIVOS) expuestas en smart-economat-backend (Nest). */
export const MERMA_MOTIVOS = [
  'rotura',
  'deterioro',
  'hurto',
  'error_preparacion',
  'otros',
] as const;
/** Constantes públicas (RECEPCION_ESTADO_VISUAL) expuestas en smart-economat-backend (Nest). */
export const RECEPCION_ESTADO_VISUAL = [
  'OPTIMO',
  'ROTO',
  'DEFECTUOSO',
] as const;
/** Constantes públicas (RECEPCION_ESTADO_PRODUCTO) expuestas en smart-economat-backend (Nest). */
export const RECEPCION_ESTADO_PRODUCTO = [
  'PERFECTO',
  'ROTO',
  'FALTA_TOTAL',
  'EXCEDE',
] as const;
