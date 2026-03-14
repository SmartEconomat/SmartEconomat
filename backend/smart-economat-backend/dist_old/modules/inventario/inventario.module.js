'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'InventarioModule', {
  enumerable: true,
  get: function () {
    return InventarioModule;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _inventarioentity = require('./inventario.entity/inventario.entity');
const _inventarioservice = require('./service/inventario.service');
const _inventariocontroller = require('./controller/inventario.controller');
const _alertacontroller = require('./controller/alerta.controller');
const _inventariorepository = require('./repository/inventario.repository');
const _productoproveedorentity = require('../producto/producto-proveedor.entity/producto-proveedor.entity');
const _movimientomodule = require('../movimiento/movimiento.module');
const _movimientohelper = require('../../common/helpers/movimiento.helper');
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
let InventarioModule = class InventarioModule {};
InventarioModule = _ts_decorate(
  [
    (0, _common.Module)({
      imports: [
        _typeorm.TypeOrmModule.forFeature([
          _inventarioentity.Inventario,
          _productoproveedorentity.ProductoProveedor,
        ]),
        _movimientomodule.MovimientoModule,
      ],
      controllers: [
        _inventariocontroller.InventarioController,
        _alertacontroller.AlertaController,
      ],
      providers: [
        _inventarioservice.InventarioService,
        _inventariorepository.InventarioRepository,
        _movimientohelper.MovimientoHelper,
      ],
      exports: [_inventarioservice.InventarioService],
    }),
  ],
  InventarioModule
);
