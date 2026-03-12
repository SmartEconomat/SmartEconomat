"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductoAlergenoService", {
    enumerable: true,
    get: function() {
        return ProductoAlergenoService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _productoalergenoentity = require("../producto-alergeno.entity/producto-alergeno.entity");
const _productoentity = require("../producto.entity/producto.entity");
const _i18nhelper = require("../../../common/helpers/i18n.helper");
const _productoenums = require("../enums/producto.enums");
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
let ProductoAlergenoService = class ProductoAlergenoService {
    /**
   * Crea una nueva asociación entre un Producto y un Alérgeno.
   * Verifica que el producto exista y que la asociación no esté duplicada.
   */ async create(dto) {
        const { idProducto, alergeno } = dto;
        const producto = await this.productoRepository.findOne({
            where: {
                id: idProducto
            }
        });
        if (!producto) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('PRODUCT_NOT_FOUND'));
        }
        const existing = await this.productoAlergenoRepository.findOne({
            where: {
                productoId: idProducto,
                alergeno
            }
        });
        if (existing) {
            throw new _common.ConflictException(_i18nhelper.I18nHelper.getError('PRODUCTO_ALERGENO_ALREADY_EXISTS'));
        }
        const productoAlergeno = this.productoAlergenoRepository.create({
            productoId: idProducto,
            alergeno,
            producto
        });
        return this.productoAlergenoRepository.save(productoAlergeno);
    }
    /**
   * Devuelve todas las asociaciones producto-alérgeno.
   * Si se pasa idProducto como query param, filtra por ese producto.
   */ async findAll(idProducto) {
        const qb = this.productoAlergenoRepository.createQueryBuilder('pa').leftJoinAndSelect('pa.producto', 'producto');
        if (idProducto) {
            qb.where('pa.productoId = :idProducto', {
                idProducto
            });
        }
        return qb.getMany();
    }
    /**
   * Devuelve todos los alérgenos asociados a un producto concreto.
   * Lanza NotFoundException si el producto no existe.
   */ async findOne(idProducto) {
        const productoExiste = await this.productoRepository.findOne({
            where: {
                id: idProducto
            }
        });
        if (!productoExiste) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('PRODUCT_NOT_FOUND'));
        }
        return this.productoAlergenoRepository.find({
            where: {
                productoId: idProducto
            },
            relations: [
                'producto'
            ]
        });
    }
    /**
   * Reemplaza completamente el conjunto de alérgenos de un producto.
   * Elimina (hard delete) las asociaciones existentes y crea las nuevas.
   * Se usa hard delete porque la PK compuesta impide recrear registros con soft delete.
   */ async update(idProducto, dto) {
        const producto = await this.productoRepository.findOne({
            where: {
                id: idProducto
            }
        });
        if (!producto) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('PRODUCT_NOT_FOUND'));
        }
        await this.productoAlergenoRepository.createQueryBuilder().delete().from(_productoalergenoentity.ProductoAlergeno).where('producto_id = :idProducto', {
            idProducto
        }).execute();
        const uniqueAlergenos = [
            ...new Set(dto.alergenos)
        ];
        const newRelations = uniqueAlergenos.map((alergeno)=>this.productoAlergenoRepository.create({
                productoId: idProducto,
                alergeno,
                producto
            }));
        return this.productoAlergenoRepository.save(newRelations);
    }
    /**
   * Elimina (hard delete) una asociación concreta producto-alérgeno.
   * Lanza BadRequestException si el valor del alérgeno no pertenece al enum.
   * Lanza NotFoundException si la asociación no existe.
   */ async remove(idProducto, alergeno) {
        if (!Object.values(_productoenums.Alergeno).includes(alergeno)) {
            throw new _common.BadRequestException(`El alérgeno "${alergeno}" no es un valor válido`);
        }
        const productoAlergeno = await this.productoAlergenoRepository.findOne({
            where: {
                productoId: idProducto,
                alergeno: alergeno
            }
        });
        if (!productoAlergeno) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('PRODUCTO_ALERGENO_NOT_FOUND'));
        }
        await this.productoAlergenoRepository.createQueryBuilder().delete().from(_productoalergenoentity.ProductoAlergeno).where('producto_id = :idProducto AND alergeno = :alergeno', {
            idProducto,
            alergeno
        }).execute();
    }
    constructor(productoAlergenoRepository, productoRepository){
        this.productoAlergenoRepository = productoAlergenoRepository;
        this.productoRepository = productoRepository;
    }
};
ProductoAlergenoService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_productoalergenoentity.ProductoAlergeno)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_productoentity.Producto)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], ProductoAlergenoService);

//# sourceMappingURL=producto-alergeno.service.js.map