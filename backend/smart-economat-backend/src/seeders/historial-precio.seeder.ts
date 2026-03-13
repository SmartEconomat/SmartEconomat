import { DataSource } from 'typeorm';
import { HistorialPrecio } from '../modules/producto/historial-precio-proveedor.entity/historial.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const historialRepo = dataSource.getRepository(HistorialPrecio);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  await dataSource.query(
    `TRUNCATE TABLE "historial_precio" RESTART IDENTITY CASCADE;`
  );

  const productosProv = await productoProveedorRepo.find();
  if (productosProv.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_PRODUCTOS_PROVEEDOR'));
  }

  const historiales: HistorialPrecio[] = [];

  for (const pp of productosProv) {
    const numHistoriales =
      process.env.NODE_ENV === 'test'
        ? 1
        : faker.number.int({ min: 1, max: 5 });
    const precioActual = pp.precioUnitario || 10;

    for (let i = 0; i < numHistoriales; i++) {
      const variacion = faker.number.float({ min: -0.3, max: 0.5 });
      const precioAnterior = parseFloat(
        (precioActual * (1 + variacion)).toFixed(2)
      );

      const historial = new HistorialPrecio();
      historial.productoProveedor = pp;
      historial.precio = precioAnterior;
      historial.fecha = faker.date.recent({ days: 3 });
      historiales.push(historial);
    }
  }

  if (historiales.length > 0) {
    await historialRepo.save(historiales);
  }

  console.log(SeederI18nHelper.getSeederSuccess('historial_precio'));
};
