import { DataSource, DeepPartial } from 'typeorm';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { ProductoAlergeno } from '../modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';
import {
  UnidadProducto,
  TipoProducto,
  AlergenoProducto,
} from '../modules/producto/enums/producto.enums';
import { SEEDER_MESSAGES } from './constants/messages';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const productoRepo = dataSource.getRepository(Producto);
  const proveedorRepo = dataSource.getRepository(Proveedor);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);
  const productoAlergenoRepo = dataSource.getRepository(ProductoAlergeno);

  const proveedores = await proveedorRepo.find();
  if (proveedores.length === 0) {
    throw new Error(SEEDER_MESSAGES.errors.NO_PROVEEDORES);
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
      tipo: faker.helpers.arrayElement(Object.values(TipoProducto)),
      pathImg: faker.image.url({ width: 640, height: 480 }),
      cantidad: faker.number.int({ min: 1, max: 500 }),
      codigoDeBarra: faker.string.alphanumeric(10).toUpperCase(),
    } as DeepPartial<Producto>);
    productos.push(producto);
  }
  const productosGuardados = await productoRepo.save(productos);

  const productoProveedores: ProductoProveedor[] = [];
  for (const producto of productosGuardados) {
    const numProveedores = faker.number.int({
      min: 1,
      max: Math.min(3, proveedores.length),
    });

    const proveedoresAleatorios = faker.helpers.arrayElements(
      proveedores,
      numProveedores
    );

    for (const proveedor of proveedoresAleatorios) {
      const pp = productoProveedorRepo.create({
        producto,
        proveedor,
        precioUnitario: parseFloat(faker.commerce.price({ min: 5, max: 200 })),
        marca: producto.marca,
        codigoBarras: faker.string.numeric({ length: 13 }),
      } as DeepPartial<ProductoProveedor>);
      productoProveedores.push(pp);
    }
  }
  await productoProveedorRepo.save(productoProveedores);

  const alergenos: ProductoAlergeno[] = [];
  const posiblesAlergenos = Object.values(AlergenoProducto);
  for (const producto of productosGuardados) {
    const numAlergenos = faker.number.int({ min: 0, max: 3 });
    const seleccionados = faker.helpers.arrayElements(
      posiblesAlergenos,
      numAlergenos
    );

    for (const alergeno of seleccionados) {
      alergenos.push(
        productoAlergenoRepo.create({
          producto,
          alergeno,
        } as DeepPartial<ProductoAlergeno>)
      );
    }
  }
  if (alergenos.length > 0) await productoAlergenoRepo.save(alergenos);

  console.log(
    '✅ Catálogo de productos y relaciones con proveedores generado.'
  );
};
