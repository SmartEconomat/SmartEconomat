import { faker } from '@faker-js/faker';
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
import { SeedContext } from './seed-context';

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

function loadTestProducts(): OffProduct[] {
  faker.seed(20260322);

  const quantities = ['250 g', '500 g', '1 kg', '2 kg', '330 ml', '1 l'];
  const categories = [
    ['en:vegetables'],
    ['en:fruits'],
    ['en:dairy'],
    ['en:cereals'],
    ['en:meat'],
    ['en:fish'],
    ['en:legumes'],
    ['en:beverages'],
    ['en:condiments'],
  ];
  const allergenPools = [
    [],
    ['en:gluten'],
    ['en:milk'],
    ['en:eggs'],
    ['en:soybeans'],
    ['en:nuts'],
  ];

  return Array.from({ length: 18 }, (_, index) => ({
    product_name_es: `${faker.commerce.productName()} Test ${index + 1}`,
    generic_name: faker.commerce.productDescription(),
    quantity: faker.helpers.arrayElement(quantities),
    brands: faker.company.name(),
    categories_tags: faker.helpers.arrayElement(categories),
    ingredients_text: faker.lorem.sentence(),
    image_url: faker.image.urlPicsumPhotos({ width: 640, height: 480 }),
    code: String(8400000000000 + index),
    allergens_tags: faker.helpers.arrayElement(allergenPools),
  }));
}

function buildFallbackProducts(): Array<{
  nombre: string;
  marca: string;
  descripcion: string;
  unidad: UnidadMedida;
  tipo: TipoProducto;
  contenido: number;
  codigoBarras: string;
}> {
  return [
    {
      nombre: 'Arroz redondo',
      marca: 'Smart Base',
      descripcion: 'Arroz de grano corto para cocina diaria.',
      unidad: UnidadMedida.KG,
      tipo: TipoProducto.CEREAL,
      contenido: 1,
      codigoBarras: '8400000000001',
    },
    {
      nombre: 'Leche entera',
      marca: 'Smart Base',
      descripcion: 'Leche entera UHT para cocina y desayunos.',
      unidad: UnidadMedida.L,
      tipo: TipoProducto.LACTEO,
      contenido: 1,
      codigoBarras: '8400000000002',
    },
    {
      nombre: 'Aceite de oliva suave',
      marca: 'Smart Base',
      descripcion: 'Aceite de oliva suave para fritura y plancha.',
      unidad: UnidadMedida.L,
      tipo: TipoProducto.ACEITE,
      contenido: 1,
      codigoBarras: '8400000000003',
    },
    {
      nombre: 'Pechuga de pollo',
      marca: 'Smart Base',
      descripcion: 'Pechuga de pollo fresca refrigerada.',
      unidad: UnidadMedida.KG,
      tipo: TipoProducto.CARNE,
      contenido: 1,
      codigoBarras: '8400000000004',
    },
    {
      nombre: 'Tomate triturado',
      marca: 'Smart Base',
      descripcion: 'Tomate triturado en conserva.',
      unidad: UnidadMedida.G,
      tipo: TipoProducto.VERDURA,
      contenido: 400,
      codigoBarras: '8400000000005',
    },
    {
      nombre: 'Garbanzos cocidos',
      marca: 'Smart Base',
      descripcion: 'Legumbre cocida lista para usar.',
      unidad: UnidadMedida.G,
      tipo: TipoProducto.LEGUMBRE,
      contenido: 570,
      codigoBarras: '8400000000006',
    },
    {
      nombre: 'Merluza congelada',
      marca: 'Smart Base',
      descripcion: 'Filete de merluza ultracongelado.',
      unidad: UnidadMedida.KG,
      tipo: TipoProducto.PESCADO,
      contenido: 1,
      codigoBarras: '8400000000007',
    },
    {
      nombre: 'Zumo de naranja',
      marca: 'Smart Base',
      descripcion: 'Bebida refrigerada sabor naranja.',
      unidad: UnidadMedida.L,
      tipo: TipoProducto.BEBIDA,
      contenido: 1,
      codigoBarras: '8400000000008',
    },
    {
      nombre: 'Huevos clase M',
      marca: 'Smart Base',
      descripcion: 'Docena de huevos frescos.',
      unidad: UnidadMedida.UNIDAD,
      tipo: TipoProducto.HUEVO,
      contenido: 12,
      codigoBarras: '8400000000009',
    },
    {
      nombre: 'Azúcar blanco',
      marca: 'Smart Base',
      descripcion: 'Azúcar blanco refinado.',
      unidad: UnidadMedida.KG,
      tipo: TipoProducto.AZUCAR,
      contenido: 1,
      codigoBarras: '8400000000010',
    },
  ];
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

export const runSeeder = async (context: SeedContext) => {
  const productoRepo = context.getRepository(Producto);
  const proveedorRepo = context.getRepository(Proveedor);
  const productoProveedorRepo = context.getRepository(ProductoProveedor);
  const productoAlergenoRepo = context.getRepository(ProductoAlergeno);

  const proveedores = await proveedorRepo.find();
  if (proveedores.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_PROVEEDORES'));
  }

  let offProducts: OffProduct[] = [];
  const productosExistentes = await productoRepo.find();

  if (process.env.NODE_ENV === 'test') {
    console.log('Generando productos faker para entorno de test...');
    offProducts = loadTestProducts();
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('Obteniendo productos de OpenFoodFacts...');
    try {
      const offResponse = await fetch(
        'https://es.openfoodfacts.org/cgi/search.pl?action=process&sort_by=unique_scans_n&json=1&page_size=1000',
        { signal: AbortSignal.timeout(60000) }
      );

      if (offResponse.ok) {
        const offData = await offResponse.json();
        offProducts = offData.products || [];
        console.log(
          `✅ ${offProducts.length} productos obtenidos de OpenFoodFacts.`
        );
      } else {
        console.warn(
          `OpenFoodFacts respondió con estado ${offResponse.status}`
        );
      }
    } catch (error: any) {
      console.warn(
        'No se pudieron obtener productos de OpenFoodFacts:',
        error.message
      );
    }

    if (offProducts.length === 0) {
      console.log('Cargando productos de prueba (Fallback)...');
      offProducts = loadTestProducts();
    }
  }

  if (offProducts.length === 0) {
    console.error(
      'No se han obtenido productos de OpenFoodFacts. Abortando seeder de productos.'
    );
    return;
  }

  const productosDB = await productoRepo.find({ select: ['codigoBarras'] });
  const codigosVistos = new Set<string>(
    productosDB.filter((p) => p.codigoBarras).map((p) => p.codigoBarras!)
  );

  const productos: Producto[] = [];
  const alergenosTagsMap = new Map<string, string[]>();

  for (const offProduct of offProducts) {
    const defaultName =
      offProduct.product_name_es ||
      offProduct.product_name ||
      offProduct.generic_name;

    if (!defaultName || !offProduct.code) continue;

    const { contenido, unidad } = parseQuantity(offProduct.quantity);
    const codigoBarras = offProduct.code.substring(0, 50);

    if (codigosVistos.has(codigoBarras)) {
      continue;
    }
    codigosVistos.add(codigoBarras);

    const producto = productoRepo.create({
      nombre: defaultName.substring(0, 150),
      marca: (
        offProduct.brands ||
        offProduct.brands_tags?.[0] ||
        'Marca Blanca'
      ).substring(0, 100),
      descripcion: (
        offProduct.ingredients_text || 'Sin descripción disponible.'
      ).substring(0, 500),
      unidad,
      tipo: mapTipoCategoria(offProduct.categories_tags),
      pathImg:
        offProduct.image_url ||
        'https://via.placeholder.com/640x480.png?text=Sin+Imagen',
      contenido,
      codigoBarras,
      pmp: 0,
    });

    const aTags =
      offProduct.allergens_tags && offProduct.allergens_tags.length > 0
        ? offProduct.allergens_tags
        : [];

    alergenosTagsMap.set(codigoBarras, aTags);
    productos.push(producto);
  }

  let productosGuardados: Producto[];

  if (productos.length > 0) {
    const CHUNK_SIZE = 500;
    productosGuardados = [];
    for (let i = 0; i < productos.length; i += CHUNK_SIZE) {
      const chunk = productos.slice(i, i + CHUNK_SIZE);
      const saved = await productoRepo.save(chunk);
      productosGuardados.push(...saved);
    }
  } else if (productosExistentes.length > 0) {
    console.warn(
      'No hay productos nuevos válidos para insertar. Se reutilizan productos existentes para regenerar relaciones con proveedores.'
    );
    productosGuardados = productosExistentes;
  } else {
    console.warn(
      'OpenFoodFacts no ha aportado productos utilizables. Se crea un lote local de respaldo.'
    );
    productosGuardados = await productoRepo.save(
      buildFallbackProducts().map((producto) => productoRepo.create(producto))
    );
  }

  const productoProveedores: ProductoProveedor[] = [];
  const ppsExistentes = await productoProveedorRepo.find({
    relations: ['producto'],
  });
  const idsConProveedor = new Set(ppsExistentes.map((pp) => pp.producto.id));

  const CHUNK_SIZE = 500;
  for (const producto of productosGuardados) {
    if (idsConProveedor.has(producto.id)) continue;

    const seed = parseInt(producto.id.substring(0, 8), 16) || 0;
    const numProveedores = (seed % 3) + 1;

    const proveedoresAleatorios = [...proveedores]
      .sort(
        (a, b) =>
          (parseInt(a.id.substring(0, 8), 16) || 0) -
          (parseInt(b.id.substring(0, 8), 16) || 0)
      )
      .slice(0, numProveedores);

    for (const proveedor of proveedoresAleatorios) {
      const precio = 5 + (seed % 100);
      const merma = seed % 15;

      const pp = productoProveedorRepo.create({
        producto,
        proveedor,
        precioUnitario: precio,
        mermaEsperada: merma,
        marca: producto.marca,
        codigoBarras: producto.codigoBarras,
        pmp: 0,
      });
      productoProveedores.push(pp);
    }
  }

  if (productoProveedores.length > 0) {
    console.log(
      `Guardando ${productoProveedores.length} vínculos de proveedores...`
    );
    for (let i = 0; i < productoProveedores.length; i += CHUNK_SIZE) {
      const chunk = productoProveedores.slice(i, i + CHUNK_SIZE);
      await productoProveedorRepo.save(chunk);
    }
  }

  const alergenos: ProductoAlergeno[] = [];
  const apsExistentes = await productoAlergenoRepo.find({
    relations: ['producto'],
  });
  const idsConAlergenos = new Set(apsExistentes.map((ap) => ap.producto.id));

  for (const producto of productosGuardados) {
    if (idsConAlergenos.has(producto.id)) continue;

    const baseAlergenosTags: string[] =
      alergenosTagsMap.get(producto.codigoBarras!) || [];
    const alergenosMapeados = new Set<Alergeno>();

    for (const tag of baseAlergenosTags) {
      const mapeado = mapAlergeno(tag) || mapAlergeno(tag.toLowerCase());
      if (mapeado) alergenosMapeados.add(mapeado);
    }

    for (const alergeno of alergenosMapeados) {
      alergenos.push(productoAlergenoRepo.create({ producto, alergeno }));
    }
  }

  if (alergenos.length > 0) {
    console.log(`Guardando ${alergenos.length} asociaciones de alérgenos...`);
    for (let i = 0; i < alergenos.length; i += CHUNK_SIZE) {
      const chunk = alergenos.slice(i, i + CHUNK_SIZE);
      await productoAlergenoRepo.save(chunk);
    }
  }

  console.log(SeederI18nHelper.getSeederSuccess('productos'));
};
