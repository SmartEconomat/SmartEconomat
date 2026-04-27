import { TFunction } from 'i18next';

const humanizeEnumValue = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeEnumValue = (value: string): string =>
  value.trim().replace(/\s+/g, '_').toUpperCase();

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

export const getEnumLabel = (
  t: TFunction,
  domain: keyof typeof enumDomainAlias,
  rawValue?: string | null
): string => {
  if (!rawValue) return '—';
  const normalizedValue = normalizeEnumValue(rawValue);
  const key = `enum.${enumDomainAlias[domain]}.${normalizedValue}`;
  return t(key, { defaultValue: humanizeEnumValue(rawValue) });
};
