"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PedidoModule", {
    enumerable: true,
    get: function() {
        return PedidoModule;
    }
});
const _common = require("@nestjs/common");
const _pedidoservice = require("./service/pedido.service");
const _pedidocontroller = require("./controller/pedido.controller");
const _typeorm = require("@nestjs/typeorm");
const _pedidoentity = require("./pedido.entity/pedido.entity");
const _pedidorepository = require("./repository/pedido.repository");
const _pedidoproductoentity = require("./pedido-producto.entity/pedido-producto.entity");
const _productoproveedorentity = require("../producto/producto-proveedor.entity/producto-proveedor.entity");
const _movimientomodule = require("../movimiento/movimiento.module");
const _movimientohelper = require("../../common/helpers/movimiento.helper");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let PedidoModule = class PedidoModule {
};
PedidoModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _pedidoentity.Pedido,
                _pedidoproductoentity.PedidoProducto,
                _productoproveedorentity.ProductoProveedor
            ]),
            _movimientomodule.MovimientoModule
        ],
        controllers: [
            _pedidocontroller.PedidoController
        ],
        providers: [
            _pedidoservice.PedidoService,
            _pedidorepository.PedidoRepository,
            _movimientohelper.MovimientoHelper
        ],
        exports: [
            _pedidoservice.PedidoService
        ]
    })
], PedidoModule);

//# sourceMappingURL=pedido.module.js.map