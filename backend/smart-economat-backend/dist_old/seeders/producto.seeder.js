"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "runSeeder", {
    enumerable: true,
    get: function() {
        return runSeeder;
    }
});
const _productoentity = require("../modules/producto/producto.entity/producto.entity");
const _productoproveedorentity = require("../modules/producto/producto-proveedor.entity/producto-proveedor.entity");
const _productoalergenoentity = require("../modules/producto/producto-alergeno.entity/producto-alergeno.entity");
const _proveedorentity = require("../modules/proveedor/proveedor.entity/proveedor.entity");
const _productoenums = require("../modules/producto/enums/producto.enums");
const _seederi18nhelper = require("../common/helpers/seeder-i18n.helper");
function mapAlergeno(offTag) {
    const map = {
        'en:gluten': _productoenums.Alergeno.GLUTEN,
        'en:crustaceans': _productoenums.Alergeno.CRUSTACEOS,
        'en:eggs': _productoenums.Alergeno.HUEVOS,
        'en:fish': _productoenums.Alergeno.PESCADO,
        'en:peanuts': _productoenums.Alergeno.CACAHUETES,
        'en:soybeans': _productoenums.Alergeno.SOJA,
        'en:milk': _productoenums.Alergeno.LACTEOS,
        'en:nuts': _productoenums.Alergeno.FRUTOS_CON_CASCARA,
        'en:celery': _productoenums.Alergeno.APIO,
        'en:mustard': _productoenums.Alergeno.MOSTAZA,
        'en:sesame-seeds': _productoenums.Alergeno.SESAMO,
        'en:sulphur-dioxide-and-sulphites': _productoenums.Alergeno.SULFITO,
        'en:lupin': _productoenums.Alergeno.ALTRAMUCES,
        'en:molluscs': _productoenums.Alergeno.MOLUSCOS
    };
    return map[offTag] || null;
}
function mapTipoCategoria(tags = []) {
    const tagStr = tags.join(' ').toLowerCase();
    if (tagStr.includes('beverage') || tagStr.includes('drink')) return _productoenums.TipoProducto.BEBIDA;
    if (tagStr.includes('meat')) return _productoenums.TipoProducto.CARNE;
    if (tagStr.includes('seafood') || tagStr.includes('fish')) return _productoenums.TipoProducto.PESCADO;
    if (tagStr.includes('dairy') || tagStr.includes('milk') || tagStr.includes('cheese')) return _productoenums.TipoProducto.LACTEO;
    if (tagStr.includes('fruit')) return _productoenums.TipoProducto.FRUTA;
    if (tagStr.includes('vegetable')) return _productoenums.TipoProducto.VERDURA;
    if (tagStr.includes('cereal')) return _productoenums.TipoProducto.CEREAL;
    if (tagStr.includes('legume')) return _productoenums.TipoProducto.LEGUMBRE;
    if (tagStr.includes('nut')) return _productoenums.TipoProducto.FRUTO_SECO;
    if (tagStr.includes('egg')) return _productoenums.TipoProducto.HUEVO;
    if (tagStr.includes('oil')) return _productoenums.TipoProducto.ACEITE;
    if (tagStr.includes('sugar') || tagStr.includes('sweet')) return _productoenums.TipoProducto.AZUCAR;
    if (tagStr.includes('condiment') || tagStr.includes('sauce')) return _productoenums.TipoProducto.CONDIMENTO;
    return _productoenums.TipoProducto.OTRO;
}
function parseQuantity(q) {
    if (!q) return {
        contenido: 1,
        unidad: _productoenums.UnidadMedida.UNIDAD
    };
    const match = q.toLowerCase().match(/([0-9.,]+)\s*(kg|g|l|ml|cl)/);
    if (!match) return {
        contenido: 1,
        unidad: _productoenums.UnidadMedida.UNIDAD
    };
    let val = parseFloat(match[1].replace(',', '.'));
    let unidad = _productoenums.UnidadMedida.UNIDAD;
    if (match[2] === 'kg') unidad = _productoenums.UnidadMedida.KG;
    else if (match[2] === 'g') unidad = _productoenums.UnidadMedida.G;
    else if (match[2] === 'l') unidad = _productoenums.UnidadMedida.L;
    else if (match[2] === 'ml') unidad = _productoenums.UnidadMedida.ML;
    else if (match[2] === 'cl') {
        unidad = _productoenums.UnidadMedida.ML;
        val *= 10;
    }
    return {
        contenido: val,
        unidad
    };
}
const runSeeder = async (dataSource)=>{
    const productoRepo = dataSource.getRepository(_productoentity.Producto);
    const proveedorRepo = dataSource.getRepository(_proveedorentity.Proveedor);
    const productoProveedorRepo = dataSource.getRepository(_productoproveedorentity.ProductoProveedor);
    const productoAlergenoRepo = dataSource.getRepository(_productoalergenoentity.ProductoAlergeno);
    const proveedores = await proveedorRepo.find();
    if (proveedores.length === 0) {
        throw new Error(_seederi18nhelper.SeederI18nHelper.getError('NO_PROVEEDORES'));
    }
    console.log('Obteniendo productos de OpenFoodFacts...');
    let offProducts = [];
    try {
        const offResponse = await fetch('https://es.openfoodfacts.org/cgi/search.pl?action=process&sort_by=unique_scans_n&json=1&page_size=50', {
            signal: AbortSignal.timeout(30000)
        });
        if (offResponse.ok) {
            const offData = await offResponse.json();
            offProducts = offData.products || [];
        }
    } catch (error) {
        console.warn('No se pudieron obtener productos de OpenFoodFacts:', error.message);
    }
    const productosDB = await productoRepo.find({
        select: [
            'codigoBarras'
        ]
    });
    const codigosVistos = new Set(productosDB.filter((p)=>p.codigoBarras).map((p)=>p.codigoBarras));
    const productos = [];
    for (const offProduct of offProducts){
        const defaultName = offProduct.product_name_es || offProduct.product_name || offProduct.generic_name;
        if (!defaultName) continue;
        const { contenido, unidad } = parseQuantity(offProduct.quantity);
        const getRandomDate = ()=>new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000);
        const getRandomBarcode = ()=>Math.random().toString().slice(2, 15).padEnd(13, '0');
        let codigoBarras = offProduct.code?.substring(0, 50);
        if (!codigoBarras) codigoBarras = getRandomBarcode();
        if (codigosVistos.has(codigoBarras)) {
            continue;
        }
        codigosVistos.add(codigoBarras);
        const producto = productoRepo.create({
            nombre: defaultName.substring(0, 150),
            marca: (offProduct.brands || offProduct.brands_tags?.[0] || 'Marca Genérica').substring(0, 100),
            descripcion: (offProduct.ingredients_text || 'Sin descripción disponible.').substring(0, 500),
            unidad,
            fechaCaducidad: Math.random() > 0.7 ? getRandomDate() : undefined,
            tipo: mapTipoCategoria(offProduct.categories_tags),
            pathImg: offProduct.image_url || 'https://via.placeholder.com/640x480.png?text=Sin+Imagen',
            contenido,
            codigoBarras
        });
        producto._alergenosTags = offProduct.allergens_tags || [];
        productos.push(producto);
        if (productos.length >= 25) break;
    }
    if (productos.length === 0) {
        console.warn('No hay productos válidos para insertar.');
        return;
    }
    const productosGuardados = await productoRepo.save(productos);
    const productoProveedores = [];
    for (const producto of productosGuardados){
        const maxProv = Math.min(3, proveedores.length);
        const numProveedores = Math.floor(Math.random() * maxProv) + 1;
        const proveedoresAleatorios = [
            ...proveedores
        ].sort(()=>Math.random() - 0.5).slice(0, numProveedores);
        for (const proveedor of proveedoresAleatorios){
            const precioRandom = (Math.random() * (200 - 5) + 5).toFixed(2);
            const pp = productoProveedorRepo.create({
                producto,
                proveedor,
                precioUnitario: parseFloat(precioRandom),
                marca: producto.marca,
                codigoBarras: producto.codigoBarras || Math.random().toString().slice(2, 15).padEnd(13, '0')
            });
            productoProveedores.push(pp);
        }
    }
    await productoProveedorRepo.save(productoProveedores);
    const alergenos = [];
    for (const producto of productosGuardados){
        const baseAlergenosTags = producto._alergenosTags || [];
        const alergenosMapeados = new Set();
        for (const tag of baseAlergenosTags){
            const mapeado = mapAlergeno(tag);
            if (mapeado) alergenosMapeados.add(mapeado);
        }
        for (const alergeno of alergenosMapeados){
            alergenos.push(productoAlergenoRepo.create({
                producto,
                alergeno
            }));
        }
    }
    if (alergenos.length > 0) await productoAlergenoRepo.save(alergenos);
    console.log(_seederi18nhelper.SeederI18nHelper.getSeederSuccess('productos'));
};

//# sourceMappingURL=producto.seeder.js.map