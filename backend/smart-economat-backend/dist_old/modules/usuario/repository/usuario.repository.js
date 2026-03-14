'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UsuarioRepository', {
  enumerable: true,
  get: function () {
    return UsuarioRepository;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('typeorm');
const _usuarioentity = require('../usuario.entity/usuario.entity');
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
let UsuarioRepository = class UsuarioRepository {
  createUsuario(data) {
    return this.repo.save(this.repo.create(data));
  }
  findAll(query) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    return this.repo
      .findAndCount({
        relations: ['movimientos', 'pedidos', 'recepciones'],
        order: {
          username: 'ASC',
        },
        skip: (page - 1) * limit,
        take: limit,
      })
      .then(([data, total]) => {
        const processedData = data.map((usuario) => ({
          ...usuario,
          movimientos: usuario.movimientos || [],
          pedidos: usuario.pedidos || [],
          recepciones: usuario.recepciones || [],
        }));
        return {
          data: processedData,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        };
      });
  }
  findById(id) {
    return this.repo.findOne({
      where: {
        id,
      },
      relations: ['movimientos', 'pedidos', 'recepciones'],
    });
  }
  findByIdWithPassword(id) {
    return this.repo
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.id = :id', {
        id,
      })
      .getOne();
  }
  async updateUsuario(id, data) {
    const usuario = await this.findById(id);
    if (!usuario) return null;
    Object.assign(usuario, data);
    await this.repo.save(usuario);
    return this.findById(id);
  }
  deleteUsuario(id) {
    return this.repo.delete(id);
  }
  constructor(repo) {
    this.repo = repo;
  }
};
UsuarioRepository = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm1.InjectRepository)(_usuarioentity.Usuario)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm.Repository === 'undefined' ? Object : _typeorm.Repository,
    ]),
  ],
  UsuarioRepository
);
