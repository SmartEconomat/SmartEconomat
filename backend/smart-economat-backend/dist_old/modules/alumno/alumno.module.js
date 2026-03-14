'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'AlumnoModule', {
  enumerable: true,
  get: function () {
    return AlumnoModule;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _alumnoentity = require('./alumno.entity/alumno.entity');
const _alumnoservice = require('./service/alumno.service');
const _alumnocontroller = require('./controller/alumno.controller');
const _usuarioentity = require('../usuario/usuario.entity/usuario.entity');
const _profesorentity = require('../profesor/profesor.entity/profesor.entity');
const _alumnoslotentity = require('../profesor/profesor.entity/alumno-slot.entity');
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
let AlumnoModule = class AlumnoModule {};
AlumnoModule = _ts_decorate(
  [
    (0, _common.Module)({
      imports: [
        _typeorm.TypeOrmModule.forFeature([
          _alumnoentity.Alumno,
          _usuarioentity.Usuario,
          _profesorentity.Profesor,
          _alumnoslotentity.AlumnoSlot,
        ]),
      ],
      controllers: [_alumnocontroller.AlumnoController],
      providers: [_alumnoservice.AlumnoService],
      exports: [_alumnoservice.AlumnoService],
    }),
  ],
  AlumnoModule
);
