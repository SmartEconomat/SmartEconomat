/** Catálogo de valores enumerados (UnidadIngrediente) dentro de smart-economat-backend (Nest). */
export enum UnidadIngrediente {
  GRAMO = 'g',
  KILOGRAMO = 'kg',
  LITRO = 'l',
  MILILITRO = 'ml',
  PIEZA = 'pieza',
  CUCHARADA = 'cda',
  CUCHARADITA = 'cdta',
}

/** Catálogo de valores enumerados (DificultadReceta) dentro de smart-economat-backend (Nest). */
export enum DificultadReceta {
  FACIL = 'Fácil',
  MEDIA = 'Media',
  DIFICIL = 'Difícil',
}

/** Catálogo de valores enumerados (TiempoReceta) dentro de smart-economat-backend (Nest). */
export enum TiempoReceta {
  MIN_10 = '10 min',
  MIN_15 = '15 min',
  MIN_20 = '20 min',
  MIN_25 = '25 min',
  MIN_30 = '30 min',
  MIN_40 = '40 min',
  MIN_45 = '45 min',
  MIN_50 = '50 min',
  MIN_60 = '60 min',
  MIN_75 = '75 min',
  MIN_90 = '90 min',
  MIN_120 = '120 min',
}

/** Constantes públicas (TIEMPO_RECETA_VALUES) expuestas en smart-economat-backend (Nest). */
export const TIEMPO_RECETA_VALUES = [
  TiempoReceta.MIN_10,
  TiempoReceta.MIN_15,
  TiempoReceta.MIN_20,
  TiempoReceta.MIN_25,
  TiempoReceta.MIN_30,
  TiempoReceta.MIN_40,
  TiempoReceta.MIN_45,
  TiempoReceta.MIN_50,
  TiempoReceta.MIN_60,
  TiempoReceta.MIN_75,
  TiempoReceta.MIN_90,
  TiempoReceta.MIN_120,
] as const satisfies readonly TiempoReceta[];

const TIEMPO_RECETA_MINUTOS: Readonly<Record<TiempoReceta, number>> = {
  [TiempoReceta.MIN_10]: 10,
  [TiempoReceta.MIN_15]: 15,
  [TiempoReceta.MIN_20]: 20,
  [TiempoReceta.MIN_25]: 25,
  [TiempoReceta.MIN_30]: 30,
  [TiempoReceta.MIN_40]: 40,
  [TiempoReceta.MIN_45]: 45,
  [TiempoReceta.MIN_50]: 50,
  [TiempoReceta.MIN_60]: 60,
  [TiempoReceta.MIN_75]: 75,
  [TiempoReceta.MIN_90]: 90,
  [TiempoReceta.MIN_120]: 120,
};

/**
 * Obtiene valores o vistas materializadas.
 * @undefined {TiempoReceta} tiempoReceta - Entrada efectiva esperada por el contrato.
 * @undefined {number} Datos efectivos después de ejecutar la operación.
 */
export function getTiempoRecetaMinutos(tiempoReceta: TiempoReceta): number {
  return TIEMPO_RECETA_MINUTOS[tiempoReceta];
}

/** Catálogo de valores enumerados (EstadoLote) dentro de smart-economat-backend (Nest). */
export enum EstadoLote {
  DISPONIBLE = 'disponible',
  AGOTADO = 'agotado',
  CANCELADO = 'cancelado',
}
