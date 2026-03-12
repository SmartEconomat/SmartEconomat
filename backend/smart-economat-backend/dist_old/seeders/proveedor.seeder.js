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
const _proveedorentity = require("../modules/proveedor/proveedor.entity/proveedor.entity");
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
    const proveedorRepo = dataSource.getRepository(_proveedorentity.Proveedor);
    await dataSource.query(`TRUNCATE TABLE "proveedor" RESTART IDENTITY CASCADE;`);
    const proveedores = [];
    for(let i = 0; i < 10; i++){
        const proveedor = new _proveedorentity.Proveedor();
        proveedor.nombre = faker.company.name();
        proveedor.email = faker.internet.email();
        proveedor.direccion = faker.location.streetAddress();
        proveedor.nif = faker.string.alphanumeric(9).toUpperCase();
        const telefonoCompleto = faker.phone.number();
        proveedor.telefono = telefonoCompleto.length > 50 ? telefonoCompleto.substring(0, 50) : telefonoCompleto;
        proveedores.push(proveedor);
    }
    await proveedorRepo.save(proveedores);
    console.log(_seederi18nhelper.SeederI18nHelper.getSeederSuccess('proveedores'));
};

//# sourceMappingURL=proveedor.seeder.js.map