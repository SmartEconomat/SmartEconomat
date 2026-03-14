"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductoModule", {
    enumerable: true,
    get: function() {
        return ProductoModule;
    }
});
const _common = require("@nestjs/common");
const _productoservice = require("./service/producto.service");
const _productocontroller = require("./controller/producto.controller");
const _productoproveedorservice = require("./service/producto-proveedor.service");
const _productoproveedorcontroller = require("./controller/producto-proveedor.controller");
const _productoalergenoservice = require("./service/producto-alergeno.service");
const _productoalergenocontroller = require("./controller/producto-alergeno.controller");
const _historialprecioservice = require("./service/historial-precio.service");
const _historialpreciocontroller = require("./controller/historial-precio.controller");
const _typeorm = require("@nestjs/typeorm");
const _productoentity = require("./producto.entity/producto.entity");
const _productoalergenoentity = require("./producto-alergeno.entity/producto-alergeno.entity");
const _productorepository = require("./repository/producto.repository");
const _historialpreciorepository = require("./repository/historial-precio.repository");
const _productoproveedorentity = require("./producto-proveedor.entity/producto-proveedor.entity");
const _historialentity = require("./historial-precio-proveedor.entity/historial.entity");
const _movimientomodule = require("../movimiento/movimiento.module");
const _movimientohelper = require("../../common/helpers/movimiento.helper");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ProductoModule = class ProductoModule {
};
ProductoModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _productoentity.Producto,
                _productoproveedorentity.ProductoProveedor,
                _productoalergenoentity.ProductoAlergeno,
                _historialentity.HistorialPrecio
            ]),
            _movimientomodule.MovimientoModule
        ],
        controllers: [
            _productocontroller.ProductoController,
            _productoproveedorcontroller.ProductoProveedorController,
            _productoalergenocontroller.ProductoAlergenoController,
            _historialpreciocontroller.HistorialPrecioController
        ],
        providers: [
            _productoservice.ProductoService,
            _productorepository.ProductoRepository,
            _productoproveedorservice.ProductoProveedorService,
            _productoalergenoservice.ProductoAlergenoService,
            _historialprecioservice.HistorialPrecioService,
            _historialpreciorepository.HistorialPrecioRepository,
            _movimientohelper.MovimientoHelper
        ],
        exports: [
            _productoservice.ProductoService,
            _productorepository.ProductoRepository,
            _productoproveedorservice.ProductoProveedorService,
            _historialprecioservice.HistorialPrecioService
        ]
    })
], ProductoModule);

//# sourceMappingURL=producto.module.js.map