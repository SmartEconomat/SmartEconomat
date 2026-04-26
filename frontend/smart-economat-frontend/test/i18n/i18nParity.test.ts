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

describe('i18n parity', () => {
  it('keeps exact key symmetry between es and en', () => {
    const esKeys = flattenKeys(esMerged as JsonObject).sort();
    const enKeys = flattenKeys(enMerged as JsonObject).sort();

    expect(esKeys).toEqual(enKeys);
  });
});
