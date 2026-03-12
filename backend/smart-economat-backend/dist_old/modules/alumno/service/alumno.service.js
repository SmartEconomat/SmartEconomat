"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AlumnoService", {
    enumerable: true,
    get: function() {
        return AlumnoService;
    }
});
const _i18nhelper = require("../../../common/helpers/i18n.helper");
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require("bcrypt"));
const _usuarioentity = require("../../usuario/usuario.entity/usuario.entity");
const _usuarioenums = require("../../usuario/enums/usuario.enums");
const _alumnoentity = require("../alumno.entity/alumno.entity");
const _profesorentity = require("../../profesor/profesor.entity/profesor.entity");
const _alumnoslotentity = require("../../profesor/profesor.entity/alumno-slot.entity");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let AlumnoService = class AlumnoService {
    async register(dto) {
        return this.dataSource.transaction(async (manager)=>{
            const profesor = await manager.findOne(_profesorentity.Profesor, {
                where: {
                    cial: dto.cialProfesor
                }
            });
            if (!profesor) throw new _common.NotFoundException('Profesor no encontrado con el cial proporcionado');
            let slot = await manager.findOne(_alumnoslotentity.AlumnoSlot, {
                where: {
                    profesor: {
                        id: profesor.id
                    },
                    aula: dto.aula,
                    numeroClase: dto.numeroClase
                },
                relations: [
                    'alumno'
                ]
            });
            if (!slot) {
                slot = manager.create(_alumnoslotentity.AlumnoSlot, {
                    profesor,
                    aula: dto.aula,
                    numeroClase: dto.numeroClase
                });
                await manager.save(slot);
            } else if (slot.alumno) {
                throw new _common.BadRequestException('El Slot ya está ocupado por otro alumno');
            }
            const whereConditions = [
                {
                    username: dto.username
                }
            ];
            const isExistingUser = await manager.findOne(_usuarioentity.Usuario, {
                where: whereConditions
            });
            if (isExistingUser) throw new _common.ConflictException(_i18nhelper.I18nHelper.getError('USERNAME_OR_EMAIL_IS_ALREADY_TAKEN'));
            const passwordHash = await _bcrypt.hash(dto.password, 10);
            const user = manager.create(_usuarioentity.Usuario, {
                username: dto.username,
                password: passwordHash,
                rol: _usuarioenums.rolUsuario.ALUMNO,
                status: _usuarioenums.UserStatus.INACTIVE
            });
            await manager.save(user);
            const alumno = manager.create(_alumnoentity.Alumno, {
                user,
                slot
            });
            await manager.save(alumno);
            return {
                message: _i18nhelper.I18nHelper.translate('messages.ALUMNO_REGISTRADO_CON_XITO_ESPERANDO_ACT')
            };
        });
    }
    async changeProfesor(alumnoUserId, reqUserId, reqUserRole, dto) {
        return this.dataSource.transaction(async (manager)=>{
            const alumno = await manager.findOne(_alumnoentity.Alumno, {
                where: {
                    user: {
                        id: alumnoUserId
                    }
                },
                relations: [
                    'slot',
                    'slot.profesor'
                ]
            });
            if (!alumno) throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('ALUMNO_NO_ENCONTRADO'));
            if (reqUserRole !== _usuarioenums.rolUsuario.ADMINISTRADOR) {
                const profesorActual = await manager.findOne(_profesorentity.Profesor, {
                    where: {
                        user: {
                            id: reqUserId
                        }
                    }
                });
                if (!profesorActual || alumno.slot.profesor.id !== profesorActual.id) {
                    throw new _common.BadRequestException('No tienes permisos para cambiar a este alumno');
                }
            }
            const nuevoProfesor = await manager.findOne(_profesorentity.Profesor, {
                where: {
                    cial: dto.cialNuevoProfesor
                }
            });
            if (!nuevoProfesor) throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('NUEVO_PROFESOR_NO_ENCONTRADO'));
            const nuevoSlot = await manager.findOne(_alumnoslotentity.AlumnoSlot, {
                where: {
                    profesor: {
                        id: nuevoProfesor.id
                    },
                    aula: dto.nuevaAula,
                    numeroClase: dto.nuevoNumeroClase
                },
                relations: [
                    'alumno'
                ]
            });
            if (!nuevoSlot) throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('EL_NUEVO_SLOT_ESPECIFICADO_NO_EXISTE'));
            if (nuevoSlot.alumno) throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('EL_NUEVO_SLOT_YA_EST_OCUPADO'));
            alumno.slot = nuevoSlot;
            await manager.save(alumno);
            return {
                message: _i18nhelper.I18nHelper.translate('messages.PROFESOR_Y_SLOT_CAMBIADOS_CON_XITO')
            };
        });
    }
    constructor(alumnoRepo, dataSource){
        this.alumnoRepo = alumnoRepo;
        this.dataSource = dataSource;
    }
};
AlumnoService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_alumnoentity.Alumno)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.DataSource === "undefined" ? Object : _typeorm1.DataSource
    ])
], AlumnoService);

//# sourceMappingURL=alumno.service.js.map