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

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2';
const OFF_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'User-Agent': 'SmartEconomat/1.0 (https://github.com/SmartEconomat)',
};
const OFF_FIELDS =
  'product_name,product_name_es,product_name_en,brands,generic_name,generic_name_es,quantity,allergens_tags,image_front_url,image_url';

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

function parseOFFProduct(p: Record<string, unknown>): OFFProduct | null {
  const name = (
    (p['product_name_es'] as string) ||
    (p['product_name'] as string) ||
    (p['product_name_en'] as string) ||
    ''
  ).trim();
  if (!name) return null;

  let quantity: number | undefined;
  let uom: string | undefined;
  const quantityStr = p['quantity'] as string | undefined;
  if (quantityStr) {
    const match = quantityStr.trim().match(/^([\d.,]+)\s*([a-zA-Z]+)$/);
    if (match) {
      quantity = parseFloat(match[1].replace(',', '.'));
      uom = UOM_MAP[match[2].toLowerCase()];
    }
  }

  const descriptionRaw = (
    (p['generic_name_es'] as string) ||
    (p['generic_name'] as string) ||
    ''
  ).trim();

  return {
    name,
    brand: p['brands']
      ? (p['brands'] as string).split(',')[0].trim()
      : undefined,
    description: descriptionRaw || undefined,
    uom,
    quantity,
    allergens: normalizeOFFAllergens(
      (p['allergens_tags'] as string[] | undefined) ?? []
    ),
    imageUrl:
      (p['image_front_url'] as string) ||
      (p['image_url'] as string) ||
      undefined,
  };
}

export async function searchByBarcode(
  code: string
): Promise<OFFProduct | null> {
  if (!code.trim()) return null;
  try {
    const response = await fetch(
      `${OFF_BASE}/product/${encodeURIComponent(code.trim())}?fields=${OFF_FIELDS}`,
      { method: 'GET', headers: OFF_HEADERS }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;
    return parseOFFProduct(data.product as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function searchByName(name: string): Promise<OFFProduct[]> {
  if (!name.trim()) return [];
  try {
    const response = await fetch(
      `${OFF_BASE}/search?search_terms=${encodeURIComponent(name.trim())}&json=1&fields=${OFF_FIELDS}&page_size=10`,
      { method: 'GET', headers: OFF_HEADERS }
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data.products)) return [];
    return (data.products as Record<string, unknown>[])
      .map(parseOFFProduct)
      .filter((p): p is OFFProduct => p !== null);
  } catch {
    return [];
  }
}
