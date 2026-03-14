'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProveedorModule', {
  enumerable: true,
  get: function () {
    return ProveedorModule;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _proveedorentity = require('./proveedor.entity/proveedor.entity');
const _proveedorrepository = require('./repository/proveedor.repository');
const _proveedorcontroller = require('./controller/proveedor.controller');
const _proveedorservice = require('./service/proveedor.service');
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
let ProveedorModule = class ProveedorModule {};
ProveedorModule = _ts_decorate(
  [
    (0, _common.Module)({
      imports: [
        _typeorm.TypeOrmModule.forFeature([_proveedorentity.Proveedor]),
      ],
      controllers: [_proveedorcontroller.ProveedorController],
      providers: [
        _proveedorservice.ProveedorService,
        _proveedorrepository.ProveedorRepository,
      ],
      exports: [_proveedorservice.ProveedorService],
    }),
  ],
  ProveedorModule
);
