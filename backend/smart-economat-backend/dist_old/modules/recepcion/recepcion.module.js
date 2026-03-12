"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RecepcionModule", {
    enumerable: true,
    get: function() {
        return RecepcionModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _recepcionentity = require("./recepcion.entity/recepcion.entity");
const _usuarioentity = require("../usuario/usuario.entity/usuario.entity");
const _recepcioncontroller = require("./controller/recepcion.controller");
const _recepcionproductocontroller = require("./controller/recepcion-producto.controller");
const _recepcionservice = require("./service/recepcion.service");
const _recepcionstockservice = require("./service/recepcion-stock.service");
const _recepcionproductoservice = require("./service/recepcion-producto.service");
const _recepcionpedidoentity = require("./recepcion-pedido.entity/recepcion-pedido.entity");
const _recepcionproductoentity = require("./recepcion-productos.entity/recepcion-producto.entity");
const _albaranentity = require("../albaran/albaran.entity/albaran.entity");
const _inventarioentity = require("../inventario/inventario.entity/inventario.entity");
const _movimientoentity = require("../movimiento/movimiento.entity/movimiento.entity");
const _albaranpedidorecepcionentity = require("../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity");
const _pedidoentity = require("../pedido/pedido.entity/pedido.entity");
const _pedidoproductoentity = require("../pedido/pedido-producto.entity/pedido-producto.entity");
const _movimientomodule = require("../movimiento/movimiento.module");
const _movimientohelper = require("../../common/helpers/movimiento.helper");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let RecepcionModule = class RecepcionModule {
};
RecepcionModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _recepcionentity.Recepcion,
                _usuarioentity.Usuario,
                _recepcionpedidoentity.RecepcionPedido,
                _recepcionproductoentity.RecepcionProducto,
                _albaranentity.Albaran,
                _inventarioentity.Inventario,
                _movimientoentity.Movimiento,
                _albaranpedidorecepcionentity.AlbaranPedidoRecepcion,
                _pedidoentity.Pedido,
                _pedidoproductoentity.PedidoProducto
            ]),
            _movimientomodule.MovimientoModule
        ],
        controllers: [
            _recepcioncontroller.RecepcionController,
            _recepcionproductocontroller.RecepcionProductoController
        ],
        providers: [
            _recepcionservice.RecepcionService,
            _recepcionstockservice.RecepcionStockService,
            _recepcionproductoservice.RecepcionProductoService,
            _movimientohelper.MovimientoHelper
        ],
        exports: [
            _recepcionservice.RecepcionService,
            _recepcionstockservice.RecepcionStockService
        ]
    })
], RecepcionModule);

//# sourceMappingURL=recepcion.module.js.map