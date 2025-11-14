import { DataSource } from 'typeorm';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';

const NUM_PROVEEDORES = 8;

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const proveedorRepo = dataSource.getRepository(Proveedor);
  await dataSource.query(
    `TRUNCATE TABLE "proveedor" RESTART IDENTITY CASCADE;`
  );
  const existentes = await proveedorRepo.count();
  if (existentes > 0) {
    console.log('Proveedores ya existen. Saltando...');
    return;
  }

  const proveedores: Proveedor[] = [];
  for (let i = 0; i < NUM_PROVEEDORES; i++) {
    const proveedor = new Proveedor();
    proveedor.nombre = faker.company.name();
    proveedor.contacto = faker.person.fullName();
    proveedores.push(proveedor);
  }

  await proveedorRepo.save(proveedores);
  console.log('Seeder de proveedores ejecutado correctamente.');
};
