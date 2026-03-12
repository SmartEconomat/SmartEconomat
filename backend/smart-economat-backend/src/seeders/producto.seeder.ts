import { DataSource } from 'typeorm';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { ProductoAlergeno } from '../modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';
import {
  UnidadMedida,
  TipoProducto,
  Alergeno,
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
  unidad: UnidadMedida;
} {
  if (!q) return { contenido: 1, unidad: UnidadMedida.UNIDAD };
  const match = q.toLowerCase().match(/([0-9.,]+)\s*(kg|g|l|ml|cl)/);
  if (!match) return { contenido: 1, unidad: UnidadMedida.UNIDAD };

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
  let offProducts: OffProduct[] = [];
  try {
    const offResponse = await fetch(
      'https://es.openfoodfacts.org/cgi/search.pl?action=process&sort_by=unique_scans_n&json=1&page_size=100',
      { signal: AbortSignal.timeout(30000) }
    );

    if (offResponse.ok) {
      const offData = await offResponse.json();
      offProducts = offData.products || [];
    } else {
      console.error(
        'Error al contactar con OpenFoodFacts:',
        offResponse.statusText
      );
    }
  } catch (error) {
    console.error(
      'No se pudieron obtener productos de OpenFoodFacts:',
      error.message
    );
  }

  const productosDB = await productoRepo.find({ select: ['codigoBarras'] });
  const codigosVistos = new Set<string>(
    productosDB.filter((p) => p.codigoBarras).map((p) => p.codigoBarras!)
  );

  const productos: Producto[] = [];

  if (offProducts.length === 0) {
    console.warn(
      'No se pudieron obtener productos de OpenFoodFacts o la lista está vacía. Usando datos de respaldo...'
    );
    // Generar productos de respaldo con Faker
    for (let i = 0; i < 20; i++) {
      const productName = faker.commerce.productName().substring(0, 100);
      const code = faker.commerce.isbn({ variant: 13 }).replace(/-/g, '').substring(0, 13);
      
      const { contenido, unidad } = parseQuantity(faker.helpers.arrayElement(['1kg', '500g', '1l', '250ml', '1 unidad']));

      const producto = productoRepo.create({
        nombre: productName,
        marca: faker.company.name().substring(0, 100),
        descripcion: faker.commerce.productDescription().substring(0, 1000), // Text field, can be long
        unidad,
        tipo: faker.helpers.arrayElement(Object.values(TipoProducto)),
        contenido,
        codigoBarras: code,
      });

      if (!codigosVistos.has(producto.codigoBarras!)) {
        codigosVistos.add(producto.codigoBarras!);
        (producto as any)._alergenosTags = [];
        productos.push(producto);
      }
    }
  } else {
    for (const offProduct of offProducts) {
      const defaultName =
        offProduct.product_name_es ||
        offProduct.product_name ||
        offProduct.generic_name;

      if (!defaultName || !offProduct.code) continue;

      const { contenido, unidad } = parseQuantity(offProduct.quantity);

      const producto = productoRepo.create({
        nombre: defaultName.substring(0, 100),
        marca: (offProduct.brands || offProduct.brands_tags?.[0] || '').substring(
          0,
          100
        ),
        descripcion: (offProduct.ingredients_text || '').substring(0, 1000),
        unidad,
        fechaCaducidad: faker.datatype.boolean(0.3)
          ? faker.date.soon({ days: 60 })
          : undefined,
        tipo: mapTipoCategoria(offProduct.categories_tags),
        pathImg: offProduct.image_url?.substring(0, 200),
        contenido,
        codigoBarras: offProduct.code.replace(/[^0-9]/g, '').substring(0, 13),
      });

      if (!producto.codigoBarras || codigosVistos.has(producto.codigoBarras)) {
        continue;
      }
      codigosVistos.add(producto.codigoBarras);

      (producto as any)._alergenosTags = offProduct.allergens_tags || [];
      productos.push(producto);
    }
  }

  if (productos.length === 0) {
    console.warn('No se pudieron crear productos.');
    return;
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
        codigoBarras: producto.codigoBarras!,
      });
      productoProveedores.push(pp);
    }
  }
  await productoProveedorRepo.save(productoProveedores);

  const alergenos: ProductoAlergeno[] = [];
  for (const producto of productosGuardados) {
    const baseAlergenosTags: string[] = (producto as any)._alergenosTags || [];
    const alergenosMapeados = new Set<Alergeno>();

    for (const tag of baseAlergenosTags) {
      const mapeado = mapAlergeno(tag);
      if (mapeado) alergenosMapeados.add(mapeado);
    }

    for (const alergeno of alergenosMapeados) {
      alergenos.push(productoAlergenoRepo.create({ producto, alergeno }));
    }
  }

  if (alergenos.length > 0) await productoAlergenoRepo.save(alergenos);

  console.log(SeederI18nHelper.getSeederSuccess('productos'));
};
