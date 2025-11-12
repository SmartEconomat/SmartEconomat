import { DataSource } from 'typeorm';
import { Producto } from '../modules/productos/producto.entity/producto.entity';
import { ProductoProveedor } from '../modules/productos/producto-proveedor.entity/producto-proveedor.entity';
import {
  UnidadProducto,
  TipoProducto,
} from '../modules/productos/enums/producto.enums';
import { Proveedor } from 'src/modules/proveedor/proveedor.entity/proveedor.entity';
import { HistorialPrecio } from 'src/modules/productos/historial-precio-proveedor.entity/historial.entity';
export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const productoRepo = dataSource.getRepository(Producto);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);
  const proveedorRepo = dataSource.getRepository(Proveedor);
  const historialPrecioRepo = dataSource.getRepository(HistorialPrecio);
  let proveedores = await proveedorRepo.find();
  const name = (faker.company.name as () => string)();
  const fullName = (faker.person.fullName as () => string)();

  if (!proveedores.length) {
    const nuevosProveedores: Proveedor[] = [];
    for (let i = 0; i < 5; i++) {
      const proveedor = proveedorRepo.create({
        nombre: name,
        contacto: fullName,
      });
      nuevosProveedores.push(proveedor);
    }
    proveedores = await proveedorRepo.save(nuevosProveedores);
  }

  const productos: Producto[] = [];
  for (let i = 0; i < 10; i++) {
    const productName = (faker.commerce.productName as () => string)();
    const companyName = (faker.company.name as () => string)();
    const productDescription = (
      faker.commerce.productDescription as () => string
    )();
    const unidad = (faker.helpers.arrayElement as <T>(array: T[]) => T)(
      Object.values(UnidadProducto)
    ) as UnidadProducto;
    const caducidad = (faker.date.soon as () => Date)();
    const pathImg = (faker.image.url as () => string)();
    const tipo = (faker.helpers.arrayElement as <T>(array: T[]) => T)(
      Object.values(TipoProducto)
    ) as TipoProducto;

    const producto = productoRepo.create({
      nombre: productName,
      marca: companyName,
      descripcion: productDescription,
      unidad,
      caducidad,
      pathImg,
      tipo,
    });
    productos.push(producto);
  }
  await productoRepo.save(productos);

  const productoProveedores: ProductoProveedor[] = [];
  for (const producto of productos) {
    const proveedoresCount = (
      faker.number.int as (options: { min: number; max: number }) => number
    )({
      min: 1,
      max: proveedores.length,
    });

    const proveedoresAsignados = (
      faker.helpers.shuffle as <T>(array: T[]) => T[]
    )(proveedores).slice(0, proveedoresCount);

    const precioUnitario = parseFloat(
      (
        faker.commerce.price as (opts: {
          min: number;
          max: number;
          dec: number;
        }) => string
      )({ min: 10, max: 100, dec: 2 })
    );
    const codigoBarras = (
      faker.string.numeric as (opts: { min: number; max: number }) => string
    )({
      max: 12,
      min: 12,
    });
    for (const proveedor of proveedoresAsignados) {
      const productoProveedor = productoProveedorRepo.create({
        producto,
        proveedor,
        precioUnitario: precioUnitario,
        marca: producto.marca,
        codigoBarras: codigoBarras,
      });
      productoProveedores.push(productoProveedor);
    }
  }

  await productoProveedorRepo.save(productoProveedores);
  console.log('Seeder de productos y proveedores ejecutado correctamente.');

  const historial_precio: HistorialPrecio[] = [];
  for (const productoProveedor of productoProveedores) {
    const historial = historialPrecioRepo.create({
      productoProveedor: { id: productoProveedor.id } as ProductoProveedor,
      precio: productoProveedor.precioUnitario ?? 0,
      fecha: faker.date.recent({ days: 90 }),
    });

    historial_precio.push(historial);
  }

  await historialPrecioRepo.save(historial_precio);
};
