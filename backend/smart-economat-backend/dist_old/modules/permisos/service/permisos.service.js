"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PermisosService", {
    enumerable: true,
    get: function() {
        return PermisosService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _permisoentity = require("../entities/permiso.entity");
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
let PermisosService = class PermisosService {
    /**
   * Crear un nuevo permiso
   */ async create(dto) {
        const existente = await this.permisoRepo.findOne({
            where: {
                codigo: dto.codigo
            }
        });
        if (existente) {
            throw new _common.ConflictException(`Ya existe un permiso con el código "${dto.codigo}"`);
        }
        const permiso = this.permisoRepo.create(dto);
        return this.permisoRepo.save(permiso);
    }
    /**
   * Crear múltiples permisos en batch (útil para seeders)
   */ async createMany(dtos) {
        const permisos = dtos.map((dto)=>this.permisoRepo.create(dto));
        return this.permisoRepo.save(permisos);
    }
    /**
   * Listar todos los permisos con paginación
   */ async findAll(query) {
        const { page = 1, limit = 10 } = query;
        const [data, total] = await this.permisoRepo.findAndCount({
            order: {
                modulo: 'ASC',
                accion: 'ASC'
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
   * Obtener todos los permisos sin paginación (para selectores)
   */ async findAllNoPagination() {
        return this.permisoRepo.find({
            where: {
                activo: true
            },
            order: {
                modulo: 'ASC',
                accion: 'ASC'
            }
        });
    }
    /**
   * Obtener permisos agrupados por módulo
   */ async findGroupedByModule() {
        const permisos = await this.permisoRepo.find({
            where: {
                activo: true
            },
            order: {
                modulo: 'ASC',
                accion: 'ASC'
            }
        });
        return permisos.reduce((acc, permiso)=>{
            if (!acc[permiso.modulo]) {
                acc[permiso.modulo] = [];
            }
            acc[permiso.modulo].push(permiso);
            return acc;
        }, {});
    }
    /**
   * Obtener un permiso por ID
   */ async findOne(id) {
        const permiso = await this.permisoRepo.findOne({
            where: {
                id
            }
        });
        if (!permiso) {
            throw new _common.NotFoundException(`Permiso con ID "${id}" no encontrado`);
        }
        return permiso;
    }
    /**
   * Obtener un permiso por código
   */ async findByCodigo(codigo) {
        return this.permisoRepo.findOne({
            where: {
                codigo
            }
        });
    }
    /**
   * Obtener múltiples permisos por sus códigos
   */ async findByCodigos(codigos) {
        if (!codigos || codigos.length === 0) {
            return [];
        }
        return this.permisoRepo.createQueryBuilder('permiso').where('permiso.codigo IN (:...codigos)', {
            codigos
        }).getMany();
    }
    /**
   * Actualizar un permiso
   */ async update(id, dto) {
        const permiso = await this.findOne(id);
        if (dto.codigo && dto.codigo !== permiso.codigo) {
            const existente = await this.permisoRepo.findOne({
                where: {
                    codigo: dto.codigo
                }
            });
            if (existente) {
                throw new _common.ConflictException(`Ya existe un permiso con el código "${dto.codigo}"`);
            }
        }
        Object.assign(permiso, dto);
        return this.permisoRepo.save(permiso);
    }
    /**
   * Eliminar un permiso (soft delete)
   */ async remove(id) {
        const rolesCount = await this.permisoRepo.createQueryBuilder('permiso').leftJoin('permiso.roles', 'rol').where('permiso.id = :id', {
            id
        }).select('COUNT(DISTINCT rol.id)', 'count').getRawOne();
        const count = parseInt(rolesCount?.count || '0', 10);
        if (count > 0) {
            throw new _common.BadRequestException(`No se puede eliminar el permiso. Está siendo usado por ${count} rol(es)`);
        }
        await this.permisoRepo.softDelete(id);
    }
    constructor(permisoRepo){
        this.permisoRepo = permisoRepo;
    }
};
PermisosService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_permisoentity.Permiso)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], PermisosService);

//# sourceMappingURL=permisos.service.js.map