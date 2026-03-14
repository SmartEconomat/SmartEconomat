'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'Receta', {
  enumerable: true,
  get: function () {
    return Receta;
  },
});
const _typeorm = require('typeorm');
const _recetaenums = require('../enums/receta.enums');
const _recetaingredienteentity = require('../receta-ingrediente.entity/receta-ingrediente.entity');
const _productoentity = require('../../producto/producto.entity/producto.entity');
const _baseentity = require('../../../common/entities/base.entity');
const _columnnumerictransformer = require('../../../common/transformers/column-numeric.transformer');
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
let Receta = class Receta extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      length: 150,
    }),
    _ts_metadata('design:type', String),
  ],
  Receta.prototype,
  'nombre',
  void 0
);
_ts_decorate(
  [(0, _typeorm.Column)('text'), _ts_metadata('design:type', String)],
  Receta.prototype,
  'instrucciones',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'enum',
      enum: _recetaenums.TiempoReceta,
      enumName: 'tiempo_receta_enum',
    }),
    _ts_metadata(
      'design:type',
      typeof _recetaenums.TiempoReceta === 'undefined'
        ? Object
        : _recetaenums.TiempoReceta
    ),
  ],
  Receta.prototype,
  'tiempo',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'enum',
      enum: _recetaenums.DificultadReceta,
      enumName: 'dificultad_receta_enum',
    }),
    _ts_metadata(
      'design:type',
      typeof _recetaenums.DificultadReceta === 'undefined'
        ? Object
        : _recetaenums.DificultadReceta
    ),
  ],
  Receta.prototype,
  'dificultad',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'tiempo_preparacion',
      type: 'varchar',
      length: 50,
      nullable: false,
    }),
    _ts_metadata('design:type', String),
  ],
  Receta.prototype,
  'tiempoPreparacion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'producto_resultado_id',
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Receta.prototype,
  'productoResultadoId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _productoentity.Producto, {
      nullable: true,
      onDelete: 'SET NULL',
    }),
    (0, _typeorm.JoinColumn)({
      name: 'producto_resultado_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Receta.prototype,
  'productoResultado',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'numeric',
      precision: 12,
      scale: 3,
      nullable: true,
      name: 'rendimiento',
      transformer: new _columnnumerictransformer.ColumnNumericTransformer(),
    }),
    _ts_metadata('design:type', Object),
  ],
  Receta.prototype,
  'rendimiento',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'enum',
      enum: _recetaenums.UnidadIngrediente,
      nullable: true,
      name: 'unidad_resultado',
    }),
    _ts_metadata('design:type', Object),
  ],
  Receta.prototype,
  'unidadResultado',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'integer',
      nullable: true,
      name: 'dias_caducidad',
    }),
    _ts_metadata('design:type', Object),
  ],
  Receta.prototype,
  'diasCaducidad',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'numeric',
      precision: 12,
      scale: 4,
      nullable: true,
      name: 'coste_unitario_estimado',
      transformer: new _columnnumerictransformer.ColumnNumericTransformer(),
    }),
    _ts_metadata('design:type', Object),
  ],
  Receta.prototype,
  'costeUnitarioEstimado',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _recetaingredienteentity.RecetaIngrediente,
      (ri) => ri.receta
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Receta.prototype,
  'ingredientes',
  void 0
);
Receta = _ts_decorate(
  [
    (0, _typeorm.Index)(['dificultad', 'tiempo']),
    (0, _typeorm.Entity)('receta'),
  ],
  Receta
);
