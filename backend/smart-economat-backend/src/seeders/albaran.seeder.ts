import { SeedContext } from './seed-context';
import { faker } from '@faker-js/faker';
import { Albaran } from '../modules/albaran/albaran.entity/albaran.entity';
import { RecepcionPedido } from '../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { AlbaranPedidoRecepcion } from '../modules/albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

export const runSeeder = async (context: SeedContext) => {
  const dataSource = context.getDataSource();
  const albaranRepo = dataSource.getRepository(Albaran);
  const recepcionPedidoRepo = dataSource.getRepository(RecepcionPedido);
  const albaranPedidoRepo = dataSource.getRepository(AlbaranPedidoRecepcion);

  await dataSource.query(
    `TRUNCATE TABLE "albaran_pedido_recepcion" RESTART IDENTITY CASCADE;`
  );
  await dataSource.query(`TRUNCATE TABLE "albaran" RESTART IDENTITY CASCADE;`);

  const recepcionPedidos = await recepcionPedidoRepo.find({
    relations: ['pedido', 'recepcion'],
  });

  if (!recepcionPedidos.length) {
    console.warn(SeederI18nHelper.getError('NO_RECEPCIONES_PRODUCTOS'));
    return;
  }

  const albaranes: Albaran[] = [];
  const numAlbaranes = process.env.NODE_ENV === 'test' ? 1 : 5;
  for (let i = 0; i < numAlbaranes; i++) {
    const nAlbaran = `ALB-${faker.date.future().getFullYear()}-${faker.string.numeric(4).padStart(4, '0')}`;
    const albaran = albaranRepo.create({
      nAlbaran,
      concordancia: faker.datatype.boolean(),
      fecha: faker.date.recent({ days: 10 }),
    });
    albaranes.push(albaran);
  }
  const savedAlbaranes = await albaranRepo.save(albaranes);

  for (const albaran of savedAlbaranes) {
    const randomLinks = faker.helpers.arrayElements(recepcionPedidos, {
      min: 1,
      max: 3,
    });
    for (const rp of randomLinks) {
      const link = albaranPedidoRepo.create({ albaran, recepcionPedido: rp });
      await albaranPedidoRepo.save(link);
    }
  }

  console.log(SeederI18nHelper.getSeederSuccess('albaranes'));
};
