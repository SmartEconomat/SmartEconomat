import { describe, expect, it } from 'vitest';
import es from '../../src/i18n/es.json';
import en from '../../src/i18n/en.json';
import tutorialEs from '../../src/i18n/locales/tutorial.es.json';
import tutorialEn from '../../src/i18n/locales/tutorial.en.json';

const esMerged = { ...es, ...tutorialEs } as Record<string, unknown>;
const enMerged = { ...en, ...tutorialEn } as Record<string, unknown>;

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

const flattenKeys = (input: JsonObject, prefix = ''): string[] => {
  const keys: string[] = [];

  Object.entries(input).forEach(([key, value]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as JsonObject, nextPrefix));
      return;
    }
    keys.push(nextPrefix);
  });

  return keys;
};

/**
 * Recorre el objeto JSON y devuelve un array de [ruta, valor] para cada string.
 * Detecta interpolaciones con llave simple {variable} que NO son {{variable}}.
 */
const findBrokenInterpolations = (
  obj: unknown,
  path = ''
): Array<{ path: string; value: string; matches: string[] }> => {
  if (typeof obj === 'string') {
    // Eliminar las llaves dobles primero para no tener falsos positivos
    const withoutDouble = obj.replace(/\{\{[^{}]+\}\}/g, '');
    const broken = withoutDouble.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g) ?? [];
    return broken.length > 0 ? [{ path, value: obj, matches: broken }] : [];
  }
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      findBrokenInterpolations(v, path ? `${path}.${k}` : k)
    );
  }
  return [];
};

/**
 * Extrae todos los nombres de interpolaciones {{var}} de un string.
 */
const extractInterpolationNames = (str: string): string[] => {
  const matches = str.match(/\{\{([^{}]+)\}\}/g) ?? [];
  return matches.map((m) => m.slice(2, -2).trim());
};

const flattenStrings = (
  input: JsonObject,
  prefix = ''
): Array<{ key: string; value: string }> => {
  const result: Array<{ key: string; value: string }> = [];
  Object.entries(input).forEach(([k, v]) => {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      result.push({ key: fullKey, value: v });
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      result.push(...flattenStrings(v as JsonObject, fullKey));
    }
  });
  return result;
};

describe('i18n parity', () => {
  it('keeps exact key symmetry between es and en', () => {
    const esKeys = flattenKeys(esMerged as JsonObject).sort();
    const enKeys = flattenKeys(enMerged as JsonObject).sort();

    expect(esKeys).toEqual(enKeys);
  });
});

describe('i18n - interpolaciones correctas', () => {
  it('no debe haber interpolaciones con llave simple {variable} en es.json', () => {
    const broken = findBrokenInterpolations(es);
    const report = broken.map(
      (b) => `  ${b.path}: "${b.value}" → ${b.matches.join(', ')}`
    );
    expect(
      broken,
      `Interpolaciones rotas en es.json:\n${report.join('\n')}`
    ).toHaveLength(0);
  });

  it('no debe haber interpolaciones con llave simple {variable} en en.json', () => {
    const broken = findBrokenInterpolations(en);
    const report = broken.map(
      (b) => `  ${b.path}: "${b.value}" → ${b.matches.join(', ')}`
    );
    expect(
      broken,
      `Interpolaciones rotas en en.json:\n${report.join('\n')}`
    ).toHaveLength(0);
  });

  it('las claves con {{...}} deben tener las mismas interpolaciones en es y en', () => {
    const esStrings = flattenStrings(es as unknown as JsonObject);
    const enStrings = flattenStrings(en as unknown as JsonObject);
    const enMap = new Map(enStrings.map((e) => [e.key, e.value]));

    const mismatches: string[] = [];

    esStrings.forEach(({ key, value: esValue }) => {
      const enValue = enMap.get(key);
      if (!enValue) return;

      const esInterps = new Set(extractInterpolationNames(esValue));
      const enInterps = new Set(extractInterpolationNames(enValue));

      if (esInterps.size === 0 && enInterps.size === 0) return;

      const onlyInEs = [...esInterps].filter((n) => !enInterps.has(n));
      const onlyInEn = [...enInterps].filter((n) => !esInterps.has(n));

      if (onlyInEs.length > 0 || onlyInEn.length > 0) {
        mismatches.push(
          `  ${key}: solo en es=[${onlyInEs.join(',')}] solo en en=[${onlyInEn.join(',')}]`
        );
      }
    });

    expect(
      mismatches,
      `Interpolaciones asimétricas entre es y en:\n${mismatches.join('\n')}`
    ).toHaveLength(0);
  });
});
