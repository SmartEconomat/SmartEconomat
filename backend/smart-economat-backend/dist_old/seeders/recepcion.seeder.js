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
const _recepcionentity = require("../modules/recepcion/recepcion.entity/recepcion.entity");
const _recepcionpedidoentity = require("../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity");
const _recepcionproductoentity = require("../modules/recepcion/recepcion-productos.entity/recepcion-producto.entity");
const _pedidoentity = require("../modules/pedido/pedido.entity/pedido.entity");
const _pedidoproductoentity = require("../modules/pedido/pedido-producto.entity/pedido-producto.entity");
const _usuarioentity = require("../modules/usuario/usuario.entity/usuario.entity");
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
    const recepcionRepo = dataSource.getRepository(_recepcionentity.Recepcion);
    const recepcionPedidoRepo = dataSource.getRepository(_recepcionpedidoentity.RecepcionPedido);
    const recepcionProductoRepo = dataSource.getRepository(_recepcionproductoentity.RecepcionProducto);
    const pedidoRepo = dataSource.getRepository(_pedidoentity.Pedido);
    const pedidoProductoRepo = dataSource.getRepository(_pedidoproductoentity.PedidoProducto);
    const usuarioRepo = dataSource.getRepository(_usuarioentity.Usuario);
    const pedidos = await pedidoRepo.find();
    const usuarios = await usuarioRepo.find();
    if (pedidos.length === 0) {
        throw new Error(_seederi18nhelper.SeederI18nHelper.getError('NO_PEDIDOS'));
    }
    if (usuarios.length === 0) {
        throw new Error(_seederi18nhelper.SeederI18nHelper.getError('NO_USUARIOS'));
    }
    for (const pedido of pedidos){
        const pedidoProductos = await pedidoProductoRepo.find({
            where: {
                pedido: {
                    id: pedido.id
                }
            },
            relations: [
                'productoProveedor'
            ]
        });
        if (pedidoProductos.length === 0) continue;
        const recepcion = recepcionRepo.create({
            usuario: faker.helpers.arrayElement(usuarios),
            fechaRecepcion: faker.date.recent({
                days: 3
            }),
            observaciones: faker.datatype.boolean(0.4) ? faker.lorem.sentence() : undefined
        });
        const recepcionGuardada = await recepcionRepo.save(recepcion);
        const rp = recepcionPedidoRepo.create({
            recepcion: recepcionGuardada,
            pedido: pedido,
            fechaVinculacion: faker.date.recent()
        });
        await recepcionPedidoRepo.save(rp);
        const numRecibir = faker.number.int({
            min: 1,
            max: pedidoProductos.length
        });
        const seleccionados = faker.helpers.arrayElements(pedidoProductos, numRecibir);
        const recepcionesProd = [];
        for (const pp of seleccionados){
            const cantidadPedida = Number(pp.cantidad);
            const recibida = faker.number.int({
                min: 1,
                max: Math.floor(cantidadPedida)
            });
            recepcionesProd.push(recepcionProductoRepo.create({
                recepcion: recepcionGuardada,
                pedidoProducto: pp,
                cantidadRecibida: recibida,
                observaciones: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : undefined,
                fechaRecepcion: faker.date.recent()
            }));
        }
        if (recepcionesProd.length > 0) {
            await recepcionProductoRepo.save(recepcionesProd);
        }
    }
    console.log(_seederi18nhelper.SeederI18nHelper.getSeederSuccess('recepciones'));
};

//# sourceMappingURL=recepcion.seeder.js.map