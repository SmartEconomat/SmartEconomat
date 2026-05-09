import { parseLocalizedNumber } from '../../utils/numberUtils';

/** Constantes públicas (RECETA_TIEMPO_MINIMO_MINUTOS) expuestas en smart-economat-frontend (SPA). */
export const RECETA_TIEMPO_MINIMO_MINUTOS = 10;
/** Constantes públicas (RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS) expuestas en smart-economat-frontend (SPA). */
export const RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS = 60;

/** Alias público (RecetaTiempoFiltro) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type RecetaTiempoFiltro = 'all' | 'rapidas' | 'medias' | 'largas';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * Normaliza un valor de tiempo de receta a minutos enteros válidos.
 *
 * Acepta entradas localizadas (por ejemplo con coma decimal), redondea al
 * minuto más cercano y descarta valores no finitos o por debajo del mínimo
 * funcional permitido para filtros y formularios.
 *
 * @param value Valor bruto introducido por UI o recibido de una capa externa.
 * @returns Minutos normalizados o `null` cuando el dato no es utilizable.
 */
export function normalizeRecetaTiempoMinutos(value: unknown): number | null {
  const parsed = parseLocalizedNumber(
    value as string | number | null | undefined
  );

  if (parsed == null) {
    return null;
  }

  const rounded = Math.round(parsed);

  if (!Number.isFinite(rounded) || rounded < RECETA_TIEMPO_MINIMO_MINUTOS) {
    return null;
  }

  return rounded;
}

/**
 * Parsea y valida el tiempo de receta obligatorio para operaciones de guardado.
 *
 * @param value Valor bruto de tiempo en minutos.
 * @param t Función de traducción para localizar el mensaje de error.
 * @returns Tiempo válido en minutos.
 * @throws Error Cuando el tiempo no cumple el mínimo o no es interpretable.
 */
export function parseRequiredRecetaTiempoMinutos(
  value: unknown,
  t: TranslateFn = (key) => key
): number {
  const minutes = normalizeRecetaTiempoMinutos(value);

  if (minutes == null) {
    throw new Error(t('recipes.errors.tiempoInvalido'));
  }

  return minutes;
}

/**
 * Construye la etiqueta internacionalizada de tiempo para mostrar en UI.
 *
 * @param minutes Tiempo total en minutos.
 * @param t Traductor i18n para resolver claves de texto.
 * @returns Texto de tiempo en formato corto o etiqueta `60+` para valores altos.
 */
export function getRecetaTiempoLabel(minutes: number, t: TranslateFn): string {
  if (minutes >= RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS) {
    return t('recipes.tiempoMinutos60Plus', {
      count: RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS,
    });
  }

  return t('recipes.tiempoMinutos', { count: minutes });
}

/**
 * Obtiene la etiqueta de franja temporal (rápida, media o larga) de una receta.
 *
 * @param minutes Tiempo total de elaboración en minutos.
 * @param t Traductor i18n para resolver la etiqueta de franja.
 * @returns Clave traducida de la franja temporal correspondiente.
 */
export function getRecetaTiempoFranjaLabel(
  minutes: number,
  t: TranslateFn
): string {
  if (minutes >= RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS) {
    return t('recipes.franjaLarga');
  }

  if (minutes >= 30) {
    return t('recipes.franjaMedia');
  }

  return t('recipes.franjaRapida');
}

/**
 * Traduce un filtro de franja temporal a límites numéricos de consulta.
 *
 * @param filter Filtro activo seleccionado por el usuario.
 * @returns Rango de minutos a aplicar en llamadas de listado; vacío para `all`.
 */
export function getRecetaTiempoFilterRange(filter: RecetaTiempoFiltro): {
  minTiempoMinutos?: number;
  maxTiempoMinutos?: number;
} {
  switch (filter) {
    case 'rapidas':
      return {
        minTiempoMinutos: RECETA_TIEMPO_MINIMO_MINUTOS,
        maxTiempoMinutos: 29,
      };
    case 'medias':
      return {
        minTiempoMinutos: 30,
        maxTiempoMinutos: RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS - 1,
      };
    case 'largas':
      return {
        minTiempoMinutos: RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS,
      };
    default:
      return {};
  }
}
