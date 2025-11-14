// src/seeders/producto.seeder.ts
import { DataSource } from 'typeorm';
import { Producto } from '../modules/productos/producto.entity/producto.entity';
import { ProductoProveedor } from '../modules/productos/producto-proveedor.entity/producto-proveedor.entity';
import { ProductoAlergeno } from '../modules/productos/producto-alergeno.entity/producto-alergeno.entity';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';
import {
  UnidadProducto,
  TipoProducto,
  AlergenoProducto,
} from '../modules/productos/enums/producto.enums';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const productoRepo = dataSource.getRepository(Producto);
  const proveedorRepo = dataSource.getRepository(Proveedor);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);
  const productoAlergenoRepo = dataSource.getRepository(ProductoAlergeno);

  await dataSource.query(`
  TRUNCATE TABLE 
    "producto_alergeno",
    "producto_proveedor",
    "producto"
  RESTART IDENTITY CASCADE;
  `);

  const proveedores = await proveedorRepo.find();
  if (proveedores.length === 0) {
    throw new Error('No hay proveedores. Ejecuta primero proveedor.seeder.ts');
  }

  const productos: Producto[] = [];
  for (let i = 0; i < 15; i++) {
    const producto = productoRepo.create({
      nombre: faker.commerce.productName(),
      marca: faker.company.name(),
      descripcion: faker.commerce.productDescription(),
      unidad: faker.helpers.arrayElement(Object.values(UnidadProducto)),
      caducidad: faker.datatype.boolean(0.3)
        ? faker.date.soon({ days: 60 })
        : undefined,
      pathImg: faker.image.url({ width: 640, height: 480 }),
      tipo: faker.helpers.arrayElement(Object.values(TipoProducto)),
    });
    productos.push(producto);
  }
  await productoRepo.save(productos);

  const productoProveedores: ProductoProveedor[] = [];
  for (const producto of productos) {
    const numProveedores = faker.number.int({
      min: 1,
      max: Math.min(3, proveedores.length),
    });
    const proveedoresAleatorios = faker.helpers
      .shuffle(proveedores)
      .slice(0, numProveedores);

    for (const proveedor of proveedoresAleatorios) {
      const pp = productoProveedorRepo.create({
        producto,
        proveedor,
        precioUnitario: parseFloat(
          faker.commerce.price({ min: 5, max: 200, dec: 2 })
        ),
        marca: producto.marca,
        codigoBarras: faker.string.numeric(13),
      });
      productoProveedores.push(pp);
    }
  }
  await productoProveedorRepo.save(productoProveedores);

  const alergenos: ProductoAlergeno[] = [];
  const posiblesAlergenos = Object.values(AlergenoProducto);

  for (const producto of productos) {
    const numAlergenos = faker.number.int({ min: 0, max: 3 });
    const alergenosSeleccionados = faker.helpers.arrayElements(
      posiblesAlergenos,
      numAlergenos
    );

    for (const alergeno of alergenosSeleccionados) {
      const pa = productoAlergenoRepo.create({
        id_producto: producto.id,
        producto,
        alergeno,
      });
      alergenos.push(pa);
    }
  }
  if (alergenos.length > 0) {
    await productoAlergenoRepo.save(alergenos);
  }

  console.log(
    'Seeder de productos, proveedores y alérgenos ejecutado correctamente.'
  );
};
