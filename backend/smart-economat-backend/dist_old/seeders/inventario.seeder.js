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
const _inventarioentity = require('../modules/inventario/inventario.entity/inventario.entity');
const _productoproveedorentity = require('../modules/producto/producto-proveedor.entity/producto-proveedor.entity');
const _ubicacionentity = require('../modules/ubicacion/ubicacion.entity/ubicacion.entity');
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
const runSeeder = async (dataSource) => {
  const { faker } = await Promise.resolve().then(() =>
    /*#__PURE__*/ _interop_require_wildcard(require('@faker-js/faker'))
  );
  const inventarioRepo = dataSource.getRepository(_inventarioentity.Inventario);
  const productoProveedorRepo = dataSource.getRepository(
    _productoproveedorentity.ProductoProveedor
  );
  await dataSource.query(
    `TRUNCATE TABLE "inventario" RESTART IDENTITY CASCADE;`
  );
  const productosProv = await productoProveedorRepo.find();
  if (productosProv.length === 0) {
    throw new Error(
      _seederi18nhelper.SeederI18nHelper.getError('NO_PRODUCTOS_PROVEEDOR')
    );
  }
  const ubicacionRepo = dataSource.getRepository(_ubicacionentity.Ubicacion);
  await dataSource.query(
    `TRUNCATE TABLE "ubicacion" RESTART IDENTITY CASCADE;`
  );
  const nombresUbicaciones = [
    'Almacen A',
    'Frigorifico A',
    'Bodega A',
    'Almacen B',
    'Frigorifico B',
    'Bodega B',
  ];
  const dbUbicaciones = [];
  for (const nombre of nombresUbicaciones) {
    const u = ubicacionRepo.create({
      nombre,
      descripcion: `Seeder: ${nombre}`,
    });
    dbUbicaciones.push(await ubicacionRepo.save(u));
  }
  const inventarios = [];
  for (const pp of productosProv) {
    const inventario = new _inventarioentity.Inventario();
    inventario.productoProveedor = pp;
    inventario.cantidadActual = faker.number.int({
      min: 0,
      max: 100,
    });
    inventario.cantidadMinima = faker.number.int({
      min: 0,
      max: inventario.cantidadActual,
    });
    inventario.cantidadMaxima = faker.number.int({
      min: Math.max(inventario.cantidadMinima, inventario.cantidadActual) + 10,
      max: 200,
    });
    inventario.ubicacion = faker.helpers.arrayElement(dbUbicaciones);
    inventario.fechaEntrada = faker.date.recent({
      days: 90,
    });
    inventario.fechaCaducidad = faker.date.soon({
      days: faker.number.int({
        min: 1,
        max: 365,
      }),
      refDate: inventario.fechaEntrada,
    });
    inventarios.push(inventario);
  }
  if (inventarios.length > 0) {
    await inventarioRepo.save(inventarios);
  }
  console.log(
    _seederi18nhelper.SeederI18nHelper.getSeederSuccess('inventario')
  );
};
