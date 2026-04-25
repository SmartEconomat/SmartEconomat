import { baseFetch, parseApiResponse } from './api.service';

export interface OFFProduct {
  name: string;
  brand?: string;
  description?: string;
  uom?: string;
  quantity?: number;
  allergens?: string[];
  imageUrl?: string;
}

const ALLERGEN_MAP: Record<string, string> = {
  'en:gluten': 'GLUTEN',
  'en:wheat': 'GLUTEN',
  'en:crustaceans': 'CRUSTACEOS',
  'en:eggs': 'HUEVOS',
  'en:fish': 'PESCADO',
  'en:peanuts': 'CACAHUETES',
  'en:soybeans': 'SOJA',
  'en:milk': 'LACTEOS',
  'en:dairy': 'LACTEOS',
  'en:nuts': 'FRUTOS_CON_CASCARA',
  'en:almonds': 'FRUTOS_CON_CASCARA',
  'en:hazelnuts': 'FRUTOS_CON_CASCARA',
  'en:walnuts': 'FRUTOS_CON_CASCARA',
  'en:cashews': 'FRUTOS_CON_CASCARA',
  'en:pistachios': 'FRUTOS_CON_CASCARA',
  'en:celery': 'APIO',
  'en:mustard': 'MOSTAZA',
  'en:sesame-seeds': 'SESAMO',
  'en:sesame': 'SESAMO',
  'en:sulphur-dioxide-and-sulphites': 'SULFITO',
  'en:sulphites': 'SULFITO',
  'en:sulfites': 'SULFITO',
  'en:lupin': 'ALTRAMUCES',
  'en:molluscs': 'MOLUSCOS',
  'en:mollusks': 'MOLUSCOS',
};

const EU_ALLERGEN_IDS = new Set([
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
]);

/**
 * @description Normalizes raw OpenFoodFacts allergen tags to EU-standard allergen identifiers.
 * @param {string[]} tags - Raw allergen tag strings from the OpenFoodFacts API.
 * @returns {string[]} Deduplicated list of EU allergen IDs (e.g. 'GLUTEN', 'LACTEOS').
 * @example
 * normalizeOFFAllergens(['en:gluten', 'en:milk']); // ['GLUTEN', 'LACTEOS']
 */
export function normalizeOFFAllergens(tags: string[]): string[] {
  const result = new Set<string>();
  for (const tag of tags) {
    const mapped = ALLERGEN_MAP[tag.toLowerCase()];
    if (mapped && EU_ALLERGEN_IDS.has(mapped)) {
      result.add(mapped);
    }
  }
  return Array.from(result);
}

/**
 * @description Looks up a product in the OpenFoodFacts database by its barcode.
 * @param {string} code - The EAN/UPC barcode string.
 * @returns {Promise<OFFProduct | null>} Product data if found, or `null` on failure or not-found.
 * @example
 * const product = await searchByBarcode('8410000');
 */
export async function searchByBarcode(
  code: string
): Promise<OFFProduct | null> {
  const trimmedCode = code.trim();
  if (!trimmedCode) return null;

  try {
    const response = await baseFetch(
      `/openfoodfacts/producto/${encodeURIComponent(trimmedCode)}`
    );

    const payload = await parseApiResponse<OFFProduct | null>(
      response,
      'No se pudo consultar OpenFoodFacts'
    );

    return payload.data ?? null;
  } catch {
    return null;
  }
}

/**
 * @description Searches the OpenFoodFacts database by product name.
 * @param {string} name - The product name to search.
 * @returns {Promise<OFFProduct[]>} Matching products, or an empty array on failure.
 * @example
 * const results = await searchByName('leche entera');
 */
export async function searchByName(name: string): Promise<OFFProduct[]> {
  const trimmedName = name.trim();
  if (!trimmedName) return [];

  try {
    const response = await baseFetch(
      `/openfoodfacts/buscar?nombre=${encodeURIComponent(trimmedName)}`
    );

    const payload = await parseApiResponse<OFFProduct[]>(
      response,
      'No se pudo consultar OpenFoodFacts'
    );

    return Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return [];
  }
}
