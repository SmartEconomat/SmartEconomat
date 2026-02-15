import { DataSource } from 'typeorm';
import { Albaran } from '../modules/albaran/albaran.entity/albaran.entity';
import { RecepcionPedido } from '../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { AlbaranPedidoRecepcion } from '../modules/albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import { SEEDER_MESSAGES } from './constants/messages';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const albaranRepo = dataSource.getRepository(Albaran);
  const recepcionPedidoRepo = dataSource.getRepository(RecepcionPedido);
  const albaranPedidoRepo = dataSource.getRepository(AlbaranPedidoRecepcion);

  await dataSource.query(
    `TRUNCATE TABLE "albaran_pedido_recepcion", "albaran" RESTART IDENTITY CASCADE;`
  );

  const recepcionPedidos = await recepcionPedidoRepo.find({
    relations: ['pedido', 'recepcion'],
  });

  if (!recepcionPedidos.length) {
    throw new Error(SEEDER_MESSAGES.errors.NO_RECEPCIONES_PRODUCTOS);
  }

  const albaranes: Albaran[] = [];
  for (let i = 0; i < 5; i++) {
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

  console.log('Seeder de albaranes ejecutado correctamente.');
};
