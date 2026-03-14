'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'DashboardModule', {
  enumerable: true,
  get: function () {
    return DashboardModule;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _dashboardcontroller = require('./controller/dashboard.controller');
const _dashboardservice = require('./service/dashboard.service');
const _inventarioentity = require('../inventario/inventario.entity/inventario.entity');
const _pedidoentity = require('../pedido/pedido.entity/pedido.entity');
const _movimientoentity = require('../movimiento/movimiento.entity/movimiento.entity');
const _productoentity = require('../producto/producto.entity/producto.entity');
const _proveedorentity = require('../proveedor/proveedor.entity/proveedor.entity');
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length,
    r =
      c < 3
        ? target
        : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
    d;
  if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if ((d = decorators[i]))
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return (c > 3 && r && Object.defineProperty(target, key, r), r);
}
let DashboardModule = class DashboardModule {};
DashboardModule = _ts_decorate(
  [
    (0, _common.Module)({
      imports: [
        _typeorm.TypeOrmModule.forFeature([
          _inventarioentity.Inventario,
          _pedidoentity.Pedido,
          _movimientoentity.Movimiento,
          _productoentity.Producto,
          _proveedorentity.Proveedor,
        ]),
      ],
      controllers: [_dashboardcontroller.DashboardController],
      providers: [_dashboardservice.DashboardService],
    }),
  ],
  DashboardModule
);
