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
const _albaranentity = require("../modules/albaran/albaran.entity/albaran.entity");
const _recepcionpedidoentity = require("../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity");
const _albaranpedidorecepcionentity = require("../modules/albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity");
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
    const albaranRepo = dataSource.getRepository(_albaranentity.Albaran);
    const recepcionPedidoRepo = dataSource.getRepository(_recepcionpedidoentity.RecepcionPedido);
    const albaranPedidoRepo = dataSource.getRepository(_albaranpedidorecepcionentity.AlbaranPedidoRecepcion);
    await dataSource.query(`TRUNCATE TABLE "albaran_pedido_recepcion" RESTART IDENTITY CASCADE;`);
    await dataSource.query(`TRUNCATE TABLE "albaran" RESTART IDENTITY CASCADE;`);
    const recepcionPedidos = await recepcionPedidoRepo.find({
        relations: [
            'pedido',
            'recepcion'
        ]
    });
    if (!recepcionPedidos.length) {
        throw new Error(_seederi18nhelper.SeederI18nHelper.getError('NO_RECEPCIONES_PRODUCTOS'));
    }
    const albaranes = [];
    for(let i = 0; i < 5; i++){
        const nAlbaran = `ALB-${faker.date.future().getFullYear()}-${faker.string.numeric(4).padStart(4, '0')}`;
        const albaran = albaranRepo.create({
            nAlbaran,
            concordancia: faker.datatype.boolean(),
            fecha: faker.date.recent({
                days: 10
            })
        });
        albaranes.push(albaran);
    }
    const savedAlbaranes = await albaranRepo.save(albaranes);
    for (const albaran of savedAlbaranes){
        const randomLinks = faker.helpers.arrayElements(recepcionPedidos, {
            min: 1,
            max: 3
        });
        for (const rp of randomLinks){
            const link = albaranPedidoRepo.create({
                albaran,
                recepcionPedido: rp
            });
            await albaranPedidoRepo.save(link);
        }
    }
    console.log(_seederi18nhelper.SeederI18nHelper.getSeederSuccess('albaranes'));
};

//# sourceMappingURL=albaran.seeder.js.map