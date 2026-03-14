'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'AlbaranModule', {
  enumerable: true,
  get: function () {
    return AlbaranModule;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _albaranentity = require('./albaran.entity/albaran.entity');
const _albarancontroller = require('./controller/albaran.controller');
const _albaranservice = require('./service/albaran.service');
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
let AlbaranModule = class AlbaranModule {};
AlbaranModule = _ts_decorate(
  [
    (0, _common.Module)({
      imports: [_typeorm.TypeOrmModule.forFeature([_albaranentity.Albaran])],
      controllers: [_albarancontroller.AlbaranController],
      providers: [_albaranservice.AlbaranService],
      exports: [_albaranservice.AlbaranService],
    }),
  ],
  AlbaranModule
);
