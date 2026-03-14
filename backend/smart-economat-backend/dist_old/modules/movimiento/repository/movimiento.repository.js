'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'MovimientoRepository', {
  enumerable: true,
  get: function () {
    return MovimientoRepository;
  },
});
const _typeorm = require('typeorm');
const _movimientoentity = require('../movimiento.entity/movimiento.entity');
const _typeorm1 = require('@nestjs/typeorm');
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
let MovimientoRepository = class MovimientoRepository {
  createMovimiento(data) {
    const movimientoData = {
      tipo: data.tipo,
      cantidad: data.cantidad,
      entidad: data.entidadTipo,
      entidadId: data.entidadId,
      descripcion: data.descripcion,
      ...(data.usuario
        ? {
            usuario: {
              id: data.usuario,
            },
          }
        : {}),
      ...(data.inventario
        ? {
            inventario: {
              id: data.inventario,
            },
          }
        : {}),
    };
    return this.repo.save(this.repo.create(movimientoData));
  }
  findAll(query) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    return this.repo
      .findAndCount({
        relations: ['usuario', 'productoProveedor', 'inventario'],
        order: {
          createdAt: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      })
      .then(([data, total]) => ({
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      }));
  }
  findById(id) {
    return this.repo.findOne({
      where: {
        id,
      },
      relations: ['usuario', 'productoProveedor', 'inventario'],
    });
  }
  updateMovimiento(id, data) {
    const updateData = {
      ...(data.tipo !== undefined && {
        tipo: data.tipo,
      }),
      ...(data.cantidad !== undefined && {
        cantidad: data.cantidad,
      }),
      ...(data.descripcion !== undefined && {
        descripcion: data.descripcion,
      }),
      ...(data.usuario && {
        usuario: {
          id: data.usuario,
        },
      }),
    };
    return this.repo.update(id, updateData);
  }
  deleteMovimiento(id) {
    return this.repo.softDelete(id);
  }
  /**
   * Busca movimientos de un producto o usuario específico con filtros opcionales.
   *
   * @param dto - DTO con entityId (ProductoProveedor), userId, tipo, rango de fechas
   * @returns Array de movimientos ordenados cronológicamente (DESC)
   */ async findMovimientosByEntity(dto) {
    const {
      entityId,
      userId,
      type,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = dto;
    if (!entityId && !userId) {
      return [];
    }
    const query = this.repo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.productoProveedor', 'productoProveedor')
      .leftJoinAndSelect('movimiento.inventario', 'inventario');
    if (entityId) {
      query.where('movimiento.productoProveedorId = :entityId', {
        entityId,
      });
    }
    if (userId) {
      if (entityId) {
        query.orWhere('movimiento.usuarioId = :userId', {
          userId,
        });
      } else {
        query.where('movimiento.usuarioId = :userId', {
          userId,
        });
      }
    }
    if (type) {
      query.andWhere('movimiento.tipo = :type', {
        type,
      });
    }
    if (startDate) {
      query.andWhere('movimiento.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      query.andWhere('movimiento.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }
    query.orderBy(`movimiento.${sortBy}`, sortOrder);
    return query.getMany();
  }
  constructor(repo) {
    this.repo = repo;
  }
};
MovimientoRepository = _ts_decorate(
  [
    _ts_param(0, (0, _typeorm1.InjectRepository)(_movimientoentity.Movimiento)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm.Repository === 'undefined' ? Object : _typeorm.Repository,
    ]),
  ],
  MovimientoRepository
);
