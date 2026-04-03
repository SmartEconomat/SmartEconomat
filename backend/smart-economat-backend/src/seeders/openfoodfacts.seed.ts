import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SeedContext } from './seed-context';
import {
  Alergeno,
  TipoProducto,
  UnidadMedida,
} from '../modules/producto/enums/producto.enums';

export interface OffProduct {
  product_name_es?: string;
  product_name?: string;
  generic_name?: string;
  quantity?: string;
  brands?: string;
  brands_tags?: string[];
  ingredients_text?: string;
  categories_tags?: string[];
  image_url?: string;
  code?: string;
  allergens_tags?: string[];
  seedImageUrl?: string;
  seedImageOptimizedUrl?: string;
  seedArchivoId?: string;
  seedUnidad?: UnidadMedida;
  seedContenido?: number;
  seedTipo?: TipoProducto;
  seedAlergenos?: Alergeno[];
}

export interface SeedUploadedImageRef {
  key: string;
  sourceUrl: string;
  url: string;
  urlOptimized?: string;
  archivoId?: string;
}

export interface CreateProductoPayloadFromOff {
  [key: string]: unknown;
  nombre: string;
  marca?: string;
  descripcion?: string;
  unidad: UnidadMedida;
  tipo?: TipoProducto;
  contenido: number;
  codigoBarras: string;
  pathImg?: string;
  alergenos?: Alergeno[];
  proveedores?: Array<{
    proveedorId: string;
    precioUnitario: number;
    marcaEspecifica?: string;
    codigoBarras?: string;
  }>;
}

type SeedCatalogProducto = {
  nombre?: unknown;
  marca?: unknown;
  descripcion?: unknown;
  unidad?: unknown;
  tipo?: unknown;
  codigoBarras?: unknown;
  contenido?: unknown;
  alergenos?: unknown;
  pathImg?: unknown;
};

type SeedCatalogFile = {
  productos?: SeedCatalogProducto[];
};

const OPEN_FOOD_FACTS_MAX_PAGE_SIZE = 50;
const OPEN_FOOD_FACTS_IMAGE_TIMEOUT_MS = Math.max(
  2000,
  Number.parseInt(
    process.env.OPEN_FOOD_FACTS_IMAGE_TIMEOUT_MS || '20000',
    10
  ) || 20000
);
const LOCAL_SEED_PRODUCTS_FILE = resolve(
  process.cwd(),
  'src/seeders/datos-base-economato/catalogo.productos-normalizados.json'
);

let localCatalogProductsCache: OffProduct[] | undefined;

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeUnidad(raw: unknown): UnidadMedida {
  const normalized = toTrimmedString(raw).toUpperCase();
  if (
    normalized &&
    Object.values(UnidadMedida).includes(normalized as UnidadMedida)
  ) {
    return normalized as UnidadMedida;
  }
  return UnidadMedida.UNIDAD;
}

function normalizeTipo(raw: unknown): TipoProducto {
  const normalized = toTrimmedString(raw).toLowerCase();
  if (
    normalized &&
    Object.values(TipoProducto).includes(normalized as TipoProducto)
  ) {
    return normalized as TipoProducto;
  }
  return TipoProducto.OTRO;
}

function normalizeAlergenos(raw: unknown): Alergeno[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const values = new Set<Alergeno>();
  for (const item of raw) {
    const normalized = toTrimmedString(item).toUpperCase();
    if (
      normalized &&
      Object.values(Alergeno).includes(normalized as Alergeno)
    ) {
      values.add(normalized as Alergeno);
    }
  }

  return [...values];
}

function buildDeterministicBarcode(index: number): string {
  return String(7700000000000 + Math.max(0, index))
    .padStart(13, '0')
    .slice(0, 13);
}

function buildQuantity(contenido: number, unidad: UnidadMedida): string {
  if (
    Number.isNaN(contenido) ||
    !Number.isFinite(contenido) ||
    contenido <= 0
  ) {
    return '1 unidad';
  }

  if (unidad === UnidadMedida.KG) return `${contenido}kg`;
  if (unidad === UnidadMedida.G) return `${contenido}g`;
  if (unidad === UnidadMedida.L) return `${contenido}l`;
  if (unidad === UnidadMedida.ML) return `${contenido}ml`;

  return `${contenido} unidad`;
}

function loadLocalCatalogOffProducts(): OffProduct[] {
  if (localCatalogProductsCache) {
    return localCatalogProductsCache;
  }

  let parsed: SeedCatalogFile;
  try {
    const rawFile = readFileSync(LOCAL_SEED_PRODUCTS_FILE, 'utf8');
    parsed = JSON.parse(rawFile) as SeedCatalogFile;
  } catch (error) {
    throw new Error(
      `[seed-openfoodfacts] No se pudo cargar el catalogo local ${LOCAL_SEED_PRODUCTS_FILE}: ${String(
        error instanceof Error ? error.message : error
      )}`
    );
  }

  const sourceProducts = Array.isArray(parsed.productos)
    ? parsed.productos
    : [];

  const normalizedProducts: OffProduct[] = sourceProducts
    .map((product, index) => {
      const nombre = toTrimmedString(product.nombre);
      if (!nombre) {
        return undefined;
      }

      const marca = toTrimmedString(product.marca) || 'Marca Economato';
      const unidad = normalizeUnidad(product.unidad);
      const contenidoRaw = Number(product.contenido);
      const contenido =
        Number.isFinite(contenidoRaw) && contenidoRaw > 0 ? contenidoRaw : 1;
      const tipo = normalizeTipo(product.tipo);
      const codigo =
        toTrimmedString(product.codigoBarras) ||
        buildDeterministicBarcode(index + 1);

      return {
        product_name_es: nombre,
        product_name: nombre,
        generic_name: nombre,
        quantity: buildQuantity(contenido, unidad),
        brands: marca,
        brands_tags: [marca.toLowerCase().replace(/\s+/g, '-')],
        ingredients_text:
          toTrimmedString(product.descripcion) ||
          `Producto del catalogo local normalizado: ${nombre}.`,
        categories_tags: [],
        code: codigo,
        allergens_tags: [],
        seedImageUrl: toTrimmedString(product.pathImg) || undefined,
        seedUnidad: unidad,
        seedContenido: contenido,
        seedTipo: tipo,
        seedAlergenos: normalizeAlergenos(product.alergenos),
      } as OffProduct;
    })
    .filter((product): product is OffProduct => Boolean(product));

  localCatalogProductsCache = normalizedProducts;
  return normalizedProducts;
}

async function fetchOpenFoodFactsResponse(
  url: string,
  timeoutMs: number
): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
  });
}

function getOffProductImageUrl(product: OffProduct): string | undefined {
  const imageUrl = String(product.image_url || '').trim();
  return imageUrl.length > 0 ? imageUrl : undefined;
}

function getOffProductImageKey(product: OffProduct): string {
  const code = String(product.code || '').trim();
  if (code.length > 0) {
    return `code:${code}`;
  }

  const imageUrl = getOffProductImageUrl(product);
  return imageUrl ? `url:${imageUrl}` : '';
}

function sanitizeFileNamePart(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function inferImageExtension(
  mimeType: string,
  imageUrl: string | undefined
): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType === 'image/svg+xml') return 'svg';
  if (mimeType === 'image/avif') return 'avif';

  const normalizedUrl = String(imageUrl || '').toLowerCase();
  if (normalizedUrl.endsWith('.png')) return 'png';
  if (normalizedUrl.endsWith('.webp')) return 'webp';
  if (normalizedUrl.endsWith('.gif')) return 'gif';
  if (normalizedUrl.endsWith('.svg')) return 'svg';
  if (normalizedUrl.endsWith('.avif')) return 'avif';

  return 'jpg';
}

function getUploadedImageRefs(context: SeedContext): SeedUploadedImageRef[] {
  return (
    context.getState<SeedUploadedImageRef[]>('seedUploadedImageRefs') || []
  );
}

function setUploadedImageRefs(
  context: SeedContext,
  refs: SeedUploadedImageRef[]
): void {
  context.set('seedUploadedImageRefs', refs);
}

function cacheUploadedImageRef(
  context: SeedContext,
  ref: SeedUploadedImageRef
): void {
  const refs = getUploadedImageRefs(context);
  const existingIndex = refs.findIndex(
    (candidate) =>
      candidate.key === ref.key || candidate.sourceUrl === ref.sourceUrl
  );

  if (existingIndex >= 0) {
    refs[existingIndex] = ref;
  } else {
    refs.push(ref);
  }

  setUploadedImageRefs(context, refs);
}

function applyUploadedImageToProduct(
  product: OffProduct,
  ref: SeedUploadedImageRef
): SeedUploadedImageRef {
  product.seedImageUrl = ref.url;
  product.seedImageOptimizedUrl = ref.urlOptimized;
  product.seedArchivoId = ref.archivoId;
  return ref;
}

export function pickSeedUploadedImageRef(
  context: SeedContext,
  iteration: number
): { pathImg: string; pathImgOptimized?: string } | undefined {
  const refs = getUploadedImageRefs(context);
  if (refs.length === 0) {
    return undefined;
  }

  const ref = refs[iteration % refs.length];
  if (!ref?.url) {
    return undefined;
  }

  return {
    pathImg: ref.url,
    pathImgOptimized: ref.urlOptimized,
  };
}

export async function uploadOpenFoodFactsProductImage(
  context: SeedContext,
  product: OffProduct,
  options?: {
    timeoutMs?: number;
  }
): Promise<SeedUploadedImageRef | undefined> {
  const imageUrl = getOffProductImageUrl(product);
  if (!imageUrl) {
    return undefined;
  }

  const imageKey = getOffProductImageKey(product);
  if (!imageKey) {
    return undefined;
  }

  const cachedRef = getUploadedImageRefs(context).find(
    (candidate) =>
      candidate.key === imageKey || candidate.sourceUrl === imageUrl
  );
  if (cachedRef) {
    return applyUploadedImageToProduct(product, cachedRef);
  }

  try {
    const response = await fetchOpenFoodFactsResponse(
      imageUrl,
      Math.max(2000, options?.timeoutMs ?? OPEN_FOOD_FACTS_IMAGE_TIMEOUT_MS)
    );

    if (!response.ok) {
      throw new Error(`imagen OpenFoodFacts status=${response.status}`);
    }

    const mimeType = String(response.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase();

    if (!mimeType.startsWith('image/')) {
      throw new Error(`content-type inválido: ${mimeType || 'desconocido'}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    if (imageBuffer.length === 0) {
      throw new Error('respuesta de imagen vacía');
    }

    const filename = `off-${sanitizeFileNamePart(
      String(product.code || 'sin-codigo')
    )}.${inferImageExtension(mimeType, imageUrl)}`;

    const uploaded = await context.postMultipart<{
      id?: string;
      url?: string;
      urlOptimized?: string;
    }>('/archivos/upload', {
      file: new File([imageBuffer], filename, { type: mimeType }),
    });

    const internalUrl = String(uploaded?.url || '').trim();
    if (!internalUrl) {
      throw new Error('upload sin URL interna');
    }

    const ref: SeedUploadedImageRef = {
      key: imageKey,
      sourceUrl: imageUrl,
      url: internalUrl.slice(0, 200),
      urlOptimized:
        typeof uploaded?.urlOptimized === 'string' &&
        uploaded.urlOptimized.trim().length > 0
          ? uploaded.urlOptimized.trim().slice(0, 255)
          : undefined,
      archivoId:
        typeof uploaded?.id === 'string' && uploaded.id.trim().length > 0
          ? uploaded.id.trim()
          : undefined,
    };

    cacheUploadedImageRef(context, ref);
    return applyUploadedImageToProduct(product, ref);
  } catch (error) {
    console.warn(
      `[seed-openfoodfacts] No se pudo descargar/subir la imagen del producto ${String(
        product.code || 'sin-codigo'
      )}: ${String(error instanceof Error ? error.message : error)}`
    );
    return undefined;
  }
}

export async function hydrateOpenFoodFactsProductAssets(
  context: SeedContext,
  products: OffProduct[],
  options?: {
    timeoutMs?: number;
  }
): Promise<OffProduct[]> {
  for (const product of products) {
    await uploadOpenFoodFactsProductImage(context, product, options);
  }

  return products;
}

function mapAlergeno(offTag: string): Alergeno | null {
  const map: Record<string, Alergeno> = {
    'en:gluten': Alergeno.GLUTEN,
    'en:crustaceans': Alergeno.CRUSTACEOS,
    'en:eggs': Alergeno.HUEVOS,
    'en:fish': Alergeno.PESCADO,
    'en:peanuts': Alergeno.CACAHUETES,
    'en:soybeans': Alergeno.SOJA,
    'en:milk': Alergeno.LACTEOS,
    'en:nuts': Alergeno.FRUTOS_CON_CASCARA,
    'en:celery': Alergeno.APIO,
    'en:mustard': Alergeno.MOSTAZA,
    'en:sesame-seeds': Alergeno.SESAMO,
    'en:sulphur-dioxide-and-sulphites': Alergeno.SULFITO,
    'en:lupin': Alergeno.ALTRAMUCES,
    'en:molluscs': Alergeno.MOLUSCOS,
  };

  return map[offTag.toLowerCase()] || null;
}

function mapTipoCategoria(tags: string[] = []): TipoProducto {
  const tagStr = tags.join(' ').toLowerCase();

  if (tagStr.includes('beverage') || tagStr.includes('drink')) {
    return TipoProducto.BEBIDA;
  }
  if (tagStr.includes('meat')) {
    return TipoProducto.CARNE;
  }
  if (tagStr.includes('seafood') || tagStr.includes('fish')) {
    return TipoProducto.PESCADO;
  }
  if (
    tagStr.includes('dairy') ||
    tagStr.includes('milk') ||
    tagStr.includes('cheese')
  ) {
    return TipoProducto.LACTEO;
  }
  if (tagStr.includes('fruit')) {
    return TipoProducto.FRUTA;
  }
  if (tagStr.includes('vegetable')) {
    return TipoProducto.VERDURA;
  }
  if (tagStr.includes('cereal')) {
    return TipoProducto.CEREAL;
  }
  if (tagStr.includes('legume')) {
    return TipoProducto.LEGUMBRE;
  }
  if (tagStr.includes('nut')) {
    return TipoProducto.FRUTO_SECO;
  }
  if (tagStr.includes('egg')) {
    return TipoProducto.HUEVO;
  }
  if (tagStr.includes('oil')) {
    return TipoProducto.ACEITE;
  }
  if (tagStr.includes('sugar') || tagStr.includes('sweet')) {
    return TipoProducto.AZUCAR;
  }
  if (tagStr.includes('condiment') || tagStr.includes('sauce')) {
    return TipoProducto.CONDIMENTO;
  }

  return TipoProducto.OTRO;
}

function parseQuantity(q: string | undefined): {
  contenido: number;
  unidad: UnidadMedida;
} {
  if (!q) {
    return { contenido: 1, unidad: UnidadMedida.UNIDAD };
  }

  const match = q.toLowerCase().match(/([0-9.,]+)\s*(kg|g|l|ml|cl)/);
  if (!match) {
    return { contenido: 1, unidad: UnidadMedida.UNIDAD };
  }

  let val = parseFloat(match[1].replace(',', '.'));
  let unidad = UnidadMedida.UNIDAD;

  if (match[2] === 'kg') unidad = UnidadMedida.KG;
  else if (match[2] === 'g') unidad = UnidadMedida.G;
  else if (match[2] === 'l') unidad = UnidadMedida.L;
  else if (match[2] === 'ml') unidad = UnidadMedida.ML;
  else if (match[2] === 'cl') {
    unidad = UnidadMedida.ML;
    val *= 10;
  }

  return { contenido: val, unidad };
}

function uniqueAlergenos(tags: string[] | undefined): Alergeno[] {
  if (!Array.isArray(tags) || tags.length === 0) {
    return [];
  }

  const mapped = new Set<Alergeno>();
  for (const tag of tags) {
    const value = mapAlergeno(tag);
    if (value) {
      mapped.add(value);
    }
  }
  return [...mapped];
}
export function generateFallbackOffProducts(count: number): OffProduct[] {
  const target = Math.max(0, Math.floor(count));
  if (target === 0) {
    return [];
  }

  const localProducts = loadLocalCatalogOffProducts();
  if (localProducts.length === 0) {
    return [];
  }

  return Array.from({ length: target }, (_, index) => {
    const base = localProducts[index % localProducts.length];
    return {
      ...base,
      code: buildDeterministicBarcode(100_000 + index),
      seedImageUrl: undefined,
      seedImageOptimizedUrl: undefined,
      seedArchivoId: undefined,
    };
  });
}

export function fetchOpenFoodFactsProducts(options?: {
  pageSize?: number;
  page?: number;
  timeoutMs?: number;
  fallbackToCatalog?: boolean;
}): Promise<OffProduct[]> {
  const pageSize = Math.max(
    1,
    Math.min(
      options?.pageSize ?? OPEN_FOOD_FACTS_MAX_PAGE_SIZE,
      OPEN_FOOD_FACTS_MAX_PAGE_SIZE
    )
  );
  const page = Math.max(1, Math.floor(options?.page ?? 1));
  const fallbackToCatalog = options?.fallbackToCatalog ?? false;

  const localProducts = loadLocalCatalogOffProducts();
  if (localProducts.length === 0) {
    if (fallbackToCatalog) {
      return Promise.resolve(generateFallbackOffProducts(pageSize));
    }

    throw new Error(
      '[seed-openfoodfacts] El catalogo local de productos esta vacio; no se puede continuar en modo determinista.'
    );
  }

  const start = (page - 1) * pageSize;
  const sliced = localProducts.slice(start, start + pageSize);

  if (sliced.length === 0 && fallbackToCatalog) {
    return Promise.resolve(generateFallbackOffProducts(pageSize));
  }

  return Promise.resolve(
    sliced.map((product, index) => ({
      ...product,
      code:
        toTrimmedString(product.code) ||
        buildDeterministicBarcode(start + index + 1),
    }))
  );
}

export function offProductToCreateProductoPayload(
  product: OffProduct,
  providerId?: string
): CreateProductoPayloadFromOff | null {
  const nombre =
    product.product_name_es || product.product_name || product.generic_name;
  const codigo = product.code?.trim();

  if (!nombre || !codigo) {
    return null;
  }

  const parsedQuantity = parseQuantity(product.quantity);
  const contenido =
    typeof product.seedContenido === 'number' &&
    Number.isFinite(product.seedContenido) &&
    product.seedContenido > 0
      ? product.seedContenido
      : parsedQuantity.contenido;
  const unidad = product.seedUnidad || parsedQuantity.unidad;
  const alergenos =
    Array.isArray(product.seedAlergenos) && product.seedAlergenos.length > 0
      ? [...new Set(product.seedAlergenos)]
      : uniqueAlergenos(product.allergens_tags);
  const tipo = product.seedTipo || mapTipoCategoria(product.categories_tags);
  const marca = (product.brands || product.brands_tags?.[0] || '').trim();

  return {
    nombre: nombre.slice(0, 100),
    marca: marca ? marca.slice(0, 100) : undefined,
    descripcion: (product.ingredients_text || 'Sin descripcion').slice(0, 1000),
    unidad,
    tipo,
    contenido,
    codigoBarras: codigo.slice(0, 130),
    pathImg: product.seedImageUrl?.slice(0, 200),
    alergenos: alergenos.length > 0 ? alergenos : undefined,
    proveedores: providerId
      ? [
          {
            proveedorId: providerId,
            precioUnitario: 1,
            marcaEspecifica: marca ? marca.slice(0, 100) : undefined,
            codigoBarras: codigo.slice(0, 130),
          },
        ]
      : undefined,
  };
}
