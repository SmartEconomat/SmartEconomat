"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RecetaRepository", {
    enumerable: true,
    get: function() {
        return RecetaRepository;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _recetaentity = require("../receta.entity/receta.entity");
const _recetaingredienteentity = require("../receta-ingrediente.entity/receta-ingrediente.entity");
const _productoentity = require("../../producto/producto.entity/producto.entity");
const _i18nhelper = require("../../../common/helpers/i18n.helper");
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
const INGREDIENTES_RELATIONS = [
    'ingredientes',
    'ingredientes.producto',
    'ingredientes.producto.alergenos',
    'productoResultado'
];
let RecetaRepository = class RecetaRepository {
    async create(dto) {
        return this.dataSource.transaction(async (manager)=>{
            const productoIds = dto.ingredientes.map((ing)=>ing.productoId);
            if (new Set(productoIds).size !== productoIds.length) {
                throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('DUPLICATE_INGREDIENT'));
            }
            const productos = await manager.find(_productoentity.Producto, {
                where: {
                    id: (0, _typeorm1.In)(productoIds)
                }
            });
            const productosMap = new Map(productos.map((p)=>[
                    p.id.toLowerCase(),
                    p
                ]));
            const missingId = productoIds.find((id)=>!productosMap.has(id.toLowerCase()));
            if (missingId) {
                throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('PRODUCT_NOT_FOUND'));
            }
            let productoResultado;
            if (dto.productoResultadoId) {
                const found = await manager.findOne(_productoentity.Producto, {
                    where: {
                        id: dto.productoResultadoId
                    }
                });
                if (!found) {
                    throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('PRODUCT_NOT_FOUND'));
                }
                productoResultado = found;
            }
            const receta = manager.create(_recetaentity.Receta, {
                nombre: dto.nombre,
                instrucciones: dto.instrucciones,
                tiempo: dto.tiempo,
                dificultad: dto.dificultad,
                tiempoPreparacion: dto.tiempoPreparacion,
                ...productoResultado && {
                    productoResultado
                },
                ...dto.rendimiento !== undefined && {
                    rendimiento: dto.rendimiento
                },
                ...dto.unidadResultado !== undefined && {
                    unidadResultado: dto.unidadResultado
                },
                ...dto.diasCaducidad !== undefined && {
                    diasCaducidad: dto.diasCaducidad
                }
            });
            await manager.save(receta);
            const ingredientes = dto.ingredientes.map((ing)=>manager.create(_recetaingredienteentity.RecetaIngrediente, {
                    cantidad: ing.cantidad,
                    unidad: ing.unidad,
                    mermaAplicada: ing.mermaAplicada ?? 0,
                    receta,
                    producto: productosMap.get(ing.productoId.toLowerCase())
                }));
            await manager.save(ingredientes);
            const saved = await manager.findOne(_recetaentity.Receta, {
                where: {
                    id: receta.id
                },
                relations: [
                    ...INGREDIENTES_RELATIONS
                ]
            });
            if (!saved) {
                throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND'));
            }
            return saved;
        });
    }
    async findAllPaginated(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const whereCondition = query.searchTerm ? [
            {
                nombre: (0, _typeorm1.ILike)(`%${query.searchTerm}%`)
            },
            {
                instrucciones: (0, _typeorm1.ILike)(`%${query.searchTerm}%`)
            }
        ] : {};
        const [data, total] = await this.recetaRepo.findAndCount({
            where: whereCondition,
            relations: [
                ...INGREDIENTES_RELATIONS
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
            totalPages: Math.ceil(total / limit) || 1
        };
    }
    async findById(id) {
        return this.recetaRepo.findOne({
            where: {
                id
            },
            relations: [
                ...INGREDIENTES_RELATIONS
            ]
        });
    }
    async update(id, dto) {
        return this.dataSource.transaction(async (manager)=>{
            if (dto.ingredientes) {
                const productoIds = dto.ingredientes.map((ing)=>ing.productoId);
                if (new Set(productoIds).size !== productoIds.length) {
                    throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('DUPLICATE_INGREDIENT'));
                }
                const productos = await manager.find(_productoentity.Producto, {
                    where: {
                        id: (0, _typeorm1.In)(productoIds)
                    }
                });
                const productosMap = new Map(productos.map((p)=>[
                        p.id.toLowerCase(),
                        p
                    ]));
                const missingId = productoIds.find((pid)=>!productosMap.has(pid.toLowerCase()));
                if (missingId) {
                    throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('PRODUCT_NOT_FOUND'));
                }
                await manager.delete(_recetaingredienteentity.RecetaIngrediente, {
                    receta: {
                        id
                    }
                });
                const ingredientes = dto.ingredientes.map((ing)=>manager.create(_recetaingredienteentity.RecetaIngrediente, {
                        cantidad: ing.cantidad,
                        unidad: ing.unidad,
                        mermaAplicada: ing.mermaAplicada ?? 0,
                        receta: {
                            id
                        },
                        producto: productosMap.get(ing.productoId.toLowerCase())
                    }));
                await manager.save(ingredientes);
            }
            let productoResultado;
            if (dto.productoResultadoId !== undefined) {
                if (dto.productoResultadoId === null) {
                    productoResultado = null;
                } else {
                    const found = await manager.findOne(_productoentity.Producto, {
                        where: {
                            id: dto.productoResultadoId
                        }
                    });
                    if (!found) {
                        throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('PRODUCT_NOT_FOUND'));
                    }
                    productoResultado = found;
                }
            }
            const updateData = {
                ...dto.nombre !== undefined && {
                    nombre: dto.nombre
                },
                ...dto.instrucciones !== undefined && {
                    instrucciones: dto.instrucciones
                },
                ...dto.tiempo !== undefined && {
                    tiempo: dto.tiempo
                },
                ...dto.dificultad !== undefined && {
                    dificultad: dto.dificultad
                },
                ...dto.tiempoPreparacion !== undefined && {
                    tiempoPreparacion: dto.tiempoPreparacion
                },
                ...productoResultado !== undefined && {
                    productoResultado: productoResultado
                },
                ...dto.rendimiento !== undefined && {
                    rendimiento: dto.rendimiento
                },
                ...dto.unidadResultado !== undefined && {
                    unidadResultado: dto.unidadResultado
                },
                ...dto.diasCaducidad !== undefined && {
                    diasCaducidad: dto.diasCaducidad
                }
            };
            if (Object.keys(updateData).length > 0) {
                await manager.update(_recetaentity.Receta, id, updateData);
            }
            const updated = await manager.findOne(_recetaentity.Receta, {
                where: {
                    id
                },
                relations: [
                    ...INGREDIENTES_RELATIONS
                ]
            });
            if (!updated) {
                throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND'));
            }
            return updated;
        });
    }
    async remove(id) {
        const result = await this.recetaRepo.softDelete(id);
        if (result.affected === 0) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND'));
        }
    }
    async duplicate(sourceId, newName) {
        const sourceReceta = await this.findById(sourceId);
        if (!sourceReceta) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND'));
        }
        return this.dataSource.transaction(async (manager)=>{
            const newReceta = manager.create(_recetaentity.Receta, {
                nombre: newName,
                instrucciones: sourceReceta.instrucciones,
                tiempo: sourceReceta.tiempo,
                dificultad: sourceReceta.dificultad,
                tiempoPreparacion: sourceReceta.tiempoPreparacion,
                ...sourceReceta.productoResultado && {
                    productoResultado: sourceReceta.productoResultado
                },
                ...sourceReceta.rendimiento != null && !isNaN(sourceReceta.rendimiento) && {
                    rendimiento: sourceReceta.rendimiento
                },
                ...sourceReceta.unidadResultado != null && {
                    unidadResultado: sourceReceta.unidadResultado
                },
                ...sourceReceta.diasCaducidad != null && !isNaN(sourceReceta.diasCaducidad) && {
                    diasCaducidad: sourceReceta.diasCaducidad
                }
            });
            await manager.save(newReceta);
            if (sourceReceta.ingredientes?.length) {
                const ingredientes = sourceReceta.ingredientes.map((ing)=>manager.create(_recetaingredienteentity.RecetaIngrediente, {
                        cantidad: ing.cantidad,
                        unidad: ing.unidad,
                        mermaAplicada: ing.mermaAplicada ?? 0,
                        receta: newReceta,
                        producto: ing.producto
                    }));
                await manager.save(ingredientes);
            }
            const saved = await manager.findOne(_recetaentity.Receta, {
                where: {
                    id: newReceta.id
                },
                relations: [
                    ...INGREDIENTES_RELATIONS
                ]
            });
            if (!saved) {
                throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND'));
            }
            return saved;
        });
    }
    constructor(recetaRepo, dataSource){
        this.recetaRepo = recetaRepo;
        this.dataSource = dataSource;
    }
};
RecetaRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_recetaentity.Receta)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.DataSource === "undefined" ? Object : _typeorm1.DataSource
    ])
], RecetaRepository);

//# sourceMappingURL=receta.repository.js.map