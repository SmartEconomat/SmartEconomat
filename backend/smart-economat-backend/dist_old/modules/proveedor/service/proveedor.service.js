'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProveedorService', {
  enumerable: true,
  get: function () {
    return ProveedorService;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('typeorm');
const _proveedorrepository = require('../repository/proveedor.repository');
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
let ProveedorService = class ProveedorService {
  async create(createProveedorDto) {
    const { nombre, nif } = createProveedorDto;
    const existingNombre = await this.proveedorRepository.findOne({
      where: {
        nombre,
      },
    });
    if (existingNombre) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('DUPLICATE_ENTRY')
      );
    }
    if (nif) {
      const existingNif = await this.proveedorRepository.findOne({
        where: {
          nif,
        },
      });
      if (existingNif) {
        throw new _common.BadRequestException(
          _i18nhelper.I18nHelper.getError('DUPLICATE_ENTRY')
        );
      }
    }
    const proveedor = this.proveedorRepository.create(createProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }
  async findAll(query) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const whereCondition = query.searchTerm
      ? [
          {
            nombre: (0, _typeorm.ILike)(`%${query.searchTerm}%`),
          },
          {
            nif: (0, _typeorm.ILike)(`%${query.searchTerm}%`),
          },
          {
            contacto: (0, _typeorm.ILike)(`%${query.searchTerm}%`),
          },
          {
            email: (0, _typeorm.ILike)(`%${query.searchTerm}%`),
          },
        ]
      : {};
    const [data, total] = await this.proveedorRepository.findAndCount({
      where: whereCondition,
      relations: ['productos'],
      order: {
        nombre: 'ASC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    const processedData = data.map((proveedor) => ({
      ...proveedor,
      productos: proveedor.productos || [],
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
    const proveedor = await this.proveedorRepository.findOne({
      where: {
        id,
      },
      relations: ['productos'],
    });
    if (!proveedor) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PROVIDER_NOT_FOUND')
      );
    }
    return {
      ...proveedor,
      productos: proveedor.productos || [],
    };
  }
  async update(id, updateProveedorDto) {
    const proveedor = await this.findOne(id);
    const { nombre, nif } = updateProveedorDto;
    if (nombre && nombre !== proveedor.nombre) {
      const existingNombre = await this.proveedorRepository.findOne({
        where: {
          nombre,
        },
      });
      if (existingNombre) {
        throw new _common.BadRequestException(
          _i18nhelper.I18nHelper.getError('DUPLICATE_ENTRY')
        );
      }
    }
    if (nif && nif !== proveedor.nif) {
      const existingNif = await this.proveedorRepository.findOne({
        where: {
          nif,
        },
      });
      if (existingNif) {
        throw new _common.BadRequestException(
          _i18nhelper.I18nHelper.getError('DUPLICATE_ENTRY')
        );
      }
    }
    this.proveedorRepository.merge(proveedor, updateProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }
  async remove(id) {
    const proveedor = await this.proveedorRepository.findOne({
      where: {
        id,
      },
      relations: ['productos', 'pedidos'],
    });
    if (!proveedor) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PROVIDER_NOT_FOUND')
      );
    }
    if (
      (proveedor.productos && proveedor.productos.length > 0) ||
      (proveedor.pedidos && proveedor.pedidos.length > 0)
    ) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('ENTITY_HAS_RELATIONS')
      );
    }
    await this.proveedorRepository.remove(proveedor);
  }
  constructor(proveedorRepository) {
    this.proveedorRepository = proveedorRepository;
  }
};
ProveedorService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _proveedorrepository.ProveedorRepository === 'undefined'
        ? Object
        : _proveedorrepository.ProveedorRepository,
    ]),
  ],
  ProveedorService
);
