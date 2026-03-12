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
const _pedidoentity = require("../modules/pedido/pedido.entity/pedido.entity");
const _pedidoproductoentity = require("../modules/pedido/pedido-producto.entity/pedido-producto.entity");
const _usuarioentity = require("../modules/usuario/usuario.entity/usuario.entity");
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
    const pedidoRepo = dataSource.getRepository(_pedidoentity.Pedido);
    const pedidoProductoRepo = dataSource.getRepository(_pedidoproductoentity.PedidoProducto);
    const usuarioRepo = dataSource.getRepository(_usuarioentity.Usuario);
    const proveedorRepo = dataSource.getRepository(_proveedorentity.Proveedor);
    const usuarios = await usuarioRepo.find();
    const proveedores = await proveedorRepo.find({
        relations: [
            'productos'
        ]
    });
    const proveedoresValidos = proveedores.filter((p)=>p.productos && p.productos.length > 0);
    if (usuarios.length === 0) {
        throw new Error(_seederi18nhelper.SeederI18nHelper.getError('NO_USUARIOS'));
    }
    if (proveedoresValidos.length === 0) {
        throw new Error(_seederi18nhelper.SeederI18nHelper.getError('NO_PRODUCTOS_PROVEEDOR'));
    }
    for(let i = 0; i < 8; i++){
        const randomProveedor = faker.helpers.arrayElement(proveedoresValidos);
        const pedido = pedidoRepo.create({
            usuario: faker.helpers.arrayElement(usuarios),
            proveedor: randomProveedor,
            fechaPedido: faker.date.recent({
                days: 7
            }),
            fechaEntrega: faker.date.soon({
                days: 14
            }),
            estado: faker.helpers.arrayElement(Object.values(_pedidoentity.EstadoPedido)),
            costeTotal: 0
        });
        if (pedido.estado === _pedidoentity.EstadoPedido.CANCELADO) {
            pedido.motivoCancelacion = faker.lorem.sentence();
        }
        const numItems = faker.number.int({
            min: 1,
            max: Math.min(5, randomProveedor.productos.length)
        });
        const itemsSeleccionados = faker.helpers.arrayElements(randomProveedor.productos, numItems);
        let acumuladoTotal = 0;
        const detallesPedido = [];
        for (const pp of itemsSeleccionados){
            const cantidad = faker.number.int({
                min: 1,
                max: 10
            });
            const precioUnitario = pp.precioUnitario || parseFloat(faker.commerce.price({
                min: 10,
                max: 500
            }));
            acumuladoTotal += precioUnitario * cantidad;
            detallesPedido.push(pedidoProductoRepo.create({
                productoProveedor: pp,
                cantidad: cantidad,
                precioUnitario: precioUnitario,
                observaciones: faker.datatype.boolean() ? faker.lorem.sentence() : undefined
            }));
        }
        pedido.pedidoProductos = detallesPedido;
        pedido.costeTotal = parseFloat(acumuladoTotal.toFixed(2));
        await pedidoRepo.save(pedido);
    }
    console.log(_seederi18nhelper.SeederI18nHelper.getSeederSuccess('pedidos'));
};

//# sourceMappingURL=pedido.seeder.js.map