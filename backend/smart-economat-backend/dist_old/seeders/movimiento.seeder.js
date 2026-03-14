'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'runSeeder', {
  enumerable: true,
  get: function () {
    return runSeeder;
  },
});
const _movimientoentity = require('../modules/movimiento/movimiento.entity/movimiento.entity');
const _movimientoenums = require('../modules/movimiento/enums/movimiento.enums');
const _usuarioentity = require('../modules/usuario/usuario.entity/usuario.entity');
const _productoentity = require('../modules/producto/producto.entity/producto.entity');
const _pedidoentity = require('../modules/pedido/pedido.entity/pedido.entity');
const _seederi18nhelper = require('../common/helpers/seeder-i18n.helper');
function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== 'function') return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function (nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {
      default: obj,
    };
  }
  var cache = _getRequireWildcardCache(nodeInterop);
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {
    __proto__: null,
  };
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (key !== 'default' && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}
const NUM_MOVIMIENTOS = 50;
const runSeeder = async (dataSource) => {
  const { faker } = await Promise.resolve().then(() =>
    /*#__PURE__*/ _interop_require_wildcard(require('@faker-js/faker'))
  );
  const movimientoRepo = dataSource.getRepository(_movimientoentity.Movimiento);
  const usuarioRepo = dataSource.getRepository(_usuarioentity.Usuario);
  const productoRepo = dataSource.getRepository(_productoentity.Producto);
  const pedidoRepo = dataSource.getRepository(_pedidoentity.Pedido);
  const usuarios = await usuarioRepo.find();
  const productos = await productoRepo.find();
  const pedidos = await pedidoRepo.find();
  const movimientos = [];
  const entidades = ['PRODUCTO', 'PEDIDO', 'AJUSTE'];
  for (let i = 0; i < NUM_MOVIMIENTOS; i++) {
    const entidadSeleccionada = faker.helpers.arrayElement(entidades);
    let entidadId = faker.string.uuid();
    if (entidadSeleccionada === 'PRODUCTO' && productos.length > 0) {
      entidadId = faker.helpers.arrayElement(productos).id;
    } else if (entidadSeleccionada === 'PEDIDO' && pedidos.length > 0) {
      entidadId = faker.helpers.arrayElement(pedidos).id;
    }
    const movimiento = movimientoRepo.create({
      tipo: faker.helpers.arrayElement(_movimientoenums.TIPOS_DISPONIBLES),
      cantidad: faker.number.int({
        min: 1,
        max: 100,
      }),
      descripcion: faker.datatype.boolean({
        probability: 0.7,
      })
        ? faker.lorem.sentence()
        : undefined,
      entidad: entidadSeleccionada,
      entidadId: entidadId,
      usuario: faker.helpers.arrayElement(usuarios),
    });
    movimientos.push(movimiento);
  }
  await movimientoRepo.save(movimientos);
  console.log(
    _seederi18nhelper.SeederI18nHelper.getSeederSuccess('movimientos')
  );
};
