import { ALERGEN_VALUES } from './massive.config';
import { BuildBodyEnv } from './massive.helpers.body.shared';
import { getStateArray } from './massive.state';
import {
  offProductToCreateProductoPayload,
  OffProduct,
  pickSeedUploadedImageRef,
} from './openfoodfacts.seed';
import {
  DETERMINISTIC_PROVIDER_PROFILES,
  DETERMINISTIC_SHORT_NOTES,
  deterministicFloat,
  deterministicInt,
  pickDeterministic,
  seedDateIso,
  seedDateFromIteration,
} from './deterministic.seed-data';

const PRODUCT_PATCH_NAMES = [
  'Aceite de oliva virgen extra',
  'Arroz redondo',
  'Tomate triturado natural',
  'Pimiento rojo fresco',
  'Leche entera UHT',
  'Harina de trigo panificable',
  'Pechuga de pollo fileteada',
  'Atun en conserva al natural',
] as const;

const PRODUCT_PATCH_BRANDS = [
  'Hacendado',
  'Makro Chef',
  'Carrefour Bio',
  'Eroski Basic',
  'Gourmet Line',
  'Chef Selection',
] as const;

function buildSeedUniqueBarcode(
  baseCode: string | undefined,
  runTag: string,
  iteration: number
): string {
  const normalizedBase = (baseCode || 'SEEDPROD').trim() || 'SEEDPROD';
  return `${normalizedBase}-${runTag}-${iteration}`.slice(0, 130);
}

/** El API exige `nombre` único entre productos activos; el catálogo OFF es estable entre ejecuciones. */
function mergeSeedProductoNombreUnico(
  nombreBase: string,
  seedSuffix: string
): string {
  const maxLen = 100;
  const token = seedSuffix
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-14)
    .toUpperCase();
  const suffixPart = token.length > 0 ? ` ${token}` : '';
  const trimmedBase = nombreBase.trim();
  if (trimmedBase.length + suffixPart.length <= maxLen) {
    return (trimmedBase + suffixPart).slice(0, maxLen);
  }
  const available = maxLen - suffixPart.length;
  return (trimmedBase.slice(0, Math.max(1, available)) + suffixPart).slice(
    0,
    maxLen
  );
}

/**
 * Expone "buildBodyCatalogProducts" en smart-economat-backend (Nest).
 * @undefined {BuildBodyEnv} env - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown> | undefined} Datos efectivos después de ejecutar la operación.
 */
export function buildBodyCatalogProducts(
  env: BuildBodyEnv
): Record<string, unknown> | undefined {
  const {
    context,
    endpoint,
    resolvedPath,
    iteration,
    suffix,
    unidadProducto,
    tipoProducto,
    alergeno,
    proveedorId,
    productoId,
    productoProveedorId,
    runTag,
  } = env;

  if (resolvedPath.startsWith('/proveedor')) {
    const provider =
      DETERMINISTIC_PROVIDER_PROFILES[
        iteration % DETERMINISTIC_PROVIDER_PROFILES.length
      ];

    const compactSuffix = suffix
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-8)
      .toUpperCase();
    const runTagFingerprint = Array.from(runTag).reduce(
      (acc, char) => ((acc * 33 + char.charCodeAt(0)) >>> 0) % 1_679_616,
      5381
    );
    const runTagToken = runTagFingerprint
      .toString(36)
      .toUpperCase()
      .padStart(4, '0')
      .slice(-4);
    const uniqueProviderToken = `${runTagToken}${compactSuffix}`;
    const baseNif = (provider?.nif || 'B10000000')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8);
    const uniqueNif = `${baseNif}${uniqueProviderToken}`.slice(0, 20);
    const uniqueEmail = provider?.email
      ? provider.email.replace('@', `.${uniqueProviderToken.toLowerCase()}@`)
      : undefined;

    return {
      nombre: `${provider?.nombre || 'Proveedor Seed'} ${uniqueProviderToken}`
        .trim()
        .slice(0, 100),
      contacto: provider?.contacto,
      telefono: provider?.telefono,
      email: uniqueEmail,
      direccion: provider?.direccion,
      nif: uniqueNif,
    };
  }

  if (resolvedPath.startsWith('/productos')) {
    if (endpoint.method === 'PATCH') {
      const imageRef = pickSeedUploadedImageRef(context, iteration);
      const patchNombreBase = pickDeterministic(
        PRODUCT_PATCH_NAMES,
        iteration,
        'patch-product-name'
      );
      return {
        nombre: mergeSeedProductoNombreUnico(patchNombreBase, suffix),
        marca: pickDeterministic(
          PRODUCT_PATCH_BRANDS,
          iteration,
          'patch-product-brand'
        ),
        descripcion: pickDeterministic(
          DETERMINISTIC_SHORT_NOTES,
          iteration,
          'patch-product-description'
        ),
        unidad: unidadProducto,
        tipo: tipoProducto,
        contenido: deterministicFloat(0.3, 25, 2, iteration, 'patch-content'),
        fechaCaducidad:
          iteration % 2 === 0
            ? seedDateIso(
                180 + deterministicInt(0, 180, iteration, 'patch-expiry')
              )
            : undefined,
        pathImg: imageRef?.pathImg,
        alergenos: [
          alergeno,
          ALERGEN_VALUES[(iteration + 1) % ALERGEN_VALUES.length],
        ],
      };
    }

    const offPool =
      context.getState<OffProduct[]>('seedOpenFoodFactsPool') || [];

    if (offPool.length === 0) {
      throw new Error(
        '[seed-massive] OpenFoodFacts pool vacio. Debe cargarse antes de POST /productos'
      );
    }

    const offProduct = offPool[iteration % offPool.length];

    const payloadFromOff = offProductToCreateProductoPayload(
      offProduct,
      proveedorId
    );

    if (!payloadFromOff) {
      throw new Error(
        '[seed-massive] Producto OpenFoodFacts invalido para POST /productos'
      );
    }

    const uniqueBarcode = buildSeedUniqueBarcode(
      String(payloadFromOff.codigoBarras || '').trim(),
      runTag,
      iteration
    );

    payloadFromOff.codigoBarras = uniqueBarcode;
    payloadFromOff.fechaCaducidad = seedDateIso(
      365 + deterministicInt(0, 365, iteration, 'off-expiry')
    );
    if (Array.isArray(payloadFromOff.proveedores)) {
      payloadFromOff.proveedores = payloadFromOff.proveedores.map(
        (proveedor) => ({
          ...proveedor,
          codigoBarras: uniqueBarcode,
        })
      );
    }

    const proveedorIds = Array.from(
      new Set([
        ...getStateArray(context, 'seedCreatedProveedorIds'),
        ...getStateArray(context, 'proveedorIds'),
      ])
    ).filter(Boolean);

    const primaryProveedorId = payloadFromOff.proveedores?.[0]?.proveedorId;
    const secondaryProveedorId = proveedorIds.find(
      (candidateId) => candidateId !== primaryProveedorId
    );

    if (secondaryProveedorId) {
      payloadFromOff.proveedores = [
        ...(payloadFromOff.proveedores || []),
        {
          proveedorId: secondaryProveedorId,
          precioUnitario: deterministicFloat(
            1.1,
            15,
            2,
            iteration,
            'secondary-provider-price'
          ),
          marcaEspecifica: payloadFromOff.marca
            ? `${payloadFromOff.marca} Foodservice`.slice(0, 100)
            : pickDeterministic(
                PRODUCT_PATCH_BRANDS,
                iteration + 1,
                'secondary-provider-brand'
              ),
          codigoBarras: `${uniqueBarcode}-ALT`.slice(0, 130),
        },
      ];
    }

    payloadFromOff.nombre = mergeSeedProductoNombreUnico(
      payloadFromOff.nombre || 'Producto seed',
      suffix
    );

    return payloadFromOff;
  }

  if (resolvedPath.startsWith('/producto-proveedor')) {
    if (resolvedPath.endsWith('/precio')) {
      const priceCursor =
        context.getState<number>('seedProductoPrecioCursor') || 0;
      context.set('seedProductoPrecioCursor', priceCursor + 1);

      const pricePathMatch = resolvedPath.match(
        /^\/producto-proveedor\/([^/]+)\/precio$/
      );
      const selectedProductoProveedorId =
        decodeURIComponent(pricePathMatch?.[1] || '') || productoProveedorId;
      const productoProveedorPrecioById =
        context.getState<Record<string, number>>(
          'productoProveedorPrecioById'
        ) || {};
      const currentPrice =
        selectedProductoProveedorId.length > 0
          ? productoProveedorPrecioById[selectedProductoProveedorId]
          : undefined;
      const delta = Number((((priceCursor % 17) + 1) / 100).toFixed(2));

      let nuevoPrecio: number;
      if (typeof currentPrice === 'number' && Number.isFinite(currentPrice)) {
        nuevoPrecio = Number((currentPrice + delta).toFixed(2));
      } else {
        const runHash = Array.from(runTag).reduce(
          (acc, char) => acc + char.charCodeAt(0),
          0
        );
        const basePrice = 20 + (runHash % 700) / 10;
        nuevoPrecio = Number((basePrice + priceCursor * 0.01).toFixed(2));
      }

      if (
        typeof currentPrice === 'number' &&
        Number.isFinite(currentPrice) &&
        nuevoPrecio === Number(currentPrice.toFixed(2))
      ) {
        nuevoPrecio = Number((currentPrice + 0.01).toFixed(2));
      }

      if (selectedProductoProveedorId.length > 0) {
        productoProveedorPrecioById[selectedProductoProveedorId] = nuevoPrecio;
        context.set('productoProveedorPrecioById', productoProveedorPrecioById);
      }

      return {
        nuevoPrecio,
      };
    }

    if (resolvedPath.endsWith('/merma')) {
      const mermaCursor =
        context.getState<number>('seedProductoMermaCursor') || 0;
      context.set('seedProductoMermaCursor', mermaCursor + 1);

      const nuevaMerma = 90 + ((mermaCursor * 7) % 900) / 100;

      return {
        nuevaMerma: Number(nuevaMerma.toFixed(2)),
      };
    }
  }

  if (resolvedPath === '/producto-alergenos') {
    const createdProducts = getStateArray(context, 'seedCreatedProductoIds');
    const allProducts =
      createdProducts.length > 0
        ? createdProducts
        : getStateArray(context, 'productoIds');
    const existingPairs = new Set(
      getStateArray(context, 'productoAlergenoPairs')
    );

    for (let p = 0; p < allProducts.length; p++) {
      const candidateProductId =
        allProducts[(iteration + p) % allProducts.length];
      if (!candidateProductId) {
        continue;
      }

      for (const candidateAlergeno of ALERGEN_VALUES) {
        const pairKey = `${candidateProductId}|${candidateAlergeno}`;
        if (!existingPairs.has(pairKey)) {
          return {
            idProducto: candidateProductId,
            alergeno: candidateAlergeno,
          };
        }
      }
    }

    return {
      idProducto: productoId,
      alergeno,
    };
  }

  if (
    resolvedPath.startsWith('/producto-alergenos') &&
    endpoint.method === 'PATCH'
  ) {
    return {
      alergenos: [
        alergeno,
        ALERGEN_VALUES[(iteration + 1) % ALERGEN_VALUES.length],
      ],
    };
  }

  if (resolvedPath.startsWith('/historial-precio')) {
    return {
      productoProveedorId,
      precio: deterministicFloat(0.8, 30, 2, iteration, 'historial-price'),
      fecha: seedDateFromIteration(iteration, 540, 'historial-date'),
    };
  }

  return undefined;
}
