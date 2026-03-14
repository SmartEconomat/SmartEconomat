'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get IngredienteCostoDto() {
    return IngredienteCostoDto;
  },
  get RecetaCostResponseDto() {
    return RecetaCostResponseDto;
  },
});
const _swagger = require('@nestjs/swagger');
const _recetaenums = require('../enums/receta.enums');
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
function _ts_metadata(k, v) {
  if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
    return Reflect.metadata(k, v);
}
let IngredienteCostoDto = class IngredienteCostoDto {};
_ts_decorate(
  [(0, _swagger.ApiProperty)(), _ts_metadata('design:type', String)],
  IngredienteCostoDto.prototype,
  'productoId',
  void 0
);
_ts_decorate(
  [(0, _swagger.ApiProperty)(), _ts_metadata('design:type', String)],
  IngredienteCostoDto.prototype,
  'productoNombre',
  void 0
);
_ts_decorate(
  [(0, _swagger.ApiProperty)(), _ts_metadata('design:type', Number)],
  IngredienteCostoDto.prototype,
  'cantidad',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      enum: _recetaenums.UnidadIngrediente,
    }),
    _ts_metadata(
      'design:type',
      typeof _recetaenums.UnidadIngrediente === 'undefined'
        ? Object
        : _recetaenums.UnidadIngrediente
    ),
  ],
  IngredienteCostoDto.prototype,
  'unidad',
  void 0
);
_ts_decorate(
  [(0, _swagger.ApiProperty)(), _ts_metadata('design:type', Number)],
  IngredienteCostoDto.prototype,
  'precioUnitario',
  void 0
);
_ts_decorate(
  [(0, _swagger.ApiProperty)(), _ts_metadata('design:type', Number)],
  IngredienteCostoDto.prototype,
  'costoIngrediente',
  void 0
);
let RecetaCostResponseDto = class RecetaCostResponseDto {};
_ts_decorate(
  [(0, _swagger.ApiProperty)(), _ts_metadata('design:type', String)],
  RecetaCostResponseDto.prototype,
  'recetaId',
  void 0
);
_ts_decorate(
  [(0, _swagger.ApiProperty)(), _ts_metadata('design:type', String)],
  RecetaCostResponseDto.prototype,
  'recetaNombre',
  void 0
);
_ts_decorate(
  [(0, _swagger.ApiProperty)(), _ts_metadata('design:type', Number)],
  RecetaCostResponseDto.prototype,
  'costoTotal',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      type: [IngredienteCostoDto],
    }),
    _ts_metadata('design:type', Array),
  ],
  RecetaCostResponseDto.prototype,
  'desglosePorIngrediente',
  void 0
);
