import { DataSource } from 'typeorm';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { ProductoAlergeno } from '../modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';
import {
  UnidadProducto,
  TipoProducto,
  AlergenoProducto,
} from '../modules/producto/enums/producto.enums';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

interface OffProduct {
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
}

function mapAlergeno(offTag: string): AlergenoProducto | null {
  const map: Record<string, AlergenoProducto> = {
    'en:gluten': AlergenoProducto.GLUTEN,
    'en:crustaceans': AlergenoProducto.CRUSTACEOS,
    'en:eggs': AlergenoProducto.HUEVOS,
    'en:fish': AlergenoProducto.PESCADO,
    'en:peanuts': AlergenoProducto.CACAHUETES,
    'en:soybeans': AlergenoProducto.SOJA,
    'en:milk': AlergenoProducto.LACTEOS,
    'en:nuts': AlergenoProducto.FRUTOS_CON_CASCARA,
    'en:celery': AlergenoProducto.APIO,
    'en:mustard': AlergenoProducto.MOSTAZA,
    'en:sesame-seeds': AlergenoProducto.SESAMO,
    'en:sulphur-dioxide-and-sulphites': AlergenoProducto.SULFITO,
    'en:lupin': AlergenoProducto.ALTRAMUCES,
    'en:molluscs': AlergenoProducto.MOLUSCOS,
  };
  return map[offTag] || null;
}

function mapTipoCategoria(tags: string[] = []): TipoProducto {
  const tagStr = tags.join(' ').toLowerCase();

  if (tagStr.includes('beverage') || tagStr.includes('drink'))
    return TipoProducto.BEBIDA;
  if (tagStr.includes('meat')) return TipoProducto.CARNE;
  if (tagStr.includes('seafood') || tagStr.includes('fish'))
    return TipoProducto.PESCADO;
  if (
    tagStr.includes('dairy') ||
    tagStr.includes('milk') ||
    tagStr.includes('cheese')
  )
    return TipoProducto.LACTEO;
  if (tagStr.includes('fruit')) return TipoProducto.FRUTA;
  if (tagStr.includes('vegetable')) return TipoProducto.VERDURA;
  if (tagStr.includes('cereal')) return TipoProducto.CEREAL;
  if (tagStr.includes('legume')) return TipoProducto.LEGUMBRE;
  if (tagStr.includes('nut')) return TipoProducto.FRUTO_SECO;
  if (tagStr.includes('egg')) return TipoProducto.HUEVO;
  if (tagStr.includes('oil')) return TipoProducto.ACEITE;
  if (tagStr.includes('sugar') || tagStr.includes('sweet'))
    return TipoProducto.AZUCAR;
  if (tagStr.includes('condiment') || tagStr.includes('sauce'))
    return TipoProducto.CONDIMENTO;

  return TipoProducto.OTRO;
}

function parseQuantity(q: string | undefined): {
  contenido: number;
  unidad: UnidadProducto;
} {
  if (!q) return { contenido: 1, unidad: UnidadProducto.UNIDAD };
  const match = q.toLowerCase().match(/([0-9.,]+)\s*(kg|g|l|ml|cl)/);
  if (!match) return { contenido: 1, unidad: UnidadProducto.UNIDAD };

  let val = parseFloat(match[1].replace(',', '.'));
  let unidad = UnidadProducto.UNIDAD;

  if (match[2] === 'kg') unidad = UnidadProducto.KG;
  else if (match[2] === 'g') unidad = UnidadProducto.G;
  else if (match[2] === 'l') unidad = UnidadProducto.L;
  else if (match[2] === 'ml') unidad = UnidadProducto.ML;
  else if (match[2] === 'cl') {
    unidad = UnidadProducto.ML;
    val *= 10;
  }

  return { contenido: val, unidad };
}

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const productoRepo = dataSource.getRepository(Producto);
  const proveedorRepo = dataSource.getRepository(Proveedor);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);
  const productoAlergenoRepo = dataSource.getRepository(ProductoAlergeno);

  const proveedores = await proveedorRepo.find();
  if (proveedores.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_PROVEEDORES'));
  }

  console.log('Obteniendo productos de OpenFoodFacts...');
  const offResponse = await fetch(
    'https://es.openfoodfacts.org/cgi/search.pl?action=process&sort_by=unique_scans_n&json=1&page_size=20'
  );

  const offData = await offResponse.json();

  const offProducts: OffProduct[] = offData.products || [];

  const productos: Producto[] = [];
  for (const offProduct of offProducts) {
    const defaultName =
      offProduct.product_name_es ||
      offProduct.product_name ||
      offProduct.generic_name;
    if (!defaultName) continue;

    const { contenido, unidad } = parseQuantity(offProduct.quantity);

    const producto = productoRepo.create({
      nombre: defaultName.substring(0, 150),
      marca: (
        offProduct.brands ||
        offProduct.brands_tags?.[0] ||
        faker.company.name()
      ).substring(0, 100),
      descripcion: (
        offProduct.ingredients_text || faker.commerce.productDescription()
      ).substring(0, 500),
      unidad,
      fechaCaducidad: faker.datatype.boolean(0.3)
        ? faker.date.soon({ days: 60 })
        : undefined,
      tipo: mapTipoCategoria(offProduct.categories_tags),
      pathImg:
        offProduct.image_url || faker.image.url({ width: 640, height: 480 }),
      contenido,
      codigoBarras:
        offProduct.code?.substring(0, 50) ||
        faker.string.alphanumeric(13).toUpperCase(),
    });

    (producto as any)._alergenosTags = offProduct.allergens_tags || [];
    productos.push(producto);

    if (productos.length >= 15) break;
  }

  while (productos.length < 15) {
    const producto = productoRepo.create({
      nombre: faker.commerce.productName(),
      marca: faker.company.name(),
      descripcion: faker.commerce.productDescription(),
      unidad: faker.helpers.arrayElement(Object.values(UnidadProducto)),
      fechaCaducidad: faker.datatype.boolean(0.3)
        ? faker.date.soon({ days: 60 })
        : undefined,
      tipo: faker.helpers.arrayElement(Object.values(TipoProducto)),
      pathImg: faker.image.url({ width: 640, height: 480 }),
      contenido: faker.number.int({ min: 1, max: 1000 }),
      codigoBarras: faker.string.alphanumeric(10).toUpperCase(),
    });
    productos.push(producto);
  }

  const productosGuardados = await productoRepo.save(productos);

  const productoProveedores: ProductoProveedor[] = [];
  for (const producto of productosGuardados) {
    const numProveedores = faker.number.int({
      min: 1,
      max: Math.min(3, proveedores.length),
    });

    const proveedoresAleatorios = faker.helpers.arrayElements(
      proveedores,
      numProveedores
    );

    for (const proveedor of proveedoresAleatorios) {
      const pp = productoProveedorRepo.create({
        producto,
        proveedor,
        precioUnitario: parseFloat(faker.commerce.price({ min: 5, max: 200 })),
        marca: producto.marca,
        codigoBarras:
          producto.codigoBarras || faker.string.numeric({ length: 13 }),
      });
      productoProveedores.push(pp);
    }
  }
  await productoProveedorRepo.save(productoProveedores);

  const alergenos: ProductoAlergeno[] = [];
  for (const producto of productosGuardados) {
    const baseAlergenosTags: string[] = (producto as any)._alergenosTags || [];
    const alergenosMapeados = new Set<AlergenoProducto>();

    for (const tag of baseAlergenosTags) {
      const mapeado = mapAlergeno(tag);
      if (mapeado) alergenosMapeados.add(mapeado);
    }

    if (alergenosMapeados.size === 0 && !baseAlergenosTags.length) {
      const numAlergenos = faker.number.int({ min: 0, max: 2 });
      const seleccionados = faker.helpers.arrayElements(
        Object.values(AlergenoProducto),
        numAlergenos
      );
      for (const al of seleccionados) alergenosMapeados.add(al);
    }

    for (const alergeno of alergenosMapeados) {
      alergenos.push(productoAlergenoRepo.create({ producto, alergeno }));
    }
  }

  if (alergenos.length > 0) await productoAlergenoRepo.save(alergenos);

  console.log(SeederI18nHelper.getSeederSuccess('productos'));
};
