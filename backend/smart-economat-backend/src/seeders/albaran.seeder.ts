import { DataSource } from 'typeorm';
import { Albaran } from '../modules/albaran/albaran.entity/albaran.entity';
import { RecepcionPedido } from 'src/modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { AlbaranPedidoRecepcion } from '../modules/albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const albaranRepo = dataSource.getRepository(Albaran);
  const recepcionPedidoRepo = dataSource.getRepository(RecepcionPedido);
  const albaranPedidoRepo = dataSource.getRepository(AlbaranPedidoRecepcion);

  const recepcionPedidos = await recepcionPedidoRepo.find();
  if (!recepcionPedidos.length) {
    console.log(
      'No se encontraron recepcion_pedidos, saltando seeder de albaranes.'
    );
    return;
  }

  const albaranes: Albaran[] = [];
  for (let i = 0; i < 5; i++) {
    const nAlbaran = `ALB-${faker.date.future().getFullYear()}-${faker.string.numeric({ length: 3 })}`;
    const concordancia = faker.datatype.boolean();

    const albaran = albaranRepo.create({
      nAlbaran,
      concordancia,
      fecha: faker.date.recent(),
    });

    albaranes.push(albaran);
  }

  const savedAlbaranes = await albaranRepo.save(albaranes);

  for (const albaran of savedAlbaranes) {
    const randomPedidos = faker.helpers.arrayElements(recepcionPedidos, 2);
    for (const recepcionPedido of randomPedidos) {
      const link = albaranPedidoRepo.create({
        albaran,
        recepcionPedido,
      });
      await albaranPedidoRepo.save(link);
    }
  }
};
