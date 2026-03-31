import { faker } from '@faker-js/faker';
import { ALERGEN_VALUES } from './massive.config';
import { BuildBodyEnv } from './massive.helpers.body.shared';
import { getStateArray } from './massive.state';

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
    return {
      nombre: `Proveedor ${suffix}`,
      contacto: faker.person.fullName(),
      telefono: `+34${faker.string.numeric(9)}`,
      email: `proveedor.${suffix}@smarteconomat.local`,
      direccion: faker.location.streetAddress(),
      nif: `SEED${faker.string.numeric(8)}`,
    };
  }

  if (resolvedPath.startsWith('/productos')) {
    if (endpoint.method === 'PATCH') {
      return {
        nombre: faker.commerce.productName(),
        marca: faker.company.name(),
        descripcion: faker.commerce.productDescription(),
        unidad: unidadProducto,
        tipo: tipoProducto,
        contenido: Number(
          faker.number.float({ min: 0.3, max: 25, fractionDigits: 2 })
        ),
      };
    }

    return {
      nombre: faker.commerce.productName(),
      marca: faker.company.name(),
      descripcion: faker.commerce.productDescription(),
      codigoBarras: `SEED-${suffix}`,
      unidad: unidadProducto,
      tipo: tipoProducto,
      contenido: Number(
        faker.number.float({ min: 0.3, max: 25, fractionDigits: 2 })
      ),
      alergenos: [alergeno],
      proveedores: [
        {
          proveedorId,
          precioUnitario: Number(
            faker.number.float({ min: 0.8, max: 25, fractionDigits: 2 })
          ),
          marcaEspecifica: faker.company.name(),
          codigoBarras: `PROV-${suffix}`,
        },
      ],
    };
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
      precio: Number(
        faker.number.float({ min: 0.8, max: 30, fractionDigits: 2 })
      ),
      fecha: new Date().toISOString(),
    };
  }

  return undefined;
}
