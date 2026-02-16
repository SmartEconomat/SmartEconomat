import { DataSource } from 'typeorm';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const proveedorRepo = dataSource.getRepository(Proveedor);

  await dataSource.query(
    `TRUNCATE TABLE "proveedor" RESTART IDENTITY CASCADE;`
  );

  const proveedores: Proveedor[] = [];
  for (let i = 0; i < 10; i++) {
    const proveedor = new Proveedor();
    proveedor.nombre = faker.company.name();
    proveedor.contacto = faker.person.fullName();

    const telefonoCompleto = faker.phone.number();
    proveedor.telefono =
      telefonoCompleto.length > 50
        ? telefonoCompleto.substring(0, 50)
        : telefonoCompleto;

    proveedores.push(proveedor);
  }

  await proveedorRepo.save(proveedores);
  console.log(SeederI18nHelper.getSeederSuccess('proveedores'));
};
