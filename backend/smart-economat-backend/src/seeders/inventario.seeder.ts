import { DataSource } from 'typeorm';
import { Inventario } from '../modules/productos/inventario.entity/inventario.entity';
import { ProductoProveedor } from '../modules/productos/producto-proveedor.entity/producto-proveedor.entity';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const inventarioRepo = dataSource.getRepository(Inventario);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  const productosProv = await productoProveedorRepo.find();
  if (productosProv.length === 0) {
    console.log('No hay producto_proveedor. Saltando seeder de inventario.');
    return;
  }

  const inventarios: Inventario[] = [];
  const almacenes = [
    'Almacen A',
    'Frigorifico A',
    'Bodega A',
    'Almacen B',
    'Frigorifico B',
    'Bodega B',
  ];
  for (const pp of productosProv) {
    const inventario = new Inventario();
    inventario.productoProveedor = pp;
    inventario.cantidad_actual = faker.number.int({ min: 0 });
    inventario.cantidad_minima = faker.number.int({ min: 0 });
    inventario.cantidad_maxima = faker.number.int({ min: 1 });
    inventario.ubicacion_almacen = faker.helpers.arrayElement(almacenes);
    inventario.fecha_entrada = faker.date.recent({ days: 90 });
    inventario.fecha_caducidad = faker.date.soon({
      days: faker.number.int({ min: 1, max: 365 }),
      refDate: inventario.fecha_entrada,
    });

    inventarios.push(inventario);
  }

  if (inventarios.length > 0) {
    await inventarioRepo.save(inventarios);
  }

  console.log('Seeder de historial_precio ejecutado correctamente.');
};
