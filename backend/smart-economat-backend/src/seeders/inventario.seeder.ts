import { DataSource } from 'typeorm';
import { Inventario } from '../modules/inventario/inventario.entity/inventario.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { localInventario } from '../modules/inventario/enums/inventario.enums';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const inventarioRepo = dataSource.getRepository(Inventario);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  await dataSource.query(
    `TRUNCATE TABLE "inventario" RESTART IDENTITY CASCADE;`
  );

  const productosProv = await productoProveedorRepo.find();
  if (productosProv.length === 0) {
    throw new Error(
      'No hay producto_proveedor. Ejecuta producto.seeder.ts primero.'
    );
  }

  const inventarios: Inventario[] = [];

  for (const pp of productosProv) {
    const inventario = new Inventario();
    inventario.productoProveedor = pp;
    inventario.cantidadActual = faker.number.int({ min: 0, max: 100 });
    inventario.cantidadMinima = faker.number.int({
      min: 0,
      max: inventario.cantidadActual,
    });
    inventario.cantidadMaxima = faker.number.int({ min: 1, max: 100 });
    inventario.ubicacionAlmacen = faker.helpers.arrayElement(
      Object.values(localInventario)
    );
    inventario.fechaEntrada = faker.date.recent({ days: 90 });
    inventario.fechaCaducidad = faker.date.soon({
      days: faker.number.int({ min: 1, max: 365 }),
      refDate: inventario.fechaEntrada,
    });

    inventarios.push(inventario);
  }

  if (inventarios.length > 0) {
    await inventarioRepo.save(inventarios);
  }

  console.log('Seeder de historial_precio ejecutado correctamente.');
};
