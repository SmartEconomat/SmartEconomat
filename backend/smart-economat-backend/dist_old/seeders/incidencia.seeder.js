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
const _incidenciaentity = require("../modules/incidencia/incidencia.entity/incidencia.entity");
const _recepcionpedidoentity = require("../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity");
const _incidencialineaentity = require("../modules/incidencia/incidencia-linea.entity/incidencia-linea.entity");
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
    const incidenciaRepo = dataSource.getRepository(_incidenciaentity.Incidencia);
    const incidenciaLineaRepo = dataSource.getRepository(_incidencialineaentity.IncidenciaLinea);
    const recepcionPedidoRepo = dataSource.getRepository(_recepcionpedidoentity.RecepcionPedido);
    const MAX_INCIDENCIA = 5;
    const recepcionPedidos = await recepcionPedidoRepo.find({
        relations: [
            'recepcion',
            'pedido',
            'pedido.pedidoProductos'
        ]
    });
    if (recepcionPedidos.length === 0) {
        throw new Error(_seederi18nhelper.SeederI18nHelper.getError('NO_RECEPCIONES'));
    }
    const incidencias = [];
    for(let i = 0; i < Math.min(MAX_INCIDENCIA, recepcionPedidos.length); i++){
        const rp = recepcionPedidos[i];
        const ppArr = rp.pedido.pedidoProductos;
        if (!ppArr || ppArr.length === 0) continue;
        const numDiffs = faker.number.int({
            min: 1,
            max: ppArr.length
        });
        const ppsToDiff = faker.helpers.arrayElements(ppArr, numDiffs);
        const lineas = ppsToDiff.map((pp)=>{
            const cantidadEsperada = Number(pp.cantidad);
            const cantidadRecibida = faker.number.int({
                min: 0,
                max: cantidadEsperada - 1
            });
            return incidenciaLineaRepo.create({
                pedidoProducto: pp,
                cantidadEsperada,
                cantidadRecibida,
                diferencia: cantidadRecibida - cantidadEsperada,
                tipoDiferencia: _incidencialineaentity.TipoDiferencia.FALTANTE,
                estadoReclamacion: _incidencialineaentity.EstadoReclamacion.PENDIENTE,
                observaciones: faker.helpers.maybe(()=>faker.lorem.sentence())
            });
        });
        const incidencia = incidenciaRepo.create({
            recepcion: rp.recepcion,
            pedido: rp.pedido,
            observacionesRecepcion: faker.helpers.maybe(()=>faker.lorem.paragraph()),
            observacionesResolucion: faker.helpers.maybe(()=>faker.lorem.paragraph()),
            lineas: lineas
        });
        incidencias.push(incidencia);
    }
    await incidenciaRepo.save(incidencias);
    console.log(_seederi18nhelper.SeederI18nHelper.getSeederSuccess('incidencias', {
        count: incidencias.length
    }));
};

//# sourceMappingURL=incidencia.seeder.js.map