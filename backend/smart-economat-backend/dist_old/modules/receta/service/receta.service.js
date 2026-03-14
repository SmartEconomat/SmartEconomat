'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RecetaService', {
  enumerable: true,
  get: function () {
    return RecetaService;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('typeorm');
const _recetaentity = require('../receta.entity/receta.entity');
const _recetarepository = require('../repository/receta.repository');
const _inventarioentity = require('../../inventario/inventario.entity/inventario.entity');
const _movimientoentity = require('../../movimiento/movimiento.entity/movimiento.entity');
const _movimientoenums = require('../../movimiento/enums/movimiento.enums');
const _productoproveedorentity = require('../../producto/producto-proveedor.entity/producto-proveedor.entity');
const _i18nhelper = require('../../../common/helpers/i18n.helper');
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
let RecetaService = class RecetaService {
  async create(createRecetaDto) {
    return this.recetaRepository.create(createRecetaDto);
  }
  async findAll(query) {
    return this.recetaRepository.findAllPaginated(query);
  }
  async findOne(id) {
    const receta = await this.recetaRepository.findById(id);
    if (!receta) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND')
      );
    }
    return receta;
  }
  async update(id, updateRecetaDto) {
    await this.findOne(id);
    return this.recetaRepository.update(id, updateRecetaDto);
  }
  async remove(id) {
    await this.findOne(id);
    await this.recetaRepository.remove(id);
  }
  async duplicate(duplicateRecetaDto) {
    return this.recetaRepository.duplicate(
      duplicateRecetaDto.sourceId,
      duplicateRecetaDto.newName
    );
  }
  async getDetalle(id) {
    const receta = await this.recetaRepository.findById(id);
    if (!receta) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND')
      );
    }
    const productoIds = receta.ingredientes?.map((i) => i.producto.id) || [];
    let stocks = [];
    if (productoIds.length > 0) {
      stocks = await this.dataSource
        .getRepository(_inventarioentity.Inventario)
        .createQueryBuilder('inv')
        .innerJoin('inv.productoProveedor', 'pp')
        .where('pp.producto_id IN (:...productoIds)', {
          productoIds,
        })
        .select('pp.producto_id', 'productoId')
        .addSelect('SUM(inv.cantidad_actual)', 'totalStock')
        .groupBy('pp.producto_id')
        .getRawMany();
    }
    const stockMap = new Map(
      stocks.map((s) => [s.productoId, Number(s.totalStock)])
    );
    const alergenosSet = new Set();
    const detalleIngredientes = [];
    if (receta.ingredientes) {
      for (const ing of receta.ingredientes) {
        const stockActual = stockMap.get(ing.producto.id) || 0;
        const cantidadFaltante = Math.max(0, ing.cantidad - stockActual);
        detalleIngredientes.push({
          cantidadNecesaria: ing.cantidad,
          stockActual,
          cantidadFaltante,
          unidad: ing.unidad,
          productoId: ing.producto.id,
          productoNombre: ing.producto.nombre,
        });
        if (ing.producto.alergenos) {
          ing.producto.alergenos.forEach((pa) => {
            if (pa.alergeno) {
              alergenosSet.add(pa.alergeno);
            }
          });
        }
      }
    }
    return {
      receta,
      detalleIngredientes,
      alergenosConsolidados: Array.from(alergenosSet).filter(
        (a) => a !== null && a !== undefined
      ),
    };
  }
  async calcularEscandallo(id) {
    const receta = await this.recetaRepository.findById(id);
    if (!receta) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND')
      );
    }
    if (!receta.ingredientes || receta.ingredientes.length === 0) {
      return {
        recetaId: receta.id,
        recetaNombre: receta.nombre,
        costoTotal: 0,
        desglosePorIngrediente: [],
      };
    }
    const productoIds = receta.ingredientes.map((i) => i.producto.id);
    const productosProveedores = await this.dataSource
      .getRepository(_productoproveedorentity.ProductoProveedor)
      .createQueryBuilder('pp')
      .innerJoinAndSelect('pp.producto', 'producto')
      .leftJoinAndSelect('pp.historialPrecios', 'historial')
      .where('producto.id IN (:...productoIds)', {
        productoIds,
      })
      .getMany();
    const ppMap = new Map();
    for (const pp of productosProveedores) {
      const pid = pp.producto.id;
      if (!ppMap.has(pid)) ppMap.set(pid, []);
      ppMap.get(pid).push(pp);
    }
    let costoTotal = 0;
    const desglosePorIngrediente = [];
    for (const ing of receta.ingredientes) {
      const pps = ppMap.get(ing.producto.id) ?? [];
      const precios = pps
        .map((pp) => pp.precioUnitario)
        .filter((p) => p !== null && p !== undefined && p > 0);
      let precioUnitario;
      if (precios.length > 0) {
        precioUnitario =
          precios.reduce((sum, p) => sum + p, 0) / precios.length;
      } else {
        const allHistorial = pps
          .flatMap((pp) => pp.historialPrecios ?? [])
          .sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
        precioUnitario = allHistorial.length > 0 ? allHistorial[0].precio : 0;
      }
      const costoIngrediente = precioUnitario * ing.cantidad;
      costoTotal += costoIngrediente;
      desglosePorIngrediente.push({
        productoId: ing.producto.id,
        productoNombre: ing.producto.nombre,
        cantidad: ing.cantidad,
        unidad: ing.unidad,
        precioUnitario,
        costoIngrediente,
      });
    }
    return {
      recetaId: receta.id,
      recetaNombre: receta.nombre,
      costoTotal,
      desglosePorIngrediente,
    };
  }
  async cocinar(id, dto) {
    const cantidadRecetas = dto.cantidad || 1;
    const receta = await this.recetaRepository.findById(id);
    if (!receta) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND')
      );
    }
    if (!receta.ingredientes || receta.ingredientes.length === 0) {
      return;
    }
    await this.dataSource.transaction(async (manager) => {
      const productoIds = receta.ingredientes.map((i) => i.producto.id);
      const inventarios = await manager
        .createQueryBuilder(_inventarioentity.Inventario, 'inv')
        .innerJoinAndSelect('inv.productoProveedor', 'pp')
        .innerJoinAndSelect('pp.producto', 'prod')
        .where('pp.producto_id IN (:...productoIds)', {
          productoIds,
        })
        .andWhere('inv.cantidad_actual > 0')
        .orderBy('inv.fecha_caducidad', 'ASC', 'NULLS LAST')
        .addOrderBy('inv.fecha_entrada', 'ASC')
        .setLock('pessimistic_write')
        .getMany();
      const movimientos = [];
      for (const ing of receta.ingredientes) {
        let cantidadRequerida = ing.cantidad * cantidadRecetas;
        const invsProducto = inventarios.filter(
          (inv) => inv.productoProveedor.producto.id === ing.producto.id
        );
        const totalStock = invsProducto.reduce(
          (sum, inv) => sum + Number(inv.cantidadActual),
          0
        );
        if (totalStock < cantidadRequerida) {
          throw new _common.BadRequestException(
            _i18nhelper.I18nHelper.getError('NOT_ENOUGH_STOCK_FOR_INGREDIENT', {
              ingredient: ing.producto.nombre,
            })
          );
        }
        for (const inv of invsProducto) {
          if (cantidadRequerida <= 0) break;
          const disponible = Number(inv.cantidadActual);
          const descontar = Math.min(disponible, cantidadRequerida);
          inv.ajustarCantidad(-descontar);
          cantidadRequerida -= descontar;
          const movimiento = manager.create(_movimientoentity.Movimiento, {
            tipo: _movimientoenums.TipoMovimiento.SALIDA_ELABORACION,
            cantidad: descontar,
            inventario: inv,
            productoProveedor: inv.productoProveedor,
            entidad: 'Receta',
            entidadId: id,
            descripcion: 'Elaboración de receta: ' + receta.nombre,
          });
          movimientos.push(movimiento);
        }
      }
      await manager.save(_inventarioentity.Inventario, inventarios);
      await manager.save(_movimientoentity.Movimiento, movimientos);
    });
  }
  async recalcularCostes(id) {
    const receta = await this.recetaRepository.findById(id);
    if (!receta) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('RECIPE_NOT_FOUND')
      );
    }
    const { costoTotal } = await this.calcularEscandallo(id);
    const costeUnitarioEstimado =
      receta.rendimiento && receta.rendimiento > 0
        ? costoTotal / receta.rendimiento
        : costoTotal;
    await this.dataSource.getRepository(_recetaentity.Receta).update(id, {
      costeUnitarioEstimado,
    });
    const updated = await this.recetaRepository.findById(id);
    return updated;
  }
  constructor(recetaRepository, dataSource) {
    this.recetaRepository = recetaRepository;
    this.dataSource = dataSource;
  }
};
RecetaService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _recetarepository.RecetaRepository === 'undefined'
        ? Object
        : _recetarepository.RecetaRepository,
      typeof _typeorm.DataSource === 'undefined' ? Object : _typeorm.DataSource,
    ]),
  ],
  RecetaService
);
