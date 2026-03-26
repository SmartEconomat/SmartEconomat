import { SeedContext } from './seed-context';
import { faker } from '@faker-js/faker';
import { HistorialPrecio } from '../modules/producto/historial-precio-proveedor.entity/historial.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { In } from 'typeorm';

export const runSeeder = async (context: SeedContext) => {
  const dataSource = context.getDataSource();
  const historialRepo = dataSource.getRepository(HistorialPrecio);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);
  const productoRepo = dataSource.getRepository(Producto);

  await dataSource.query(
    `TRUNCATE TABLE "historial_precio" RESTART IDENTITY CASCADE;`
  );

  console.log('Obteniendo muestra de productos para historial...');
  const productosProv = await productoProveedorRepo.find({
    relations: ['producto'],
  });

  if (productosProv.length === 0) {
    console.warn(SeederI18nHelper.getError('NO_PRODUCTOS_PROVEEDOR'));
    return;
  }

  const historiales: HistorialPrecio[] = [];
  const productoIdsToUpdate = new Set<string>();

  for (const pp of productosProv) {
    const numHistoriales =
      process.env.NODE_ENV === 'test'
        ? 2
        : faker.number.int({ min: 2, max: 6 });
    const basePrecio = pp.precioUnitario || 10;

    let sumaPonderada = 0;
    let totalCantidad = 0;
    let ultimoPrecio = basePrecio;

    for (let i = 0; i < numHistoriales; i++) {
      const variacion = faker.number.float({ min: -0.15, max: 0.15 });
      const precioRecord = parseFloat(
        (basePrecio * (1 + variacion)).toFixed(2)
      );
      const cantidadRecord = faker.number.int({ min: 10, max: 100 });

      const historial = historialRepo.create({
        productoProveedor: pp,
        precio: precioRecord,
        cantidad: cantidadRecord,
        documentoOrigen: `SEED-ALB-${faker.string.alphanumeric(8).toUpperCase()}`,
        fecha: faker.date.recent({ days: 90 }),
      });

      historiales.push(historial);

      sumaPonderada += precioRecord * cantidadRecord;
      totalCantidad += cantidadRecord;
      ultimoPrecio = precioRecord;
    }

    pp.pmp =
      totalCantidad > 0
        ? Number((sumaPonderada / totalCantidad).toFixed(4))
        : ultimoPrecio;
    pp.precioUnitario = ultimoPrecio;
    await productoProveedorRepo.save(pp);

    if (pp.productoId) {
      productoIdsToUpdate.add(pp.productoId);
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

  if (productoIdsToUpdate.size > 0) {
    console.log(`Actualizando PMP de ${productoIdsToUpdate.size} productos...`);
    const ids = Array.from(productoIdsToUpdate);
    for (let i = 0; i < ids.length; i += 100) {
      const chunkIds = ids.slice(i, i + 100);
      const productos = await productoRepo.find({
        where: { id: In(chunkIds) },
        relations: ['proveedores'],
      });

      for (const prod of productos) {
        if (prod.proveedores && prod.proveedores.length > 0) {
          const sumPmp = prod.proveedores.reduce(
            (s, p) => s + Number(p.pmp || 0),
            0
          );
          prod.pmp = Number((sumPmp / prod.proveedores.length).toFixed(4));
          await productoRepo.save(prod);
        }
      }
    }
  }

  console.log(SeederI18nHelper.getSeederSuccess('historial_precio'));
};
