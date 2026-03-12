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
const _recetaentity = require("../modules/receta/receta.entity/receta.entity");
const _recetaingredienteentity = require("../modules/receta/receta-ingrediente.entity/receta-ingrediente.entity");
const _productoentity = require("../modules/producto/producto.entity/producto.entity");
const _recetaenums = require("../modules/receta/enums/receta.enums");
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
const NUM_RECETAS = 10;
const runSeeder = async (dataSource)=>{
    const { faker } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("@faker-js/faker")));
    const recetaRepo = dataSource.getRepository(_recetaentity.Receta);
    const ingredienteRepo = dataSource.getRepository(_recetaingredienteentity.RecetaIngrediente);
    const productoRepo = dataSource.getRepository(_productoentity.Producto);
    const productos = await productoRepo.find();
    if (productos.length === 0) {
        throw new Error(_seederi18nhelper.SeederI18nHelper.getError('NO_PRODUCTOS'));
    }
    for(let i = 0; i < NUM_RECETAS; i++){
        const receta = recetaRepo.create({
            nombre: faker.commerce.productName(),
            instrucciones: faker.lorem.paragraphs(2).slice(0, 2000),
            tiempo: faker.helpers.arrayElement(Object.values(_recetaenums.TiempoReceta)),
            dificultad: faker.helpers.arrayElement(Object.values(_recetaenums.DificultadReceta)),
            tiempoPreparacion: `${faker.number.int({
                min: 10,
                max: 60
            })} min`
        });
        const recetaGuardada = await recetaRepo.save(receta);
        const numIngredientes = faker.number.int({
            min: 2,
            max: 5
        });
        const productosAleatorios = faker.helpers.arrayElements(productos, numIngredientes);
        const ingredientes = productosAleatorios.map((producto)=>ingredienteRepo.create({
                receta: recetaGuardada,
                producto,
                cantidad: faker.number.float({
                    min: 50,
                    max: 500,
                    multipleOf: 0.5
                }),
                unidad: faker.helpers.arrayElement(Object.values(_recetaenums.UnidadIngrediente))
            }));
        await ingredienteRepo.save(ingredientes);
    }
    console.log(_seederi18nhelper.SeederI18nHelper.getSeederSuccess('recetas'));
};

//# sourceMappingURL=receta.seeder.js.map