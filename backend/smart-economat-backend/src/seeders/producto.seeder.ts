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
  const productoRepo = dataSource.getRepository(Producto);
  const proveedorRepo = dataSource.getRepository(Proveedor);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);
  const productoAlergenoRepo = dataSource.getRepository(ProductoAlergeno);

  const proveedores = await proveedorRepo.find();
  if (proveedores.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_PROVEEDORES'));
  }

  let offProducts: OffProduct[] = [];
  try {
    if (process.env.NODE_ENV === 'test') {
      console.log(
        'Ambiente de test detectado, saltando OpenFoodFacts para ahorrar tiempo.'
      );
    } else {
      console.log('Obteniendo productos de OpenFoodFacts...');
      const offResponse = await fetch(
        'https://es.openfoodfacts.org/cgi/search.pl?action=process&sort_by=unique_scans_n&json=1&page_size=20',
        { signal: AbortSignal.timeout(30000) }
      );

      if (offResponse.ok) {
        const offData = await offResponse.json();
        offProducts = offData.products || [];
      }
    }
  } catch (error: any) {
    console.warn(
      'No se pudieron obtener productos de OpenFoodFacts:',
      error.message
    );
  }

  const productosDB = await productoRepo.find({ select: ['codigoBarras'] });
  const codigosVistos = new Set<string>(
    productosDB.filter((p) => p.codigoBarras).map((p) => p.codigoBarras!)
  );

  const productos: Producto[] = [];

  for (const offProduct of offProducts) {
    const defaultName =
      offProduct.product_name_es ||
      offProduct.product_name ||
      offProduct.generic_name;
    if (!defaultName) continue;

    const { contenido, unidad } = parseQuantity(offProduct.quantity);

    const getRandomDate = () =>
      new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000);
    const getRandomBarcode = () =>
      Math.random().toString().slice(2, 15).padEnd(13, '0');

    let codigoBarras = offProduct.code?.substring(0, 50);
    if (!codigoBarras) codigoBarras = getRandomBarcode();

    if (codigosVistos.has(codigoBarras)) {
      continue;
    }
    codigosVistos.add(codigoBarras);

    const producto = productoRepo.create({
      nombre: defaultName.substring(0, 150),
      marca: (
        offProduct.brands ||
        offProduct.brands_tags?.[0] ||
        'Marca Genérica'
      ).substring(0, 100),
      descripcion: (
        offProduct.ingredients_text || 'Sin descripción disponible.'
      ).substring(0, 500),
      unidad,
      fechaCaducidad: Math.random() > 0.7 ? getRandomDate() : undefined,
      tipo: mapTipoCategoria(offProduct.categories_tags),
      pathImg:
        offProduct.image_url ||
        'https://via.placeholder.com/640x480.png?text=Sin+Imagen',
      contenido,
      codigoBarras,
    });

    (producto as any)._alergenosTags = offProduct.allergens_tags || [];
    productos.push(producto);

    if (productos.length >= 25) break;
  }

  if (productos.length === 0) {
    console.warn('No hay productos válidos para insertar.');
    return;
  }

  const productosGuardados = await productoRepo.save(productos);

  const productoProveedores: ProductoProveedor[] = [];
  for (const producto of productosGuardados) {
    const maxProv = Math.min(3, proveedores.length);
    const numProveedores = Math.floor(Math.random() * maxProv) + 1;

    const proveedoresAleatorios = [...proveedores]
      .sort(() => Math.random() - 0.5)
      .slice(0, numProveedores);

    for (const proveedor of proveedoresAleatorios) {
      const precioRandom = (Math.random() * (200 - 5) + 5).toFixed(2);
      const pp = productoProveedorRepo.create({
        producto,
        proveedor,
        precioUnitario: parseFloat(precioRandom),
        marca: producto.marca,
        codigoBarras:
          producto.codigoBarras ||
          Math.random().toString().slice(2, 15).padEnd(13, '0'),
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
