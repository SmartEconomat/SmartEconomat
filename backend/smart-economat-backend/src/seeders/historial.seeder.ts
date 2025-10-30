import { DataSource } from 'typeorm';
import { ProductoProveedor } from 'src/modules/productos/producto-proveedor.entity/producto-proveedor.entity';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);


  
}