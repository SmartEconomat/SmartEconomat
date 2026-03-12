"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RolesService", {
    enumerable: true,
    get: function() {
        return RolesService;
    }
});
const _i18nhelper = require("../../../common/helpers/i18n.helper");
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _rolentity = require("../entities/rol.entity");
const _usuarioentity = require("../../usuario/usuario.entity/usuario.entity");
const _permisoentity = require("../../permisos/entities/permiso.entity");
const _usuariorolentity = require("../entities/usuario-rol.entity");
const _authorizationservice = require("../../authorization/services/authorization.service");
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
let RolesService = class RolesService {
    /**
   * Crear un nuevo rol
   */ async create(dto) {
        const existente = await this.rolRepo.findOne({
            where: {
                nombre: dto.nombre
            }
        });
        if (existente) {
            throw new _common.ConflictException(`Ya existe un rol con el nombre "${dto.nombre}"`);
        }
        const rol = this.rolRepo.create({
            nombre: dto.nombre,
            descripcion: dto.descripcion,
            esSistema: dto.esSistema || false,
            activo: dto.activo !== undefined ? dto.activo : true
        });
        const savedRol = await this.rolRepo.save(rol);
        if (dto.permisoIds && dto.permisoIds.length > 0) {
            await this.assignPermissions(savedRol.id, {
                permisoIds: dto.permisoIds
            });
        }
        return this.findOne(savedRol.id);
    }
    /**
   * Listar todos los roles con paginación
   */ async findAll(query) {
        const { page = 1, limit = 10 } = query;
        const [data, total] = await this.rolRepo.findAndCount({
            relations: [
                'permisos'
            ],
            order: {
                nombre: 'ASC'
            },
            skip: (page - 1) * limit,
            take: limit
        });
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    /**
   * Obtener todos los roles sin paginación (para selectores)
   */ async findAllNoPagination() {
        return this.rolRepo.find({
            where: {
                activo: true
            },
            order: {
                nombre: 'ASC'
            }
        });
    }
    /**
   * Obtener un rol por ID con sus permisos
   */ async findOne(id) {
        const rol = await this.rolRepo.findOne({
            where: {
                id
            },
            relations: [
                'permisos'
            ]
        });
        if (!rol) {
            throw new _common.NotFoundException(`Rol con ID "${id}" no encontrado`);
        }
        return rol;
    }
    /**
   * Actualizar un rol
   */ async update(id, dto) {
        const rol = await this.findOne(id);
        if (rol.esSistema && dto.esSistema === false) {
            throw new _common.BadRequestException('No se puede modificar el atributo "esSistema" de un rol de sistema');
        }
        if (dto.nombre && dto.nombre !== rol.nombre) {
            const existente = await this.rolRepo.findOne({
                where: {
                    nombre: dto.nombre
                }
            });
            if (existente) {
                throw new _common.ConflictException(`Ya existe un rol con el nombre "${dto.nombre}"`);
            }
        }
        if (dto.permisoIds) {
            await this.assignPermissions(id, {
                permisoIds: dto.permisoIds
            });
        }
        Object.assign(rol, {
            nombre: dto.nombre,
            descripcion: dto.descripcion,
            activo: dto.activo
        });
        await this.rolRepo.save(rol);
        await this.invalidateCacheForRole(id);
        return this.findOne(id);
    }
    /**
   * Eliminar un rol (soft delete)
   */ async remove(id) {
        const rol = await this.findOne(id);
        if (rol.esSistema) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('NO_SE_PUEDE_ELIMINAR_UN_ROL_DE_SISTEMA'));
        }
        const usuariosCount = await this.usuarioRolRepo.count({
            where: {
                rolId: id
            }
        });
        if (usuariosCount > 0) {
            throw new _common.BadRequestException(`No se puede eliminar el rol. Está asignado a ${usuariosCount} usuario(s)`);
        }
        await this.rolRepo.softDelete(id);
    }
    /**
   * Asignar permisos a un rol
   */ async assignPermissions(rolId, dto) {
        const rol = await this.findOne(rolId);
        if (rol.esSistema) {
            throw new _common.BadRequestException('No se pueden modificar los permisos de un rol de sistema');
        }
        const permisos = await this.permisoRepo.find({
            where: {
                id: (0, _typeorm1.In)(dto.permisoIds)
            }
        });
        if (permisos.length !== dto.permisoIds.length) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('ALGUNOS_PERMISOS_NO_EXISTEN'));
        }
        rol.permisos = permisos;
        await this.rolRepo.save(rol);
        await this.invalidateCacheForRole(rolId);
        return this.findOne(rolId);
    }
    /**
   * Asignar un rol a un usuario
   */ async assignRoleToUser(dto, asignadoPor) {
        const usuario = await this.usuarioRepo.findOne({
            where: {
                id: dto.usuarioId
            }
        });
        if (!usuario) {
            throw new _common.NotFoundException(`Usuario con ID "${dto.usuarioId}" no encontrado`);
        }
        const existente = await this.usuarioRolRepo.findOne({
            where: {
                usuarioId: dto.usuarioId,
                rolId: dto.rolId
            }
        });
        if (existente) {
            existente.activo = dto.activo !== undefined ? dto.activo : true;
            const updated = await this.usuarioRolRepo.save(existente);
            await this.authorizationService.invalidateUserCache(dto.usuarioId);
            return updated;
        }
        const usuarioRol = this.usuarioRolRepo.create({
            usuarioId: dto.usuarioId,
            rolId: dto.rolId,
            asignadoPor,
            activo: dto.activo !== undefined ? dto.activo : true
        });
        const saved = await this.usuarioRolRepo.save(usuarioRol);
        await this.authorizationService.invalidateUserCache(dto.usuarioId);
        return saved;
    }
    /**
   * Remover un rol de un usuario
   */ async removeRoleFromUser(usuarioId, rolId) {
        const usuarioRol = await this.usuarioRolRepo.findOne({
            where: {
                usuarioId,
                rolId
            }
        });
        if (!usuarioRol) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('ASIGNACI_N_DE_ROL_NO_ENCONTRADA'));
        }
        await this.usuarioRolRepo.remove(usuarioRol);
        await this.authorizationService.invalidateUserCache(usuarioId);
    }
    /**
   * Obtener roles de un usuario
   */ async getUserRoles(usuarioId) {
        const usuario = await this.usuarioRepo.findOne({
            where: {
                id: usuarioId
            },
            relations: [
                'roles'
            ]
        });
        if (!usuario) {
            throw new _common.NotFoundException(`Usuario con ID "${usuarioId}" no encontrado`);
        }
        return usuario.roles || [];
    }
    /**
   * Invalidar cache de todos los usuarios que tengan un rol específico
   */ async invalidateCacheForRole(rolId) {
        const usuarioRoles = await this.usuarioRolRepo.find({
            where: {
                rolId,
                activo: true
            },
            select: [
                'usuarioId'
            ]
        });
        const userIds = usuarioRoles.map((ur)=>ur.usuarioId);
        if (userIds.length > 0) {
            await this.authorizationService.invalidateUsersCache(userIds);
        }
    }
    constructor(rolRepo, usuarioRepo, permisoRepo, usuarioRolRepo, authorizationService){
        this.rolRepo = rolRepo;
        this.usuarioRepo = usuarioRepo;
        this.permisoRepo = permisoRepo;
        this.usuarioRolRepo = usuarioRolRepo;
        this.authorizationService = authorizationService;
    }
};
RolesService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_rolentity.Rol)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_usuarioentity.Usuario)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_permisoentity.Permiso)),
    _ts_param(3, (0, _typeorm.InjectRepository)(_usuariorolentity.UsuarioRol)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _authorizationservice.AuthorizationService === "undefined" ? Object : _authorizationservice.AuthorizationService
    ])
], RolesService);

//# sourceMappingURL=roles.service.js.map