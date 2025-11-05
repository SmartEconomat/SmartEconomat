import { DataSource } from 'typeorm';
import { Albaran } from '../modules/albaran/albaran.entity/albaran.entity';
import { PedidoRecepcion } from 'src/modules/pedidos/pedido-recepcion.entity/pedido-recepcion.entity';

export const seedAlbaranes = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const albaranRepo = dataSource.getRepository(Albaran);
  const pedidoRecepcionRepo = dataSource.getRepository(PedidoRecepcion);

  const pedidosRecepcion = await pedidoRecepcionRepo.find();

  if (!pedidosRecepcion.length) {
    console.warn('No hay pedidos de recepción para asociar albaranes.');
    return;
  }

  const albaranes: Albaran[] = [];

  for (let i = 0; i < 5; i++) {
    const n_albaran = `ALB-${faker.date.future().getFullYear()}-${faker.string.numeric({ length: 3 })}`;
    const concordancia = faker.datatype.boolean();

    const albaran = albaranRepo.create({
      n_albaran,
      concordancia,
    });

    albaranes.push(albaran);
  }

  const savedAlbaranes = await albaranRepo.save(albaranes);

  pedidosRecepcion[0].albaranes = savedAlbaranes.slice(0, 2);
  await pedidoRecepcionRepo.save(pedidosRecepcion[0]);

  console.log('Seeder de albaranes ejecutado correctamente.');
};
