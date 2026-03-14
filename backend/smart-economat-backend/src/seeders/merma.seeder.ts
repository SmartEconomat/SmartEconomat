import { DataSource } from 'typeorm';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { Merma } from '../modules/merma/merma.entity/merma.entity';
import { MotivoMerma } from '../modules/merma/enums/merma.enums';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';

const NUM_MERMAS = process.env.NODE_ENV === 'test' ? 3 : 20;

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const mermaRepo = dataSource.getRepository(Merma);
  const productoRepo = dataSource.getRepository(Producto);
  const usuarioRepo = dataSource.getRepository(Usuario);

  const productos = await productoRepo.find();
  const usuarios = await usuarioRepo.find();

  if (productos.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_PRODUCTOS'));
  }

  const motivos = Object.values(MotivoMerma);
  const mermas: Merma[] = [];

  for (let i = 0; i < NUM_MERMAS; i++) {
    const merma = mermaRepo.create({
      producto: faker.helpers.arrayElement(productos),
      usuario:
        usuarios.length > 0
          ? faker.helpers.maybe(() => faker.helpers.arrayElement(usuarios))
          : undefined,
      cantidad: faker.number.float({ min: 0.1, max: 50, fractionDigits: 3 }),
      motivo: faker.helpers.arrayElement(motivos),
      notas: faker.helpers.maybe(() => faker.lorem.sentence()),
    });

    mermas.push(merma);
  }

  await mermaRepo.save(mermas);

  console.log(
    SeederI18nHelper.getSeederSuccess('mermas', { count: mermas.length })
  );
};
