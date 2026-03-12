"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlantillasRolesService", {
    enumerable: true,
    get: function() {
        return PlantillasRolesService;
    }
});
const _i18nhelper = require("../../../common/helpers/i18n.helper");
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _plantillarolentity = require("../entities/plantilla-rol.entity");
const _permisoentity = require("../../permisos/entities/permiso.entity");
const _rolentity = require("../../roles/entities/rol.entity");
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
let PlantillasRolesService = class PlantillasRolesService {
    async create(dto) {
        const existente = await this.plantillaRepo.findOne({
            where: {
                nombre: dto.nombre
            }
        });
        if (existente) {
            throw new _common.ConflictException(`Ya existe una plantilla con el nombre "${dto.nombre}"`);
        }
        if (dto.plantillaPadreId) {
            const padre = await this.plantillaRepo.findOne({
                where: {
                    id: dto.plantillaPadreId
                }
            });
            if (!padre) {
                throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('PLANTILLA_PADRE_NO_ENCONTRADA'));
            }
        }
        const plantilla = this.plantillaRepo.create({
            nombre: dto.nombre,
            descripcion: dto.descripcion,
            esEditable: dto.esEditable !== undefined ? dto.esEditable : true,
            plantillaPadreId: dto.plantillaPadreId,
            activo: true
        });
        const saved = await this.plantillaRepo.save(plantilla);
        if (dto.permisoIds && dto.permisoIds.length > 0) {
            const permisos = await this.permisoRepo.find({
                where: {
                    id: (0, _typeorm1.In)(dto.permisoIds)
                }
            });
            saved.permisos = permisos;
            await this.plantillaRepo.save(saved);
        }
        return this.findOne(saved.id);
    }
    async findAll() {
        return this.plantillaRepo.find({
            relations: [
                'permisos',
                'plantillaPadre'
            ],
            order: {
                nombre: 'ASC'
            }
        });
    }
    async findOne(id) {
        const plantilla = await this.plantillaRepo.findOne({
            where: {
                id
            },
            relations: [
                'permisos',
                'plantillaPadre',
                'plantillasHijas'
            ]
        });
        if (!plantilla) {
            throw new _common.NotFoundException(`Plantilla con ID "${id}" no encontrada`);
        }
        return plantilla;
    }
    async update(id, dto) {
        const plantilla = await this.findOne(id);
        if (!plantilla.esEditable) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('ESTA_PLANTILLA_NO_ES_EDITABLE'));
        }
        if (dto.nombre && dto.nombre !== plantilla.nombre) {
            const existente = await this.plantillaRepo.findOne({
                where: {
                    nombre: dto.nombre
                }
            });
            if (existente) {
                throw new _common.ConflictException(`Ya existe una plantilla con el nombre "${dto.nombre}"`);
            }
        }
        if (dto.permisoIds) {
            const permisos = await this.permisoRepo.find({
                where: {
                    id: (0, _typeorm1.In)(dto.permisoIds)
                }
            });
            plantilla.permisos = permisos;
        }
        Object.assign(plantilla, {
            nombre: dto.nombre,
            descripcion: dto.descripcion,
            plantillaPadreId: dto.plantillaPadreId
        });
        return this.plantillaRepo.save(plantilla);
    }
    async remove(id) {
        const plantilla = await this.findOne(id);
        if (!plantilla.esEditable) {
            throw new _common.BadRequestException('Esta plantilla de sistema no se puede eliminar');
        }
        await this.plantillaRepo.softDelete(id);
    }
    /**
   * Crear un rol desde una plantilla (copia los permisos base)
   */ async createRolFromPlantilla(plantillaId, nombreRol, descripcionRol) {
        const plantilla = await this.findOne(plantillaId);
        const permisosIds = await this.getPermisosWithInheritance(plantillaId);
        const rol = this.rolRepo.create({
            nombre: nombreRol,
            descripcion: descripcionRol || plantilla.descripcion,
            esSistema: false,
            activo: true
        });
        const savedRol = await this.rolRepo.save(rol);
        if (permisosIds.length > 0) {
            const permisos = await this.permisoRepo.find({
                where: {
                    id: (0, _typeorm1.In)(permisosIds)
                }
            });
            savedRol.permisos = permisos;
            await this.rolRepo.save(savedRol);
        }
        return savedRol;
    }
    /**
   * Obtiene todos los permisos de una plantilla incluyendo los heredados
   */ async getPermisosWithInheritance(plantillaId) {
        const plantilla = await this.findOne(plantillaId);
        const permisosIds = new Set(plantilla.permisos.map((p)=>p.id));
        if (plantilla.plantillaPadreId) {
            const permisosPadre = await this.getPermisosWithInheritance(plantilla.plantillaPadreId);
            permisosPadre.forEach((id)=>permisosIds.add(id));
        }
        return Array.from(permisosIds);
    }
    constructor(plantillaRepo, permisoRepo, rolRepo){
        this.plantillaRepo = plantillaRepo;
        this.permisoRepo = permisoRepo;
        this.rolRepo = rolRepo;
    }
};
PlantillasRolesService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_plantillarolentity.PlantillaRol)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_permisoentity.Permiso)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_rolentity.Rol)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], PlantillasRolesService);

//# sourceMappingURL=plantillas-roles.service.js.map