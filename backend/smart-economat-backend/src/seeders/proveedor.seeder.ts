import { faker } from '@faker-js/faker';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { SeedContext } from './seed-context';

export const runSeeder = async (context: SeedContext) => {
  const dataSource = context.getDataSource();
  const proveedorRepo = context.getRepository(Proveedor);

  await dataSource.query(
    `TRUNCATE TABLE "proveedor" RESTART IDENTITY CASCADE;`
  );

  const proveedores: Proveedor[] = [];
  const numProveedores = process.env.NODE_ENV === 'test' ? 2 : 10;
  for (let i = 0; i < numProveedores; i++) {
    const proveedor = new Proveedor();
    proveedor.nombre = faker.company.name();
    proveedor.email = faker.internet.email();
    proveedor.direccion = faker.location.streetAddress();
    proveedor.nif = faker.string.alphanumeric(9).toUpperCase();

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
