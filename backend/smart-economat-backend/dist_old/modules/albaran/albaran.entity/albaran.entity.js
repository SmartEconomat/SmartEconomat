'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'Albaran', {
  enumerable: true,
  get: function () {
    return Albaran;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _albaranpedidorecepcionentity = require('../albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity');
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
let Albaran = class Albaran extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 50,
      unique: true,
      name: 'n_albaran',
    }),
    _ts_metadata('design:type', String),
  ],
  Albaran.prototype,
  'nAlbaran',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'boolean',
      nullable: true,
    }),
    _ts_metadata('design:type', Boolean),
  ],
  Albaran.prototype,
  'concordancia',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'timestamptz',
      nullable: true,
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  Albaran.prototype,
  'fecha',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _albaranpedidorecepcionentity.AlbaranPedidoRecepcion,
      (apr) => apr.albaran
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Albaran.prototype,
  'albaranPedidoRecepcion',
  void 0
);
Albaran = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'albaran',
    }),
    (0, _typeorm.Index)('idx_albaran_n_albaran', ['nAlbaran']),
    (0, _typeorm.Index)('idx_albaran_fecha', ['fecha']),
  ],
  Albaran
);
