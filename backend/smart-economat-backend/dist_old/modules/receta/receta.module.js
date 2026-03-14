'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RecetaModule', {
  enumerable: true,
  get: function () {
    return RecetaModule;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _recetaentity = require('./receta.entity/receta.entity');
const _recetaingredienteentity = require('./receta-ingrediente.entity/receta-ingrediente.entity');
const _produccionloteentity = require('./produccion-lote.entity/produccion-lote.entity');
const _productoentity = require('../producto/producto.entity/producto.entity');
const _productoproveedorentity = require('../producto/producto-proveedor.entity/producto-proveedor.entity');
const _recetaservice = require('./service/receta.service');
const _produccionservice = require('./service/produccion.service');
const _recetacontroller = require('./controller/receta.controller');
const _produccioncontroller = require('./controller/produccion.controller');
const _recetarepository = require('./repository/receta.repository');
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
let RecetaModule = class RecetaModule {};
RecetaModule = _ts_decorate(
  [
    (0, _common.Module)({
      imports: [
        _typeorm.TypeOrmModule.forFeature([
          _recetaentity.Receta,
          _recetaingredienteentity.RecetaIngrediente,
          _produccionloteentity.ProduccionLote,
          _productoentity.Producto,
          _productoproveedorentity.ProductoProveedor,
        ]),
      ],
      controllers: [
        _recetacontroller.RecetaController,
        _produccioncontroller.ProduccionController,
      ],
      providers: [
        _recetaservice.RecetaService,
        _produccionservice.ProduccionService,
        _recetarepository.RecetaRepository,
      ],
      exports: [
        _recetaservice.RecetaService,
        _produccionservice.ProduccionService,
        _recetarepository.RecetaRepository,
      ],
    }),
  ],
  RecetaModule
);
