import { TFunction } from 'i18next';

const humanizeEnumValue = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeEnumValue = (value: string): string =>
  value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .toUpperCase();

const enumDomainAlias: Record<string, string> = {
  pedidoEstado: 'pedidoEstado',
  pedidoUsuarioEstado: 'pedidoUsuarioEstado',
  loteEstado: 'loteEstado',
  recepcionEstado: 'recepcionEstado',
  incidenciaEstado: 'incidenciaEstado',
  tipoDiferencia: 'tipoDiferencia',
  estadoReclamacion: 'estadoReclamacion',
  movimientoTipo: 'movimientoTipo',
  mermaMotivo: 'mermaMotivo',
  rolUsuario: 'rolUsuario',
  productoCategoria: 'productoCategoria',
  recetaDificultad: 'recetaDificultad',
  recetaTiempo: 'recetaTiempo',
  recetaUnidad: 'recetaUnidad',
  alergeno: 'alergeno',
};

/**
 * Obtiene valores o vistas materializadas.
 * @undefined {TFunction<"translation", undefined>} t - Entrada efectiva esperada por el contrato.
 * @undefined {string} domain - Entrada efectiva esperada por el contrato.
 * @undefined {string | null | undefined} rawValue - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export const getEnumLabel = (
  t: TFunction,
  domain: keyof typeof enumDomainAlias,
  rawValue?: string | null
): string => {
  if (!rawValue) return '—';
  const normalizedValue = normalizeEnumValue(rawValue);
  const key = `enum.${enumDomainAlias[domain]}.${normalizedValue}`;
  const fallback = humanizeEnumValue(rawValue);
  const translated = t(key, { defaultValue: fallback });

  // En algunos fallbacks de i18n el defaultValue se ignora y vuelve la key literal.
  if (translated === key) {
    return fallback;
  }

  return translated;
};
