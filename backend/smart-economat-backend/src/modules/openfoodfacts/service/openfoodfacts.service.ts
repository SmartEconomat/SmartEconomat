import { Injectable } from '@nestjs/common';
import { OffProductResponseDto } from '../dto/off-product-response.dto';

interface OpenFoodFactsApiProduct {
  product_name?: string;
  product_name_es?: string;
  product_name_en?: string;
  brands?: string;
  generic_name?: string;
  generic_name_es?: string;
  quantity?: string;
  allergens_tags?: unknown;
  image_front_url?: string;
  image_url?: string;
}

interface OpenFoodFactsBarcodeResponse {
  status?: number;
  product?: OpenFoodFactsApiProduct;
}

interface OpenFoodFactsSearchResponse {
  products?: OpenFoodFactsApiProduct[];
}

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2';
const OFF_FIELDS =
  'product_name,product_name_es,product_name_en,brands,generic_name,generic_name_es,quantity,allergens_tags,image_front_url,image_url';
const OFF_SEARCH_PAGE_SIZE = 10;
const OFF_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'SmartEconomat/1.0 (+https://github.com/SmartEconomat)',
};

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

const UOM_MAP: Record<string, string> = {
  kg: 'KG',
  g: 'G',
  gr: 'G',
  grs: 'G',
  l: 'L',
  lt: 'L',
  ltr: 'L',
  ml: 'ML',
  cl: 'ML',
};

let openFoodFactsRateLimiter: Promise<void> = Promise.resolve();
let openFoodFactsNextRequestAt = 0;

/**
 * Documentación en español.
 */
function getOpenFoodFactsRequestDelayMs(): number {
  const rawValue =
    process.env.OPEN_FOOD_FACTS_PROXY_REQUEST_DELAY_MS ||
    process.env.OPEN_FOOD_FACTS_REQUEST_DELAY_MS ||
    '250';

  return Math.max(0, Number.parseInt(rawValue, 10) || 250);
}

/**
 * Documentación en español.
 */
function getOpenFoodFactsTimeoutMs(): number {
  const rawValue =
    process.env.OPEN_FOOD_FACTS_PROXY_TIMEOUT_MS ||
    process.env.OPEN_FOOD_FACTS_TIMEOUT_MS ||
    '8000';

  return Math.max(2000, Number.parseInt(rawValue, 10) || 8000);
}

/**
 * Documentación en español.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Documentación en español.
 */
async function waitForOpenFoodFactsSlot(): Promise<void> {
  const pending = openFoodFactsRateLimiter.then(async () => {
    const waitMs = Math.max(0, openFoodFactsNextRequestAt - Date.now());
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    openFoodFactsNextRequestAt = Date.now() + getOpenFoodFactsRequestDelayMs();
  });

  openFoodFactsRateLimiter = pending.catch(() => undefined);
  await pending;
}

/**
 * Documentación en español.
 */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

/**
 * Documentación en español.
 */
function normalizeOFFAllergens(tags: string[]): string[] {
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
 * Documentación en español.
 */
function parseOFFProduct(
  product: OpenFoodFactsApiProduct | undefined
): OffProductResponseDto | null {
  if (!product) {
    return null;
  }

  const name = (
    product.product_name_es ||
    product.product_name ||
    product.product_name_en ||
    ''
  ).trim();

  if (!name) {
    return null;
  }

  let quantity: number | undefined;
  let uom: string | undefined;
  const quantityStr = product.quantity;

  if (quantityStr) {
    const match = quantityStr.trim().match(/^([\d.,]+)\s*([a-zA-Z]+)$/);
    if (match) {
      quantity = Number.parseFloat(match[1].replace(',', '.'));
      uom = UOM_MAP[match[2].toLowerCase()];
    }
  }

  const descriptionRaw = (
    product.generic_name_es ||
    product.generic_name ||
    ''
  ).trim();

  return {
    name,
    brand: product.brands
      ? product.brands.split(',')[0].trim() || undefined
      : undefined,
    description: descriptionRaw || undefined,
    uom,
    quantity,
    allergens: normalizeOFFAllergens(toStringArray(product.allergens_tags)),
    imageUrl: product.image_front_url || product.image_url || undefined,
  };
}

/**
 * Documentación en español.
 */
@Injectable()
export class OpenFoodFactsService {
        /**
     * Documentación en español.
     */
  private async fetchOpenFoodFactsJson<T>(path: string): Promise<T | null> {
    await waitForOpenFoodFactsSlot();

    const response = await fetch(`${OFF_BASE}${path}`, {
      method: 'GET',
      headers: OFF_HEADERS,
      signal: AbortSignal.timeout(getOpenFoodFactsTimeoutMs()),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  }

        /**
     * Documentación en español.
     */
  async searchByBarcode(code: string): Promise<OffProductResponseDto | null> {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      return null;
    }

    try {
      const data =
        await this.fetchOpenFoodFactsJson<OpenFoodFactsBarcodeResponse>(
          `/product/${encodeURIComponent(trimmedCode)}?fields=${OFF_FIELDS}`
        );

      if (!data || data.status !== 1) {
        return null;
      }

      return parseOFFProduct(data.product);
    } catch {
      return null;
    }
  }

        /**
     * Documentación en español.
     */
  async searchByName(name: string): Promise<OffProductResponseDto[]> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return [];
    }

    try {
      const data =
        await this.fetchOpenFoodFactsJson<OpenFoodFactsSearchResponse>(
          `/search?search_terms=${encodeURIComponent(trimmedName)}&json=1&fields=${OFF_FIELDS}&page_size=${OFF_SEARCH_PAGE_SIZE}`
        );

      if (!data || !Array.isArray(data.products)) {
        return [];
      }

      return data.products
        .map((product) => parseOFFProduct(product))
        .filter(
          (product): product is OffProductResponseDto => product !== null
        );
    } catch {
      return [];
    }
  }
}
