"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProduccionService", {
    enumerable: true,
    get: function() {
        return ProduccionService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("typeorm");
const _recetarepository = require("../repository/receta.repository");
const _produccionloteentity = require("../produccion-lote.entity/produccion-lote.entity");
const _inventarioentity = require("../../inventario/inventario.entity/inventario.entity");
const _movimientoentity = require("../../movimiento/movimiento.entity/movimiento.entity");
const _productoproveedorentity = require("../../producto/producto-proveedor.entity/producto-proveedor.entity");
const _movimientoenums = require("../../movimiento/enums/movimiento.enums");
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
let ProduccionService = class ProduccionService {
    async ejecutarProduccion(dto, userId) {
        const receta = await this.recetaRepository.findById(dto.recetaId);
        if (!receta) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND'));
        }
        if (!receta.productoResultado) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('RECIPE_NO_RESULT_PRODUCT'));
        }
        if (!receta.rendimiento || receta.rendimiento <= 0) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('RECIPE_NO_RENDIMIENTO'));
        }
        if (!receta.ingredientes || receta.ingredientes.length === 0) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('RECIPE_NO_INGREDIENTS'));
        }
        const productoResultadoId = receta.productoResultado.id;
        const productoProveedorResultado = await this.dataSource.getRepository(_productoproveedorentity.ProductoProveedor).findOne({
            where: {
                producto: {
                    id: productoResultadoId
                }
            },
            relations: [
                'producto'
            ]
        });
        if (!productoProveedorResultado) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND'));
        }
        return this.dataSource.transaction(async (manager)=>{
            const multiplicador = dto.cantidadProducida / receta.rendimiento;
            const productoIds = receta.ingredientes.map((i)=>i.producto.id);
            const inventarios = await manager.createQueryBuilder(_inventarioentity.Inventario, 'inv').innerJoinAndSelect('inv.productoProveedor', 'pp').innerJoinAndSelect('pp.producto', 'prod').where('pp.producto_id IN (:...productoIds)', {
                productoIds
            }).andWhere('inv.cantidad_actual > 0').orderBy('inv.fecha_caducidad', 'ASC', 'NULLS LAST').addOrderBy('inv.fecha_entrada', 'ASC').setLock('pessimistic_write').getMany();
            let costeTotalReal = 0;
            const consumos = [];
            for (const ing of receta.ingredientes){
                const cantidadNeta = ing.cantidad * multiplicador;
                const merma = Number(ing.mermaAplicada ?? 0);
                const cantidadBruta = merma > 0 && merma < 100 ? cantidadNeta / (1 - merma / 100) : cantidadNeta;
                let cantidadRequerida = cantidadBruta;
                const invsProducto = inventarios.filter((inv)=>inv.productoProveedor.producto.id === ing.producto.id);
                const totalStock = invsProducto.reduce((sum, inv)=>sum + Number(inv.cantidadActual), 0);
                if (totalStock < cantidadRequerida) {
                    throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('NOT_ENOUGH_STOCK_FOR_INGREDIENT', {
                        ingredient: ing.producto.nombre
                    }));
                }
                for (const inv of invsProducto){
                    if (cantidadRequerida <= 0) break;
                    const disponible = Number(inv.cantidadActual);
                    const descontar = Math.min(disponible, cantidadRequerida);
                    inv.ajustarCantidad(-descontar);
                    cantidadRequerida -= descontar;
                    const precioUnitario = inv.productoProveedor.precioUnitario != null ? Number(inv.productoProveedor.precioUnitario) : 0;
                    costeTotalReal += precioUnitario * descontar;
                    consumos.push({
                        inv,
                        descontar,
                        pp: inv.productoProveedor,
                        descripcion: `Producción: ${receta.nombre} — consumo de ${ing.producto.nombre}`
                    });
                }
            }
            await manager.save(_inventarioentity.Inventario, inventarios);
            let fechaCaducidad = null;
            if (dto.fechaCaducidadManual) {
                fechaCaducidad = new Date(dto.fechaCaducidadManual);
            } else if (receta.diasCaducidad && receta.diasCaducidad > 0) {
                fechaCaducidad = new Date();
                fechaCaducidad.setDate(fechaCaducidad.getDate() + receta.diasCaducidad);
            }
            const lote = manager.create(_produccionloteentity.ProduccionLote, {
                receta: {
                    id: receta.id
                },
                usuario: {
                    id: userId
                },
                cantidadProducida: dto.cantidadProducida,
                fechaProduccion: new Date(),
                fechaCaducidad,
                costeTotalReal
            });
            await manager.save(lote);
            const movimientosConsumo = consumos.map((c)=>manager.create(_movimientoentity.Movimiento, {
                    tipo: _movimientoenums.TipoMovimiento.PRODUCCION_CONSUMO,
                    cantidad: c.descontar,
                    inventario: c.inv,
                    productoProveedor: c.pp,
                    entidad: 'ProduccionLote',
                    entidadId: lote.id,
                    descripcion: c.descripcion,
                    usuario: {
                        id: userId
                    }
                }));
            await manager.save(_movimientoentity.Movimiento, movimientosConsumo);
            const inventarioResultado = manager.create(_inventarioentity.Inventario, {
                productoProveedor: productoProveedorResultado,
                cantidadActual: dto.cantidadProducida,
                cantidadMinima: 0,
                cantidadMaxima: null,
                ubicacion: {
                    id: dto.ubicacionDestinoId
                },
                fechaEntrada: new Date(),
                fechaCaducidad
            });
            await manager.save(inventarioResultado);
            const movResultado = manager.create(_movimientoentity.Movimiento, {
                tipo: _movimientoenums.TipoMovimiento.PRODUCCION_RESULTADO,
                cantidad: dto.cantidadProducida,
                inventario: inventarioResultado,
                productoProveedor: productoProveedorResultado,
                entidad: 'ProduccionLote',
                entidadId: lote.id,
                descripcion: `Producción: ${receta.nombre} — resultado en inventario`,
                usuario: {
                    id: userId
                }
            });
            await manager.save(movResultado);
            const savedLote = await manager.findOne(_produccionloteentity.ProduccionLote, {
                where: {
                    id: lote.id
                },
                relations: [
                    'receta',
                    'usuario'
                ]
            });
            return savedLote;
        });
    }
    async findAll() {
        return this.dataSource.getRepository(_produccionloteentity.ProduccionLote).find({
            relations: [
                'receta',
                'usuario'
            ],
            order: {
                fechaProduccion: 'DESC'
            }
        });
    }
    async findOne(id) {
        const lote = await this.dataSource.getRepository(_produccionloteentity.ProduccionLote).findOne({
            where: {
                id
            },
            relations: [
                'receta',
                'usuario'
            ]
        });
        if (!lote) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('PRODUCCION_LOTE_NOT_FOUND'));
        }
        return lote;
    }
    constructor(recetaRepository, dataSource){
        this.recetaRepository = recetaRepository;
        this.dataSource = dataSource;
    }
};
ProduccionService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _recetarepository.RecetaRepository === "undefined" ? Object : _recetarepository.RecetaRepository,
        typeof _typeorm.DataSource === "undefined" ? Object : _typeorm.DataSource
    ])
], ProduccionService);

//# sourceMappingURL=produccion.service.js.map