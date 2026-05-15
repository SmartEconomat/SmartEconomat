import type { TFunction } from 'i18next';
import { getEnumLabel } from '../../i18n/enumPresentation';

const capitalize = (text: string) => {
  if (!text) return '';
  const spacedText = text.replace(/[_]/g, ' ');
  return spacedText.charAt(0).toUpperCase() + spacedText.slice(1);
};

/**
 * Etiqueta legible para `dificultad` de receta en UI fuera de StatusChip
 * (p. ej. carrusel): evita mostrar keys i18n crudas tipo `pdf.receta.dificultad`.
 */
export function resolveRecetaDificultadLabel(
  dificultad: string | undefined | null,
  t: TFunction
): string {
  if (!dificultad) return '';
  const s = String(dificultad).trim();
  if (!s) return '';

  if (s.includes('.')) {
    const fallback = capitalize(s.split('.').pop() || s);
    const translated = t(s, { defaultValue: fallback });
    return translated === s ? fallback : translated;
  }

  return getEnumLabel(t, 'recetaDificultad', s);
}
