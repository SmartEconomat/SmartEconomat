'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProductoService', {
  enumerable: true,
  get: function () {
    return ProductoService;
  },
});
const _common = require('@nestjs/common');
const _productoentity = require('../producto.entity/producto.entity');
const _productorepository = require('../repository/producto.repository');
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _movimientohelper = require('../../../common/helpers/movimiento.helper');
const _typeorm = require('@nestjs/typeorm');
const _typeorm1 = require('typeorm');
const _productoproveedorentity = require('../producto-proveedor.entity/producto-proveedor.entity');
const _productoalergenoentity = require('../producto-alergeno.entity/producto-alergeno.entity');
const _ean13util = require('../../../common/utils/ean13.util');
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
function _ts_param(paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
}
let ProductoService = class ProductoService {
  async create(createProductoDto, userId) {
    const { alergenos, proveedores, ...rest } = createProductoDto;
    if (rest.codigoBarras) {
      if (!(0, _ean13util.validateEan13)(rest.codigoBarras)) {
        throw new _common.BadRequestException(
          'El código de barras proporcionado no es un EAN-13 válido'
        );
      }
      const exists = await this.productoRepository.existsByCodigoBarras(
        rest.codigoBarras
      );
      if (exists) {
        throw new _common.BadRequestException(
          _i18nhelper.I18nHelper.getError(
            'EL_C_DIGO_DE_BARRAS_YA_EST_REGISTRADO'
          )
        );
      }
    } else {
      rest.codigoBarras = await this.generateUniqueEan13();
    }
    return await this.dataSource.transaction(async (manager) => {
      const producto = manager.create(_productoentity.Producto, rest);
      if (alergenos && alergenos.length > 0) {
        producto.alergenos = alergenos.map((a) =>
          manager.create(_productoalergenoentity.ProductoAlergeno, {
            alergeno: a,
          })
        );
      }
      const savedProduct = await manager.save(producto);
      if (proveedores !== undefined) {
        await this.syncProveedoresWithManager(
          manager,
          savedProduct.id,
          proveedores
        );
      }
      await this.movimientoHelper.trackProductoCreation(
        userId,
        savedProduct.id,
        `Creación de producto: ${savedProduct.nombre}`
      );
      return manager.findOne(_productoentity.Producto, {
        where: {
          id: savedProduct.id,
        },
        relations: ['proveedores', 'proveedores.proveedor', 'alergenos'],
      });
    });
  }
  async findAll(query) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const queryBuilder = this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.proveedores', 'proveedores')
      .leftJoinAndSelect('proveedores.proveedor', 'proveedor')
      .leftJoinAndSelect('producto.alergenos', 'alergenos');
    if (query.codigoBarras) {
      queryBuilder.andWhere('producto.codigoBarras = :codigoBarras', {
        codigoBarras: query.codigoBarras,
      });
    } else if (query.searchTerm) {
      queryBuilder.andWhere('producto.nombre ILIKE :searchTerm', {
        searchTerm: `%${query.searchTerm}%`,
      });
    }
    if (query.categorias && query.categorias.length > 0) {
      queryBuilder.andWhere('producto.tipo IN (:...categorias)', {
        categorias: query.categorias,
      });
    }
    if (query.marcas && query.marcas.length > 0) {
      queryBuilder.andWhere('producto.marca IN (:...marcas)', {
        marcas: query.marcas,
      });
    }
    if (query.alergenos && query.alergenos.length > 0) {
      queryBuilder.innerJoin(
        'producto.alergenos',
        'alergenoFiltro',
        'alergenoFiltro.alergeno IN (:...alergenos)',
        {
          alergenos: query.alergenos,
        }
      );
    }
    if (query.minStock) {
      queryBuilder.innerJoin(
        'proveedores.inventarios',
        'inventarios',
        'inventarios.cantidad_actual > 0'
      );
    }
    queryBuilder.orderBy('producto.nombre', 'ASC');
    queryBuilder.skip((page - 1) * limit).take(limit);
    const [data, total] = await queryBuilder.getManyAndCount();
    const processedData = data.map((producto) => ({
      ...producto,
      proveedores: producto.proveedores || [],
    }));
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data: processedData,
      total,
      page,
      limit,
      totalPages,
    };
  }
  async findOne(id) {
    const producto = await this.productoRepository.findOne({
      where: {
        id,
      },
      relations: ['proveedores', 'proveedores.proveedor', 'alergenos'],
    });
    if (!producto) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PRODUCT_NOT_FOUND')
      );
    }
    return {
      ...producto,
      proveedores: producto.proveedores || [],
    };
  }
  async update(id, updateProductoDto, userId) {
    const { alergenos, proveedores, ...rest } = updateProductoDto;
    const producto = await this.findOne(id);
    if (rest.codigoBarras && rest.codigoBarras !== producto.codigoBarras) {
      if (!(0, _ean13util.validateEan13)(rest.codigoBarras)) {
        throw new _common.BadRequestException(
          'El código de barras proporcionado no es un EAN-13 válido'
        );
      }
      const exists = await this.productoRepository.existsByCodigoBarras(
        rest.codigoBarras
      );
      if (exists) {
        throw new _common.BadRequestException(
          _i18nhelper.I18nHelper.getError(
            'EL_C_DIGO_DE_BARRAS_YA_EST_REGISTRADO'
          )
        );
      }
    }
    this.productoRepository.merge(producto, rest);
    if (alergenos) {
      producto.alergenos = alergenos.map((a) => ({
        alergeno: a,
        idProducto: id,
      }));
    }
    await this.productoRepository.save(producto);
    if (proveedores !== undefined) {
      await this.syncProveedores(id, proveedores);
    }
    await this.movimientoHelper.trackProductoUpdate(
      userId,
      id,
      `Actualización de producto: ${producto.nombre}`
    );
    return this.findOne(id);
  }
  async remove(id, userId) {
    const producto = await this.findOne(id);
    const result = await this.productoRepository.delete(id);
    if (result.affected === 0) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PRODUCT_NOT_FOUND')
      );
    }
    await this.movimientoHelper.trackProductoDeletion(
      userId,
      id,
      `Eliminación de producto: ${producto.nombre}`
    );
  }
  async generateUniqueEan13() {
    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
      const code = (0, _ean13util.generateEan13)();
      const exists = await this.productoRepository.existsByCodigoBarras(code);
      if (!exists) {
        return code;
      }
    }
    throw new _common.InternalServerErrorException(
      'No se pudo generar un código EAN-13 único después de varios intentos'
    );
  }
  async syncProveedoresWithManager(manager, productoId, proveedores) {
    const existing = await manager.find(
      _productoproveedorentity.ProductoProveedor,
      {
        where: {
          producto: {
            id: productoId,
          },
        },
        relations: ['proveedor'],
      }
    );
    const existingIds = existing.map((ep) => ep.proveedor.id);
    const newProveedores = proveedores.filter(
      (p) => !existingIds.includes(p.proveedorId)
    );
    const proveedoresToUpdate = proveedores.filter((p) =>
      existingIds.includes(p.proveedorId)
    );
    if (newProveedores.length > 0) {
      const newRelations = newProveedores.map((p) =>
        manager.create(_productoproveedorentity.ProductoProveedor, {
          producto: {
            id: productoId,
          },
          proveedor: {
            id: p.proveedorId,
          },
          precioUnitario: p.precioUnitario ?? 0,
          marca: p.marcaEspecifica,
          codigoBarras: p.codigoBarras,
        })
      );
      await manager.save(newRelations);
    }
    if (proveedoresToUpdate.length > 0) {
      for (const p of proveedoresToUpdate) {
        const toUpdate = existing.find((e) => e.proveedor.id === p.proveedorId);
        if (toUpdate) {
          toUpdate.precioUnitario = p.precioUnitario ?? toUpdate.precioUnitario;
          toUpdate.marca = p.marcaEspecifica ?? toUpdate.marca;
          toUpdate.codigoBarras = p.codigoBarras ?? toUpdate.codigoBarras;
          await manager.save(toUpdate);
        }
      }
    }
    const currentProviderIds = proveedores.map((p) => p.proveedorId);
    const idsToRemove = existingIds.filter(
      (id) => !currentProviderIds.includes(id)
    );
    if (idsToRemove.length > 0) {
      for (const id of idsToRemove) {
        const toDelete = existing.find((e) => e.proveedor.id === id);
        if (toDelete) {
          await manager.softDelete(
            _productoproveedorentity.ProductoProveedor,
            toDelete.id
          );
        }
      }
    }
  }
  async syncProveedores(productoId, proveedores) {
    return this.syncProveedoresWithManager(
      this.dataSource.manager,
      productoId,
      proveedores
    );
  }
  constructor(
    productoRepository,
    productoProveedorRepository,
    productoAlergenoRepository,
    movimientoHelper,
    dataSource
  ) {
    this.productoRepository = productoRepository;
    this.productoProveedorRepository = productoProveedorRepository;
    this.productoAlergenoRepository = productoAlergenoRepository;
    this.movimientoHelper = movimientoHelper;
    this.dataSource = dataSource;
  }
};
ProductoService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(
      1,
      (0, _typeorm.InjectRepository)(_productoproveedorentity.ProductoProveedor)
    ),
    _ts_param(
      2,
      (0, _typeorm.InjectRepository)(_productoalergenoentity.ProductoAlergeno)
    ),
    _ts_param(4, (0, _typeorm.InjectDataSource)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _productorepository.ProductoRepository === 'undefined'
        ? Object
        : _productorepository.ProductoRepository,
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _movimientohelper.MovimientoHelper === 'undefined'
        ? Object
        : _movimientohelper.MovimientoHelper,
      typeof _typeorm1.DataSource === 'undefined'
        ? Object
        : _typeorm1.DataSource,
    ]),
  ],
  ProductoService
);
