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
const _historialentity = require("../modules/producto/historial-precio-proveedor.entity/historial.entity");
const _productoproveedorentity = require("../modules/producto/producto-proveedor.entity/producto-proveedor.entity");
const _seederi18nhelper = require("../common/helpers/seeder-i18n.helper");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const runSeeder = async (dataSource)=>{
    const { faker } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("@faker-js/faker")));
    const historialRepo = dataSource.getRepository(_historialentity.HistorialPrecio);
    const productoProveedorRepo = dataSource.getRepository(_productoproveedorentity.ProductoProveedor);
    await dataSource.query(`TRUNCATE TABLE "historial_precio" RESTART IDENTITY CASCADE;`);
    const productosProv = await productoProveedorRepo.find();
    if (productosProv.length === 0) {
        throw new Error(_seederi18nhelper.SeederI18nHelper.getError('NO_PRODUCTOS_PROVEEDOR'));
    }
    const historiales = [];
    for (const pp of productosProv){
        const numHistoriales = faker.number.int({
            min: 1,
            max: 5
        });
        const precioActual = pp.precioUnitario || 10;
        for(let i = 0; i < numHistoriales; i++){
            const variacion = faker.number.float({
                min: -0.3,
                max: 0.5
            });
            const precioAnterior = parseFloat((precioActual * (1 + variacion)).toFixed(2));
            const historial = new _historialentity.HistorialPrecio();
            historial.productoProveedor = pp;
            historial.precio = precioAnterior;
            historial.fecha = faker.date.recent({
                days: 3
            });
            historiales.push(historial);
        }
    }
    if (historiales.length > 0) {
        await historialRepo.save(historiales);
    }
    console.log(_seederi18nhelper.SeederI18nHelper.getSeederSuccess('historial_precio'));
};

//# sourceMappingURL=historial-precio.seeder.js.map