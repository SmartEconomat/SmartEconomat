/**
 * Documentación en español.
 */
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { ProductoAlergeno } from '../modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';
import { Alergeno } from '../modules/producto/enums/producto.enums';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { SeedContext } from './seed-context';
import type { Repository } from 'typeorm';
import {
  fetchOpenFoodFactsProducts,
  offProductToCreateProductoPayload,
  OffProduct,
  uploadOpenFoodFactsProductImage,
} from './openfoodfacts.seed';

/**
 * Documentación en español.
 */
export const runSeeder = async (context: SeedContext) => {
  const productoRepo = context.getRepository<Repository<Producto>>(Producto);
  const proveedorRepo = context.getRepository<Repository<Proveedor>>(Proveedor);
  const productoProveedorRepo =
    context.getRepository<Repository<ProductoProveedor>>(ProductoProveedor);
  const productoAlergenoRepo =
    context.getRepository<Repository<ProductoAlergeno>>(ProductoAlergeno);

  const proveedores = await proveedorRepo.find();
  if (proveedores.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_PROVEEDORES'));
  }

  console.log('Obteniendo productos de OpenFoodFacts...');
  const offProducts: OffProduct[] = await fetchOpenFoodFactsProducts({
    pageSize: 50,
    timeoutMs: 60000,
  });
  console.log(`OpenFoodFacts devolvio ${offProducts.length} productos.`);

  if (offProducts.length === 0) {
    throw new Error(
      'OpenFoodFacts no devolvio productos para seeding; se requiere disponibilidad y datos del tercero.'
    );
  }

  const productosDB = await productoRepo.find({ select: ['codigoBarras'] });
  const codigosVistos = new Set<string>(
    productosDB
      .filter((p) => !!p.codigoBarras)
      .map((p) => p.codigoBarras as string)
  );

  const productos: Producto[] = [];
  const alergenosByCodigo = new Map<string, Alergeno[]>();

  for (const offProduct of offProducts) {
    await uploadOpenFoodFactsProductImage(context, offProduct);

    const payload = offProductToCreateProductoPayload(offProduct);
    if (!payload) {
      continue;
    }

    const codigoBarras = payload.codigoBarras;
    if (!codigoBarras || codigosVistos.has(codigoBarras)) {
      continue;
    }

    codigosVistos.add(codigoBarras);

    const producto = productoRepo.create({
      nombre: payload.nombre,
      marca: payload.marca || 'Marca Blanca',
      descripcion: payload.descripcion || 'Sin descripcion disponible.',
      unidad: payload.unidad,
      tipo: payload.tipo,
      pathImg: payload.pathImg,
      contenido: payload.contenido,
      codigoBarras,
      pmp: 0,
    });

    alergenosByCodigo.set(codigoBarras, payload.alergenos || []);
    productos.push(producto);
  }

  const productosGuardados: Producto[] = [];
  if (productos.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < productos.length; i += chunkSize) {
      const chunk = productos.slice(i, i + chunkSize);
      const saved = await productoRepo.save(chunk);
      productosGuardados.push(...saved);
    }
  }

  if (productosGuardados.length === 0) {
    console.warn(
      'OpenFoodFacts no aporto productos nuevos para insertar en esta ejecucion.'
    );
    console.log(SeederI18nHelper.getSeederSuccess('productos'));
    return;
  }

  const productoProveedores: ProductoProveedor[] = [];
  const ppsExistentes = await productoProveedorRepo.find({
    relations: ['producto'],
  });
  const idsConProveedor = new Set(ppsExistentes.map((pp) => pp.producto.id));

  const sortedProveedores = [...proveedores].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  for (const producto of productosGuardados) {
    if (idsConProveedor.has(producto.id)) {
      continue;
    }

    const seed = parseInt(producto.id.substring(0, 8), 16) || 0;
    const numProveedores = Math.min(sortedProveedores.length, (seed % 3) + 1);
    const proveedoresAsignados = sortedProveedores.slice(0, numProveedores);

    for (const proveedor of proveedoresAsignados) {
      const precio = 5 + (seed % 100);
      const merma = seed % 15;

      productoProveedores.push(
        productoProveedorRepo.create({
          producto,
          proveedor,
          precioUnitario: precio,
          mermaEsperada: merma,
          marca: producto.marca,
          codigoBarras: producto.codigoBarras,
          pmp: 0,
        })
      );
    }
  }

  if (productoProveedores.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < productoProveedores.length; i += chunkSize) {
      const chunk = productoProveedores.slice(i, i + chunkSize);
      await productoProveedorRepo.save(chunk);
    }
  }

  const alergenos: ProductoAlergeno[] = [];
  const apsExistentes = await productoAlergenoRepo.find({
    relations: ['producto'],
  });
  const idsConAlergenos = new Set(apsExistentes.map((ap) => ap.producto.id));

  for (const producto of productosGuardados) {
    if (idsConAlergenos.has(producto.id) || !producto.codigoBarras) {
      continue;
    }

    const alergenosMapeados =
      alergenosByCodigo.get(producto.codigoBarras) || [];
    for (const alergeno of alergenosMapeados) {
      alergenos.push(productoAlergenoRepo.create({ producto, alergeno }));
    }
  }

  if (alergenos.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < alergenos.length; i += chunkSize) {
      const chunk = alergenos.slice(i, i + chunkSize);
      await productoAlergenoRepo.save(chunk);
    }
  }

  console.log(SeederI18nHelper.getSeederSuccess('productos'));
};
