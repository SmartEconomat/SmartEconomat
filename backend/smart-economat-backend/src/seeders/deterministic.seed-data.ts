import { createHash } from 'node:crypto';

export const SEED_REFERENCE_DATE = new Date('2026-01-05T08:00:00.000Z');

export type DeterministicProviderProfile = {
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  nif: string;
};

export const DETERMINISTIC_PROVIDER_PROFILES: readonly DeterministicProviderProfile[] =
  [
    {
      nombre: 'Mercadona Proveedores',
      contacto: 'Laura Gomez',
      telefono: '+34961100001',
      email: 'compras.mercadona@proveedores.local',
      direccion: 'Poligono Fuente del Jarro, Paterna, Valencia',
      nif: 'B10000001',
    },
    {
      nombre: 'Makro Foodservice Espana',
      contacto: 'Javier Ruiz',
      telefono: '+34916100002',
      email: 'foodservice.makro@proveedores.local',
      direccion: 'Paseo Imperial 40, Madrid',
      nif: 'B10000002',
    },
    {
      nombre: 'Carrefour Pro',
      contacto: 'Marta Lopez',
      telefono: '+34933100003',
      email: 'canal.pro.carrefour@proveedores.local',
      direccion: 'Avenida Diagonal 662, Barcelona',
      nif: 'B10000003',
    },
    {
      nombre: 'Eroski Hosteleria',
      contacto: 'Ines Martin',
      telefono: '+34944100004',
      email: 'hosteleria.eroski@proveedores.local',
      direccion: 'Barrio San Agustin, Elorrio, Bizkaia',
      nif: 'B10000004',
    },
    {
      nombre: 'Transgourmet Iberica',
      contacto: 'Sergio Navarro',
      telefono: '+34972100005',
      email: 'transgourmet.iberica@proveedores.local',
      direccion: 'Carretera de Roses, Vilamalla, Girona',
      nif: 'B10000005',
    },
    {
      nombre: 'Alcampo Distribucion',
      contacto: 'Paula Ortega',
      telefono: '+34915100006',
      email: 'alcampo.distribucion@proveedores.local',
      direccion: 'Avenida de Europa 18, Alcobendas, Madrid',
      nif: 'B10000006',
    },
    {
      nombre: 'Bidfood Spain',
      contacto: 'Daniel Perez',
      telefono: '+34961100007',
      email: 'bidfood.spain@proveedores.local',
      direccion: 'Calle de la Industria 7, Valencia',
      nif: 'B10000007',
    },
    {
      nombre: 'Frutas y Verduras Levante',
      contacto: 'Ana Torres',
      telefono: '+34962100008',
      email: 'levante.frutas@proveedores.local',
      direccion: 'Mercavalencia, Valencia',
      nif: 'B10000008',
    },
    {
      nombre: 'Pescados del Norte',
      contacto: 'Ruben Alonso',
      telefono: '+34944100009',
      email: 'pescados.norte@proveedores.local',
      direccion: 'Puerto Pesquero, Bermeo, Bizkaia',
      nif: 'B10000009',
    },
    {
      nombre: 'Carnicas Sierra Iberica',
      contacto: 'Nerea Gil',
      telefono: '+34923100010',
      email: 'carnicas.sierra@proveedores.local',
      direccion: 'Poligono Los Villares, Salamanca',
      nif: 'B10000010',
    },
    {
      nombre: 'Lacteos del Cantabrico',
      contacto: 'Alberto Ramos',
      telefono: '+34942100011',
      email: 'lacteos.cantabrico@proveedores.local',
      direccion: 'Avenida de Cantabria 12, Santander',
      nif: 'B10000011',
    },
    {
      nombre: 'Huerta del Sur',
      contacto: 'Cristina Moya',
      telefono: '+34955100012',
      email: 'huerta.sur@proveedores.local',
      direccion: 'Carretera de Utrera km 3, Sevilla',
      nif: 'B10000012',
    },
  ] as const;

export const DETERMINISTIC_PERSON_NAMES: readonly string[] = [
  'Ana Romero',
  'Luis Martinez',
  'Sonia Castillo',
  'Raul Medina',
  'Marta Leon',
  'David Serrano',
  'Elena Rivas',
  'Victor Prieto',
  'Patricia Campos',
  'Diego Gallego',
  'Noelia Santos',
  'Adrian Fuentes',
] as const;

export const DETERMINISTIC_SHORT_NOTES: readonly string[] = [
  'Revision operativa semanal del economato.',
  'Ajuste de stock segun consumo real de cocina.',
  'Pedido alineado con plan de menu mensual.',
  'Recepcion verificada por responsable de turno.',
  'Incidencia documentada para seguimiento con proveedor.',
  'Produccion planificada para servicio de mediodia.',
  'Validacion de cantidades realizada antes de cierre.',
  'Actualizacion administrativa de registro operativo.',
] as const;

export const DETERMINISTIC_LONG_NOTES: readonly string[] = [
  'Se registra la operacion con datos contrastados y trazabilidad completa para auditoria interna del centro.',
  'La entrada se documenta con criterios de seguridad alimentaria y control de costes para el periodo semanal.',
  'Los valores quedan validados por el equipo de gestion con seguimiento de merma y reposicion en cocina.',
  'Se consolida la informacion del proceso para asegurar coherencia entre pedido, recepcion e inventario.',
] as const;

function stableHash(raw: string): number {
  const hex = createHash('sha256').update(raw).digest('hex').slice(0, 12);
  return Number.parseInt(hex, 16);
}

export function deterministicIndex(
  length: number,
  iteration: number,
  salt = ''
): number {
  if (length <= 0) {
    return 0;
  }

  const base = stableHash(`${salt}:${iteration}`);
  return Math.abs(base) % length;
}

export function pickDeterministic<T>(
  values: readonly T[],
  iteration: number,
  salt = ''
): T {
  if (values.length === 0) {
    throw new Error('[seed-deterministic] Lista vacia en pickDeterministic');
  }

  return values[deterministicIndex(values.length, iteration, salt)];
}

export function deterministicInt(
  min: number,
  max: number,
  iteration: number,
  salt = ''
): number {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const span = safeMax - safeMin + 1;
  const idx = deterministicIndex(span, iteration, salt);
  return safeMin + idx;
}

export function deterministicFloat(
  min: number,
  max: number,
  fractionDigits: number,
  iteration: number,
  salt = ''
): number {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const raw = deterministicInt(0, 10_000, iteration, salt) / 10_000;
  const value = safeMin + (safeMax - safeMin) * raw;
  return Number(value.toFixed(Math.max(0, fractionDigits)));
}

export function deterministicBool(iteration: number, salt = ''): boolean {
  return deterministicInt(0, 1, iteration, salt) === 1;
}

export function seedDateIso(daysOffset: number, minutesOffset = 0): string {
  const ms =
    SEED_REFERENCE_DATE.getTime() +
    daysOffset * 24 * 60 * 60 * 1000 +
    minutesOffset * 60 * 1000;

  return new Date(ms).toISOString();
}

export function seedDateFromIteration(
  iteration: number,
  dayModulo = 180,
  salt = ''
): string {
  const days = deterministicInt(0, Math.max(0, dayModulo), iteration, salt);
  return seedDateIso(days);
}

export function deterministicToken(
  prefix: string,
  iteration: number,
  salt = ''
): string {
  const hash = createHash('sha256')
    .update(`${prefix}:${salt}:${iteration}`)
    .digest('hex')
    .slice(0, 12);
  return `${prefix}_${hash}`;
}

export function deterministicCode(
  prefix: string,
  iteration: number,
  width = 4,
  salt = ''
): string {
  const seq = deterministicInt(0, 10 ** Math.min(width, 8) - 1, iteration, salt)
    .toString()
    .padStart(width, '0');
  return `${prefix}${seq}`;
}

export function buildSeedRunTag(multiplier: number): string {
  return `seed-m${String(Math.max(1, multiplier)).padStart(2, '0')}`;
}

export function buildSeedSuffix(
  runTag: string,
  iteration: number,
  uniqueCursor: number
): string {
  return `${runTag}_${String(iteration).padStart(4, '0')}_${String(uniqueCursor).padStart(5, '0')}`;
}
