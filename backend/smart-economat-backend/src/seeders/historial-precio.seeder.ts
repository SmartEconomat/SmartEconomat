import { SeedContext } from './seed-context';
import { faker } from '@faker-js/faker';
import { HistorialPrecio } from '../modules/producto/historial-precio-proveedor.entity/historial.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

export const runSeeder = async (context: SeedContext) => {
  const dataSource = context.getDataSource();
  const historialRepo = dataSource.getRepository(HistorialPrecio);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  await dataSource.query(
    `TRUNCATE TABLE "historial_precio" RESTART IDENTITY CASCADE;`
  );

  console.log('Obteniendo muestra de productos para historial...');
  const productosProv = await productoProveedorRepo.find({ take: 500 });
  if (productosProv.length === 0) {
    console.warn(SeederI18nHelper.getError('NO_PRODUCTOS_PROVEEDOR'));
    return;
  }

  const historiales: HistorialPrecio[] = [];

  for (const pp of productosProv) {
    const numHistoriales =
      process.env.NODE_ENV === 'test'
        ? 1
        : faker.number.int({ min: 1, max: 3 });
    const precioActual = pp.precioUnitario || 10;

    for (let i = 0; i < numHistoriales; i++) {
      const variacion = faker.number.float({ min: -0.1, max: 0.2 });
      const precioAnterior = parseFloat(
        (precioActual * (1 + variacion)).toFixed(2)
      );

      const historial = new HistorialPrecio();
      historial.productoProveedor = pp;
      historial.precio = precioAnterior;
      historial.fecha = faker.date.recent({ days: 30 });
      historiales.push(historial);
    }
  }

  if (historiales.length > 0) {
    console.log(
      `Guardando ${historiales.length} registros de historial de precios en lotes...`
    );
    const CHUNK_SIZE = 500;
    for (let i = 0; i < historiales.length; i += CHUNK_SIZE) {
      const chunk = historiales.slice(i, i + CHUNK_SIZE);
      await historialRepo.save(chunk);
    }
  }

  console.log(SeederI18nHelper.getSeederSuccess('historial_precio'));
};
